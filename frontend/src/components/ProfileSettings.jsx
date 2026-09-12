import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Image,
  Calendar,
  Save,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { apiService } from "../services/apiService";

export default function ProfileSettings({
  user,
  onUpdateUser,
  onBack,
}) {
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email] = useState(user?.email || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [age, setAge] = useState(user?.age ?? "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setUsername(user?.username || "");
    setGender(user?.gender || "");
    setAge(user?.age ?? "");
    setProfilePic(user?.profilePic || "");
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !username.trim() || !gender || !age) {
      setError("Please fill in all required fields.");
      return;
    }

    const numericAge = Number(age);

    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
      setError("Age must be a whole number between 13 and 120.");
      return;
    }

    try {
      setSaving(true);

      const updatedUser = await apiService.updateUserProfile({
        name: name.trim(),
        username: username.trim(),
        gender,
        age: numericAge,
        profilePic: profilePic.trim() || null,
      });

      if (!updatedUser) {
        throw new Error("Profile update failed.");
      }

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);
      setError(err?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-rpg-card border border-slate-200 dark:border-rpg-border rounded-3xl shadow-sm overflow-hidden">

        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-rpg-border">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <User className="w-7 h-7 text-cyan-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Profile Settings
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Update your account information and profile picture.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              {success}
            </div>
          )}

          {/* Profile picture */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Profile picture URL
            </label>

            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>

              <div className="relative flex-1">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                <input
                  type="url"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Use a publicly accessible image URL.
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Full name
            </label>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Username
            </label>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-500 cursor-not-allowed"
              />
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Email cannot be changed from profile settings.
            </p>
          </div>

          {/* Gender + Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Gender
              </label>

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-3 outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Age
              </label>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />

                <input
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}

              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}