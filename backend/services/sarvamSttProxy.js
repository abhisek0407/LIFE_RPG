import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { URL } from "node:url";

const STT_PATH = "/ws/stt";

function buildSarvamUrl(clientQuery) {
    const base = process.env.SARVAM_STT_WS_URL || "wss://api.sarvam.ai/speech-to-text-realtime/ws";
    const url = new URL(base);

    const params = {
        language_code: process.env.SARVAM_STT_LANGUAGE_CODE || "auto",
        model: process.env.SARVAM_STT_MODEL || "saaras:v3-realtime",
        sample_rate: process.env.SARVAM_STT_SAMPLE_RATE || "16000",
        encoding: "linear16",
        stream_type: "balanced",
        endpointing: "vad",
        // Allow the client to override non-sensitive tuning params per-connection.
        ...(clientQuery.stream_type ? { stream_type: clientQuery.stream_type } : {}),
        ...(clientQuery.mode ? { mode: clientQuery.mode } : {}),
        ...(clientQuery.language_code ? { language_code: clientQuery.language_code } : {}),
    };

    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
}

function authenticateUpgrade(req) {
    const { searchParams } = new URL(req.url, "http://localhost");
    const token = searchParams.get("token");
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

export function attachSarvamSttProxy(httpServer) {
    const wss = new WebSocketServer({ noServer: true });

    httpServer.on("upgrade", (req, socket, head) => {
        const { pathname } = new URL(req.url, "http://localhost");
        if (pathname !== STT_PATH) return; // let other upgrade handlers (if any) deal with it

        const decoded = authenticateUpgrade(req);
        if (!decoded) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (clientWs) => {
            wss.emit("connection", clientWs, req);
        });
    });

    wss.on("connection", (clientWs, req) => {
        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            clientWs.send(JSON.stringify({
                event: "error",
                code: "sarvam_not_configured",
                is_fatal: true,
                message: "Voice input is not configured on the server (missing SARVAM_API_KEY).",
            }));
            clientWs.close(1011, "SARVAM_API_KEY not configured");
            return;
        }

        const { searchParams } = new URL(req.url, "http://localhost");
        const clientQuery = Object.fromEntries(searchParams.entries());
        const sarvamUrl = buildSarvamUrl(clientQuery);

        const upstream = new WebSocket(sarvamUrl, {
            headers: { "API-SUBSCRIPTION-KEY": apiKey },
        });

        let pendingFromClient = [];
        let closed = false;

        const cleanup = () => {
            if (closed) return;
            closed = true;
            pendingFromClient = [];
            if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
                upstream.close();
            }
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close();
            }
        };

        upstream.on("open", () => {
            pendingFromClient.forEach((msg) => upstream.send(msg));
            pendingFromClient = [];
        });

        upstream.on("message", (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data.toString());
            }
        });

        upstream.on("close", (code, reason) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close(code === 1005 ? 1000 : code, reason?.toString() || "");
            }
            cleanup();
        });

        upstream.on("error", (err) => {
            console.error("[sarvamSttProxy] upstream error:", err.message);
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                    event: "error",
                    code: "upstream_error",
                    is_fatal: true,
                    message: "Lost connection to the speech recognition service.",
                }));
            }
            cleanup();
        });

        clientWs.on("message", (data) => {
            if (upstream.readyState === WebSocket.OPEN) {
                upstream.send(data.toString());
            } else if (upstream.readyState === WebSocket.CONNECTING) {
                pendingFromClient.push(data.toString());
            }
            // if upstream is closing/closed, silently drop — client will get the close event
        });

        clientWs.on("close", cleanup);
        clientWs.on("error", cleanup);
    });

    return wss;
}
