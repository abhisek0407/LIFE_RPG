import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
} from "lucide-react";
import { apiService } from "../services/apiService";

export default function LoginPage({
  onLogin,
  onSwitchToRegister,
  onForgotPassword,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiService.login(
        email.trim(),
        password
      );

      console.log("Login result:", result);

      if (!result || !result.success) {
        setError(
          result?.error ||
          "Login failed. Please check your email and password."
        );
        return;
      }

      onLogin(result.user);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err?.message ||
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-5">
            <Sparkles className="w-8 h-8" />
          </div>

          <h1 className="text-3xl font-bold">
            Life<span className="text-cyan-400">RPG</span>
          </h1>

          <p className="text-slate-400 mt-2">
            Continue your hero's journey.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">

          <h2 className="text-xl font-semibold mb-6">
            Sign in
          </h2>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-12 outline-none focus:border-cyan-400 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-5 h-5" />

              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>

          {/* Register */}
          <div className="mt-6 text-center">
            <span className="text-slate-400 text-sm">
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() => {
                console.log("Create one clicked");

                if (onSwitchToRegister) {
                  onSwitchToRegister();
                } else {
                  console.error(
                    "onSwitchToRegister was not passed to LoginPage"
                  );
                }
              }}
              className="ml-2 text-cyan-400 hover:text-cyan-300 font-semibold text-sm"
            >
              Create one
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}