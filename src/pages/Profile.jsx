import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, Mail, Crown, LogOut, ArrowLeft } from "lucide-react";

import { logoutUser } from "../features/auth/authSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#08080c] px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your CINEVO account
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-3xl font-bold">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* User info */}
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>

              <p className="mt-1 text-sm text-zinc-500">{user.email}</p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-zinc-300">
                <Crown size={14} className="text-yellow-500" />
                {user.subscription?.plan || "FREE"} Plan
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 text-zinc-500">
                <User size={16} />
                <span className="text-xs">Name</span>
              </div>

              <p className="text-sm font-medium">{user.name}</p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2 text-zinc-500">
                <Mail size={16} />
                <span className="text-xs">Email</span>
              </div>

              <p className="break-all text-sm font-medium">{user.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={18} />

            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
