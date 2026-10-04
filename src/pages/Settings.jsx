import { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  Play,
  Monitor,
  Languages,
  Lock,
  LogOut,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import { logoutUser } from "../features/auth/authSlice";
import Toast from "../components/Toast";

const ALLOWED_LANGUAGES = ["English", "Hindi", "Bengali"];

const ALLOWED_QUALITIES = ["auto", "480p", "720p", "1080p"];

// =============================================
// NORMALIZE LANGUAGE
// =============================================

const normalizeLanguage = (value) => {
  if (!value) return "English";

  const normalized = String(value).trim().toLowerCase();

  const languageMap = {
    english: "English",
    en: "English",

    hindi: "Hindi",
    hi: "Hindi",

    bengali: "Bengali",
    bangla: "Bengali",
    bn: "Bengali",
  };

  return languageMap[normalized] || "English";
};

// =============================================
// NORMALIZE QUALITY
// =============================================

const normalizeQuality = (value) => {
  if (!value) return "auto";

  const normalized = String(value).trim().toLowerCase();

  const qualityMap = {
    auto: "auto",

    480: "480p",
    "480p": "480p",

    720: "720p",
    "720p": "720p",

    1080: "1080p",
    "1080p": "1080p",
  };

  return qualityMap[normalized] || "auto";
};

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, loading: authLoading } = useSelector((state) => state.auth);

  // =============================================
  // SETTINGS
  // =============================================

  const [autoplay, setAutoplay] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [language, setLanguage] = useState("English");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =============================================
  // PASSWORD MODAL
  // =============================================

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);

  // =============================================
  // DELETE MODAL
  // =============================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // =============================================
  // TOAST
  // =============================================

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  // =============================================
  // FETCH SETTINGS
  // =============================================

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/settings`);

      if (response.data?.success) {
        const settings = response.data.settings;

        setAutoplay(settings?.autoplay ?? true);

        setQuality(normalizeQuality(settings?.quality));

        setLanguage(normalizeLanguage(settings?.language));
      }
    } catch (error) {
      console.error("Fetch settings error:", error);

      setToast({
        message: error.response?.data?.message || "Unable to load settings.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  // =============================================
  // SAVE SETTINGS
  // =============================================

  const savePreferences = async () => {
    const safeLanguage = normalizeLanguage(language);

    const safeQuality = normalizeQuality(quality);

    if (!ALLOWED_LANGUAGES.includes(safeLanguage)) {
      setToast({
        message: "Please select a valid language.",
        type: "error",
      });

      return;
    }

    if (!ALLOWED_QUALITIES.includes(safeQuality)) {
      setToast({
        message: "Please select a valid video quality.",
        type: "error",
      });

      return;
    }

    try {
      setSaving(true);

      const response = await api.patch(
        `/settings`,
        {
          autoplay,
          quality: safeQuality,
          language: safeLanguage,
        },
       
      );

      if (response.data?.success) {
        const settings = response.data.settings;

        setAutoplay(settings?.autoplay ?? autoplay);

        setQuality(normalizeQuality(settings?.quality));

        setLanguage(normalizeLanguage(settings?.language));

        setToast({
          message: "Your settings have been saved successfully.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Save settings error:", error);

      setToast({
        message: error.response?.data?.message || "Unable to save settings.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // CHANGE PASSWORD
  // =============================================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      setToast({
        message: "Please enter your current password.",
        type: "error",
      });

      return;
    }

    if (!newPassword.trim()) {
      setToast({
        message: "Please enter your new password.",
        type: "error",
      });

      return;
    }

    if (newPassword.length < 8) {
      setToast({
        message: "New password must be at least 8 characters.",
        type: "error",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({
        message: "New password and confirm password do not match.",
        type: "error",
      });

      return;
    }

    try {
      setPasswordLoading(true);

      const response = await api.patch(
        `/settings/password`,
        {
          currentPassword,
          newPassword,
        }
      );

      if (response.data?.success) {
        closePasswordModal();

        setToast({
          message: "Your password has been changed successfully.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);

      setToast({
        message: error.response?.data?.message || "Unable to change password.",
        type: "error",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // =============================================
  // DELETE ACCOUNT
  // =============================================

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);

      const response = await api.delete(`/settings/account`, {
        data: {
          confirm: true,
        },
      });

      if (response.data?.success) {
        setShowDeleteModal(false);

        try {
          await dispatch(logoutUser()).unwrap();
        } catch (error) {
          console.error("Logout after deletion failed:", error);
        }

        navigate("/login", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Delete account error:", error);

      setToast({
        message: error.response?.data?.message || "Unable to delete account.",
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // =============================================
  // LOGOUT
  // =============================================

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);

      setToast({
        message: "Unable to logout. Please try again.",
        type: "error",
      });
    }
  };

  // =============================================
  // CLOSE PASSWORD MODAL
  // =============================================

  const closePasswordModal = () => {
    if (passwordLoading) return;

    setShowPasswordModal(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // =============================================
  // USER CHECK
  // =============================================

  if (!user) {
    return null;
  }

  // =============================================
  // LOADING
  // =============================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={30} className="animate-spin text-red-500" />

          <p className="text-sm text-zinc-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================
          TOAST
      ========================================= */}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast({
            message: "",
            type: "success",
          })
        }
      />

      {/* =========================================
          PAGE
      ========================================= */}

      <div className="min-h-screen bg-[#08080c] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          {/* BACK */}

          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {/* HEADER */}

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your CINEVO account and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* =====================================
                ACCOUNT
            ===================================== */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Account</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Your basic account information.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SettingBox
                  icon={<User size={17} />}
                  label="Name"
                  value={user.name || "User"}
                />

                <SettingBox
                  icon={<Mail size={17} />}
                  label="Email"
                  value={user.email || "Not available"}
                />
              </div>
            </section>

            {/* =====================================
                PLAYBACK
            ===================================== */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Playback</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Customize your streaming experience.
                </p>
              </div>

              {/* AUTOPLAY */}

              <div className="flex flex-col gap-4 border-b border-white/5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Play size={18} className="text-zinc-400" />

                  <div>
                    <p className="text-sm font-medium">Autoplay</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Automatically start video playback
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoplay((prev) => !prev)}
                  aria-label="Toggle autoplay"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    autoplay ? "bg-red-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      autoplay ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* QUALITY */}

              <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Monitor size={18} className="text-zinc-400" />

                  <div>
                    <p className="text-sm font-medium">Video Quality</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Default streaming quality
                    </p>
                  </div>
                </div>

                <select
                  value={quality}
                  onChange={(e) => setQuality(normalizeQuality(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-500 sm:w-auto"
                >
                  <option value="auto">Auto</option>

                  <option value="480p">480p</option>

                  <option value="720p">720p</option>

                  <option value="1080p">1080p</option>
                </select>
              </div>
            </section>

            {/* =====================================
                LANGUAGE
            ===================================== */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Language</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Choose your preferred application language.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Languages size={18} className="text-zinc-400" />

                  <div>
                    <p className="text-sm font-medium">App Language</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Select the language used by CINEVO.
                    </p>
                  </div>
                </div>

                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(normalizeLanguage(e.target.value))
                  }
                  className="w-full rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-500 sm:w-auto"
                >
                  <option value="English">English</option>

                  <option value="Hindi">Hindi</option>

                  <option value="Bengali">Bengali</option>
                </select>
              </div>
            </section>

            {/* =====================================
                SECURITY
            ===================================== */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Security</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage your account security.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 text-left transition hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-zinc-400" />

                  <div>
                    <p className="text-sm font-medium">Change Password</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Update your account password
                    </p>
                  </div>
                </div>

                <span className="text-lg text-zinc-500">→</span>
              </button>
            </section>

            {/* =====================================
                SAVE
            ===================================== */}

            <button
              type="button"
              onClick={savePreferences}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Settings
                </>
              )}
            </button>

            {/* =====================================
                SESSION
            ===================================== */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Session</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Sign out from your current CINEVO account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={authLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={17} />
                    Logout
                  </>
                )}
              </button>
            </section>

            {/* =====================================
                DANGER ZONE
            ===================================== */}

            <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <Trash2 size={19} className="mt-0.5 shrink-0 text-red-500" />

                <div>
                  <h2 className="text-lg font-semibold text-red-400">
                    Danger Zone
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Permanently delete your CINEVO account.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="mt-5 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Delete Account
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================
          CHANGE PASSWORD MODAL
      ========================================= */}

      {showPasswordModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111116] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">Change Password</h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Keep your account secure.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={passwordLoading}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleChangePassword}
              className="space-y-5 p-5 sm:p-6"
            >
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((prev) => !prev)}
                disabled={passwordLoading}
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNewPassword}
                onToggle={() => setShowNewPassword((prev) => !prev)}
                disabled={passwordLoading}
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                disabled={passwordLoading}
              />

              <p className="text-xs text-zinc-500">
                Password must contain at least 8 characters.
              </p>

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          DELETE ACCOUNT MODAL
      ========================================= */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#111116] shadow-2xl">
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <ShieldAlert size={24} className="text-red-500" />
              </div>

              <h2 className="text-xl font-bold">Delete Account?</h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                This action is permanent. Your account and associated account
                data will be deleted.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// SETTING BOX
// =============================================

const SettingBox = ({ icon, label, value }) => {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2 text-zinc-500">
        {icon}

        <span className="text-xs">{label}</span>
      </div>

      <p className="break-all text-sm font-medium text-white">{value}</p>
    </div>
  );
};

// =============================================
// PASSWORD FIELD
// =============================================

const PasswordField = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          placeholder="Enter password"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white disabled:opacity-50"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Settings;
