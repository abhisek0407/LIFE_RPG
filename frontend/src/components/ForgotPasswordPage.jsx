import React, { useState } from 'react';
import {
  Mail,
  ArrowLeft,
  KeyRound,
  Sparkles
} from 'lucide-react';

import { apiService } from '../services/apiService';

export default function ForgotPasswordPage({
  onBackToLogin,
  onResetPassword
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');
    setResetToken('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);

      const result = await apiService.forgotPassword(email);

      if (!result.success) {
        setError(result.error || 'Unable to process request.');
        return;
      }

      setMessage(
        result.message ||
        'If an account exists with this email, a reset token has been generated.'
      );

      // Hackathon/demo flow:
      // Backend currently returns the reset token directly.
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server.');
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
            Recover your hero account.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-cyan-400" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Forgot password?
              </h2>
              <p className="text-xs text-slate-500">
                Enter your registered email.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl transition"
            >
              {loading ? 'Sending...' : 'Send reset request'}
            </button>

          </form>

          {/* Demo token */}
          {resetToken && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-300 font-semibold mb-2">
                Demo reset token
              </p>

              <div className="bg-slate-950 rounded-lg p-3 break-all font-mono text-xs text-amber-200">
                {resetToken}
              </div>

              <button
                type="button"
                onClick={() => onResetPassword(resetToken)}
                className="mt-3 w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-lg text-sm transition"
              >
                Continue to reset password
              </button>

              <p className="text-[10px] text-slate-500 mt-2">
                This token is shown because the current hackathon backend
                returns it directly for testing.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}