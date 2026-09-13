import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Without this, an uncaught error anywhere in the render tree unmounts the
// whole app and leaves a blank white page with no clue what happened —
// which is exactly what "blank page after registration" looked like.
// This catches it and offers a one-click way back in (the account/progress
// itself is never lost, since it's already saved server-side).
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("LifeRPG crashed while rendering:", error, info);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
                    <div className="text-center max-w-sm">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-5">
                            <AlertTriangle className="w-7 h-7 text-rose-400" />
                        </div>
                        <h1 className="text-xl font-bold mb-2">Something went sideways</h1>
                        <p className="text-slate-400 text-sm mb-6">
                            Your account and progress are safe on the server — this screen
                            just needs a refresh to catch up.
                        </p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}