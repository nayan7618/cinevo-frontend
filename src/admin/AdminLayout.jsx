import { useState } from "react";
import {
  Menu,
  Bell,
} from "lucide-react";

import {
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import AdminSidebar from "./AdminSidebar";
import { logoutUser } from "../features/auth/authSlice";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const { user } = useSelector(
    (state) => state.auth
  );

  const handleLogout = async () => {
    try {
      await dispatch(
        logoutUser()
      ).unwrap();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Admin logout error:",
        error
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white">

      {/* SIDEBAR */}

      <AdminSidebar
        activePage={location.pathname}
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        onNavigate={(path) =>
          navigate(path)
        }
        onLogout={handleLogout}
      />

      {/* CONTENT */}

      <div className="lg:pl-72">

        {/* TOPBAR */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#08080c]/90 px-4 backdrop-blur-xl sm:px-6">

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400 transition hover:text-white lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* TITLE */}

          <div className="hidden lg:block">
            <p className="text-sm text-zinc-500">
              Admin Control Center
            </p>

            <h2 className="mt-1 text-sm font-semibold text-white">
              CINEVO Administration
            </h2>
          </div>

          {/* RIGHT */}

          <div className="ml-auto flex items-center gap-3">

            {/* NOTIFICATION */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/notifications"
                )
              }
              className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Bell size={19} />
            </button>

            {/* ADMIN USER */}

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "A"}
              </div>

              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white">
                  {user?.name ||
                    "Administrator"}
                </p>

                <p className="text-[10px] text-red-400">
                  ADMIN
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;