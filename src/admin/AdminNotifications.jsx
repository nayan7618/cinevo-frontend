import React, { useCallback, useEffect, useState } from "react";
import api from "../services/api"

import {
  Bell,
  Send,
  Trash2,
  RefreshCw,
  Loader2,
  Users,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  Megaphone,
} from "lucide-react";



const TYPE_OPTIONS = [
  {
    value: "INFO",
    label: "Info",
    icon: Info,
  },
  {
    value: "SUCCESS",
    label: "Success",
    icon: CheckCircle2,
  },
  {
    value: "WARNING",
    label: "Warning",
    icon: AlertCircle,
  },
  {
    value: "PROMOTION",
    label: "Promotion",
    icon: Megaphone,
  },
];

const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString();
  } catch {
    return "—";
  }
};

const getTypeStyle = (type) => {
  switch (String(type || "").toUpperCase()) {
    case "SUCCESS":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "WARNING":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "PROMOTION":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    default:
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }
};

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");

  const [audience, setAudience] = useState("ALL");
  const [userId, setUserId] = useState("");

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // =====================================================
  // FETCH ADMIN NOTIFICATIONS
  // =====================================================

  const fetchNotifications = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          "/notifications/admin",
        );

        const data = response.data;

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Failed to load notifications",
          );
        }

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : [],
        );
      } catch (err) {
        console.error(
          "Admin notifications fetch error:",
          err.response?.data || err,
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load notifications",
        );

        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // =====================================================
  // SEND NOTIFICATION
  // =====================================================

  const handleSendNotification = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle) {
      setError("Notification title is required.");
      return;
    }

    if (!cleanMessage) {
      setError("Notification message is required.");
      return;
    }

    if (
      audience === "SPECIFIC" &&
      !userId.trim()
    ) {
      setError(
        "Please enter a user ID for a specific user.",
      );
      return;
    }

    try {
      setSending(true);

      const payload = {
        title: cleanTitle,
        message: cleanMessage,
        type,
        isGlobal: audience === "ALL",
        userId:
          audience === "SPECIFIC"
            ? userId.trim()
            : null,
      };

      const response = await api.post(
        "/notifications/admin",
        payload,
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to send notification",
        );
      }

      setSuccess(
        audience === "ALL"
          ? `Notification sent to ${response.data.recipientCount || 0} users.`
          : "Notification sent successfully.",
      );

      setTitle("");
      setMessage("");
      setType("INFO");
      setAudience("ALL");
      setUserId("");

      await fetchNotifications(true);
    } catch (err) {
      console.error(
        "Send notification error:",
        err.response?.data || err,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to send notification",
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/notifications/admin/${id}`,
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to delete notification",
        );
      }

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== id,
        ),
      );

      setSuccess(
        "Notification deleted successfully.",
      );
    } catch (err) {
      console.error(
        "Delete notification error:",
        err.response?.data || err,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete notification",
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <Bell
                size={21}
                className="text-red-500"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Send and manage Cinevo notifications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchNotifications(true)
            }
            disabled={refreshing}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
            <p className="text-sm text-emerald-400">
              {success}
            </p>
          </div>
        )}

        {/* =================================================
            CREATE NOTIFICATION
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Send
                size={18}
                className="text-red-400"
              />

              <div>
                <h2 className="font-semibold">
                  Create Notification
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Send a notification to Cinevo users
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSendNotification}
            className="p-5 sm:p-6"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {/* TITLE */}

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  maxLength={120}
                  placeholder="e.g. New Movie Added"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                />
              </div>

              {/* MESSAGE */}

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Message
                </label>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  maxLength={500}
                  rows={5}
                  placeholder="Write your notification message..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                />

                <div className="mt-1 text-right text-[11px] text-zinc-600">
                  {message.length}/500
                </div>
              </div>

              {/* TYPE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Type
                </label>

                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-red-500/50"
                >
                  {TYPE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* AUDIENCE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Audience
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAudience("ALL")
                    }
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition ${
                      audience === "ALL"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Users size={16} />
                    All Users
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAudience("SPECIFIC")
                    }
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition ${
                      audience ===
                      "SPECIFIC"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    <User size={16} />
                    Specific
                  </button>
                </div>
              </div>

              {/* USER ID */}

              {audience === "SPECIFIC" && (
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    User ID
                  </label>

                  <input
                    type="text"
                    value={userId}
                    onChange={(e) =>
                      setUserId(e.target.value)
                    }
                    placeholder="Paste user ID"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 font-mono text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/50"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    Specific user-er UUID ekhane dao.
                  </p>
                </div>
              )}
            </div>

            {/* SEND */}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* =================================================
            HISTORY
        ================================================= */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold">
                Notification History
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Previously sent notifications
              </p>
            </div>

            <Bell
              size={18}
              className="text-zinc-500"
            />
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2
                size={26}
                className="animate-spin text-red-500"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                <Bell
                  size={20}
                  className="text-zinc-600"
                />
              </div>

              <p className="mt-3 text-sm font-medium text-zinc-400">
                No notifications yet
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Sent notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {notifications.map(
                (notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.015] sm:flex-row sm:items-start sm:px-6"
                  >
                    {/* ICON */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <Bell
                        size={17}
                        className="text-red-400"
                      />
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {notification.title}
                        </h3>

                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${getTypeStyle(
                            notification.type,
                          )}`}
                        >
                          {notification.type ||
                            "INFO"}
                        </span>

                        <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-500">
                          {notification.userId
                            ? "Specific User"
                            : "Global"}
                        </span>
                      </div>

                      <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                        <span>
                          {formatDate(
                            notification.createdAt,
                          )}
                        </span>

                        {notification.user && (
                          <span>
                            {notification.user.name ||
                              notification.user.email}
                          </span>
                        )}

                        {typeof notification.isRead ===
                          "boolean" && (
                          <span>
                            {notification.isRead
                              ? "Read"
                              : "Unread"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          notification.id,
                        )
                      }
                      disabled={
                        deletingId ===
                        notification.id
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      aria-label="Delete notification"
                    >
                      {deletingId ===
                      notification.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;