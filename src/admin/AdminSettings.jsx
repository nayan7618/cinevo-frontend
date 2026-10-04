import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Settings,
  Save,
  RefreshCw,
  Globe2,
  Image,
  Wrench,
  UserPlus,
  Megaphone,
  PlayCircle,
  RectangleHorizontal,
  CheckCircle2,
} from "lucide-react";

// =====================================================
// DEFAULT FORM
// =====================================================

const DEFAULT_FORM = {
  siteName: "CINEVO",
  tagline: "Your World of Entertainment",
  logoUrl: "",
  faviconUrl: "",

  maintenanceMode: false,
  registrationEnabled: true,

  adsEnabled: true,
  preRollEnabled: true,
  midRollEnabled: true,
  postRollEnabled: true,
  bannerAdsEnabled: true,
};
// =====================================================
// TOGGLE
// =====================================================

const Toggle = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-red-600" : "bg-zinc-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
};

// =====================================================
// SETTING ROW
// =====================================================

const SettingRow = ({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
      </div>

      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
};

// =====================================================
// MAIN
// =====================================================

const AdminSettings = () => {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ===================================================
  // FETCH
  // ===================================================

  const fetchSettings = async (showRefresh = false) => {
    try {
      setError("");
      setSuccess("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(`/admin/settings`);

      const data = response.data;

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load settings");
      }

      const settings = data.settings || {};

      setForm({
        siteName: settings.siteName ?? DEFAULT_FORM.siteName,

        tagline: settings.tagline ?? DEFAULT_FORM.tagline,

        logoUrl: settings.logoUrl || "",

        faviconUrl: settings.faviconUrl || "",

        maintenanceMode: Boolean(settings.maintenanceMode),

        registrationEnabled: settings.registrationEnabled !== false,

        adsEnabled: settings.adsEnabled !== false,

        preRollEnabled: settings.preRollEnabled !== false,

        midRollEnabled: settings.midRollEnabled !== false,

        bannerAdsEnabled: settings.bannerAdsEnabled !== false,
      });
    } catch (err) {
      console.error("Admin settings fetch error:", err.response?.data || err);

      setError(
        err.response?.data?.message || err.message || "Failed to load settings",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchSettings();
  }, []);

  // ===================================================
  // INPUT
  // ===================================================

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===================================================
  // SAVE
  // ===================================================

  const handleSave = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        siteName: form.siteName.trim(),

        tagline: form.tagline.trim(),

        logoUrl: form.logoUrl.trim() || null,

        faviconUrl: form.faviconUrl.trim() || null,

        maintenanceMode: form.maintenanceMode,

        registrationEnabled: form.registrationEnabled,

        adsEnabled: form.adsEnabled,

        preRollEnabled: form.preRollEnabled,

        midRollEnabled: form.midRollEnabled,
        postRollEnabled: form.postRollEnabled,

        bannerAdsEnabled: form.bannerAdsEnabled,
      };

      const response = await api.patch(`/admin/settings`, payload);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to save settings");
      }

      const settings = response.data.settings || {};

      setForm({
        siteName: settings.siteName || "CINEVO",

        tagline: settings.tagline || "Your World of Entertainment",

        logoUrl: settings.logoUrl || "",

        faviconUrl: settings.faviconUrl || "",

        maintenanceMode: Boolean(settings.maintenanceMode),

        registrationEnabled: settings.registrationEnabled !== false,

        adsEnabled: settings.adsEnabled !== false,

        preRollEnabled: settings.preRollEnabled !== false,

        midRollEnabled: settings.midRollEnabled !== false,
        postRollEnabled: settings.postRollEnabled !== false,

        bannerAdsEnabled: settings.bannerAdsEnabled !== false,
      });

      setSuccess("Settings saved successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Save admin settings error:", err.response?.data || err);

      setError(
        err.response?.data?.message || err.message || "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/10">
          <RefreshCw size={25} className="animate-spin text-red-500" />
        </div>

        <p className="mt-4 text-sm text-zinc-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-[#08080c] text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <Settings size={21} className="text-red-500" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Settings
              </h1>

              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                Manage CINEVO platform configuration
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchSettings(true)}
          disabled={refreshing || saving}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
          <CheckCircle2 size={17} className="text-emerald-400" />

          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* =================================================
            GENERAL
        ================================================= */}

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Globe2 size={18} className="text-blue-400" />
              </div>

              <div>
                <h2 className="font-semibold">General</h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Basic information about your platform
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Site Name
              </label>

              <input
                type="text"
                value={form.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                maxLength={100}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                placeholder="CINEVO"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Tagline
              </label>

              <input
                type="text"
                value={form.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                maxLength={200}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                placeholder="Your World of Entertainment"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Logo URL
              </label>

              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Favicon URL
              </label>

              <input
                type="url"
                value={form.faviconUrl}
                onChange={(e) => updateField("faviconUrl", e.target.value)}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        {/* =================================================
            PLATFORM
        ================================================= */}

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                <Wrench size={18} className="text-yellow-400" />
              </div>

              <div>
                <h2 className="font-semibold">Platform</h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Control access and platform availability
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6">
            <SettingRow
              icon={<Wrench size={17} />}
              title="Maintenance Mode"
              description="Temporarily place the platform into maintenance mode."
              checked={form.maintenanceMode}
              onChange={(value) => updateField("maintenanceMode", value)}
              disabled={saving}
            />

            <SettingRow
              icon={<UserPlus size={17} />}
              title="User Registration"
              description="Allow new users to create accounts."
              checked={form.registrationEnabled}
              onChange={(value) => updateField("registrationEnabled", value)}
              disabled={saving}
            />
          </div>
        </section>

        {/* =================================================
            ADS
        ================================================= */}

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <Megaphone size={18} className="text-red-400" />
              </div>

              <div>
                <h2 className="font-semibold">Advertising</h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Control advertisement delivery
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6">
            <SettingRow
              icon={<Megaphone size={17} />}
              title="Ads Enabled"
              description="Enable advertising across the platform."
              checked={form.adsEnabled}
              onChange={(value) => updateField("adsEnabled", value)}
              disabled={saving}
            />

            <SettingRow
              icon={<PlayCircle size={17} />}
              title="Pre-roll Ads"
              description="Show advertisements before video playback."
              checked={form.preRollEnabled}
              onChange={(value) => updateField("preRollEnabled", value)}
              disabled={saving || !form.adsEnabled}
            />

            <SettingRow
              icon={<PlayCircle size={17} />}
              title="Mid-roll Ads"
              description="Allow advertisements during long-form playback."
              checked={form.midRollEnabled}
              onChange={(value) => updateField("midRollEnabled", value)}
              disabled={saving || !form.adsEnabled}
            />
            <SettingRow
              icon={<PlayCircle size={17} />}
              title="Post-roll Ads"
              description="Show advertisements after video playback ends."
              checked={form.postRollEnabled}
              onChange={(value) => updateField("postRollEnabled", value)}
              disabled={saving || !form.adsEnabled}
            />

            <SettingRow
              icon={<RectangleHorizontal size={17} />}
              title="Banner Ads"
              description="Enable banner advertisements on the platform."
              checked={form.bannerAdsEnabled}
              onChange={(value) => updateField("bannerAdsEnabled", value)}
              disabled={saving || !form.adsEnabled}
            />
          </div>
        </section>

        {/* =================================================
            SAVE
        ================================================= */}

        <div className="flex justify-end pb-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
