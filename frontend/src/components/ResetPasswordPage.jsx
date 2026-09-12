import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Sparkles
} from 'lucide-react';

import { apiService } from '../services/apiService';

export default function ResetPasswordPage({
  token,
  onBackToLogin,
  onPasswordReset
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please enter your new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const result = await apiService.resetPassword(
        token,
        password
      );

      if (!result.success) {
        setError(
          result.error ||
          'Unable to reset password.'
        );
        return;
      }

      onPasswordReset(result.user);

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
            Forge a new password.
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
                Reset password
              </h2>

              <p className="text-xs text-slate-500">
                Choose a new password.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* New password */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                New password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-12 outline-none focus:border-cyan-400 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword
                    ? <EyeOff className="w-5 h-5" />
                    : <Eye className="w-5 h-5" />
                  }
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Confirm new password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-12 outline-none focus:border-cyan-400 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword
                    ? <EyeOff className="w-5 h-5" />
                    : <Eye className="w-5 h-5" />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 rounded-xl transition"
            >
              {loading
                ? 'Resetting password...'
                : 'Reset password'}
            </button>

          </form>

          <p className="text-xs text-slate-500 text-center mt-5">
            Reset tokens expire after 15 minutes.
          </p>

        </div>
      </div>
    </div>
  );
}