// Voice input client for the "What's overwhelming you today?" mic button.
//
// Captures the mic, downsamples to 16kHz mono PCM16, and streams it as
// Sarvam-shaped `{"event":"audio_input","audio":"<base64>"}` frames over a
// WebSocket to OUR backend at /ws/stt, which proxies straight through to
// Sarvam AI's realtime STT. We only ever talk to our own backend — the
// Sarvam API key never reaches the browser.
//
// Usage:
//   const rec = new VoiceRecorder({
//     onStateChange: (state) => ...,      // 'connecting' | 'listening' | 'processing' | 'idle' | 'error'
//     onPartialTranscript: (text) => ...,
//     onFinalTranscript: (text, language) => ...,
//     onError: (message) => ...,
//   });
//   await rec.start();
//   rec.stop(); // also called automatically after the first final transcript

import { apiService } from "./apiService";

const TARGET_SAMPLE_RATE = Number(import.meta.env.VITE_SARVAM_SAMPLE_RATE || 16000);

function getWsBaseUrl() {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    // Strip a trailing "/api" (or any path) and swap the protocol for ws(s)://
    const httpBase = apiBase.replace(/\/api\/?$/, "");
    return httpBase.replace(/^http/i, "ws");
}

function floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // little-endian
    }
    return buffer;
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
    if (outputSampleRate === inputSampleRate) return buffer;
    const ratio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, buffer.length - 1);
        const t = srcIndex - srcIndexFloor;
        result[i] = buffer[srcIndexFloor] * (1 - t) + buffer[srcIndexCeil] * t; // linear interpolation
    }
    return result;
}

function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export class VoiceRecorder {
    constructor({ onStateChange, onPartialTranscript, onFinalTranscript, onError } = {}) {
        this.onStateChange = onStateChange || (() => { });
        this.onPartialTranscript = onPartialTranscript || (() => { });
        this.onFinalTranscript = onFinalTranscript || (() => { });
        this.onError = onError || (() => { });

        this.ws = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.processorNode = null;
        this._stopped = true;
    }

    async start() {
        if (!("mediaDevices" in navigator)) {
            this.onError("Microphone access isn't supported in this browser.");
            this.onStateChange("error");
            return;
        }

        const token = apiService.getToken();
        if (!token) {
            this.onError("You need to be signed in to use voice input.");
            this.onStateChange("error");
            return;
        }

        this._stopped = false;
        this.onStateChange("connecting");

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            this.onError("Microphone permission was denied.");
            this.onStateChange("error");
            return;
        }

        const wsUrl = `${getWsBaseUrl()}/ws/stt?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            this._setupAudioPipeline();
            this.onStateChange("listening");
        };

        this.ws.onmessage = (event) => this._handleServerEvent(event.data);

        this.ws.onerror = () => {
            this.onError("Lost connection to the voice recognition service.");
            this.onStateChange("error");
            this.stop();
        };

        this.ws.onclose = () => {
            if (!this._stopped) this.stop();
        };
    }

    _setupAudioPipeline() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

        // ScriptProcessorNode is deprecated but universally supported and simple;
        // buffer size 4096 gives ~85-260ms chunks depending on the device rate.
        this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processorNode.onaudioprocess = (e) => {
            if (this._stopped || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const downsampled = downsampleBuffer(inputData, this.audioContext.sampleRate, TARGET_SAMPLE_RATE);
            const pcm16 = floatTo16BitPCM(downsampled);
            const base64Audio = arrayBufferToBase64(pcm16);

            this.ws.send(JSON.stringify({ event: "audio_input", audio: base64Audio }));
        };

        this.sourceNode.connect(this.processorNode);
        // Some browsers require the processor to be connected to a destination to fire onaudioprocess.
        this.processorNode.connect(this.audioContext.destination);
    }

    _handleServerEvent(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        switch (msg.event) {
            case "transcript.partial":
                this.onPartialTranscript(msg.text || "", msg.language);
                break;
            case "transcript.final":
                this.onFinalTranscript(msg.text || "", msg.language);
                this.stop(); // one task description per voice-quest — stop after the first final
                break;
            case "error":
                this.onError(msg.message || "Voice recognition error");
                if (msg.is_fatal) {
                    this.onStateChange("error");
                    this.stop();
                }
                break;
            // session.begin / vad.speech_start / vad.speech_end / session.end / pong: no UI action needed yet
            default:
                break;
        }
    }

    stop() {
        if (this._stopped) return;
        this._stopped = true;

        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ event: "end" }));
            }
            this.ws?.close();
        } catch {
            /* no-op */
        }
        this.ws = null;

        this.processorNode?.disconnect();
        this.sourceNode?.disconnect();
        this.processorNode = null;
        this.sourceNode = null;

        if (this.audioContext && this.audioContext.state !== "closed") {
            this.audioContext.close().catch(() => { });
        }
        this.audioContext = null;

        this.mediaStream?.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
    }
}