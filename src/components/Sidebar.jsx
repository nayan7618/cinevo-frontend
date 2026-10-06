import {
  Home,
  Film,
  Tv,
  Search,
  Bookmark,
  History,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { logoutUser } from "../features/auth/authSlice";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mainLinks = [
    { name: "Home", path: "/home", icon: Home },
    { name: "Movies", path: "/movies", icon: Film },
    { name: "Series", path: "/series", icon: Tv },
    { name: "Search", path: "/search", icon: Search },
    { name: "My List", path: "/my-list", icon: Bookmark },
    { name: "History", path: "/history", icon: History },
  ];

  const closeMobile = () => setOpen(false);
  useEffect(()=> {
    window.dispatchEvent(
      new CustomEvent("cinebox:sidebar-state",{
        detail: {open},
      }),
    );
  }, [open])

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      setOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#111116]/95 text-white shadow-lg backdrop-blur lg:hidden"
      >
        <Menu size={22} />
      </button>
      {/* Mobile brand */}
      <Link
        to="/home"
        className="fixed left-16 top-3 z-[60] flex h-11 items-center rounded-xl px-1 text-lg font-extrabold tracking-tight lg:hidden"
      >
        <span className="text-white">CINE</span>
        <span className="text-red-500">BOX</span>
      </Link>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-white/10 bg-[#0b0b0f]
          px-4 py-5 shadow-2xl shadow-black/20
          transition-all duration-300 ease-out
          w-[280px]
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "lg:w-[84px]" : "lg:w-64"}
        `}
      >
        {/* Mobile edge chevron */}
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Close navigation"
          className="absolute -right-3 top-1/2 z-[70] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#17171d] text-zinc-300 shadow-xl transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Header */}
        <div
          className={`mb-8 flex items-center ${
            collapsed ? "lg:justify-center" : "justify-between"
          }`}
        >
          <Link to="/home" onClick={closeMobile} className="min-w-0">
            <div className={collapsed ? "lg:hidden" : ""}>
              <h1 className="text-2xl font-extrabold tracking-tight">
                <span className="text-white">CINE</span>
                <span className="text-red-500">BOX</span>
              </h1>
              <p className="mt-1 text-[10px] font-medium tracking-wide text-zinc-500">
                Your World of Entertainment
              </p>
            </div>

            {collapsed && (
              <span className="hidden text-lg font-extrabold tracking-tight lg:block">
                <span className="text-white">C</span>
                <span className="text-red-500">B</span>
              </span>
            )}
          </Link>

          {/* Mobile close */}
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={21} />
          </button>

          {/* Desktop collapse/expand */}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white lg:flex"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2">
          {mainLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMobile}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-3
                  text-sm font-medium transition-all duration-200
                  ${collapsed ? "lg:justify-center lg:px-3" : ""}
                  ${
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon size={19} className="shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>
                  {link.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-4">
          <NavLink
            to="/profile"
            onClick={closeMobile}
            className={({ isActive }) => `
              flex items-center gap-3 rounded-xl px-4 py-3
              text-sm font-medium transition
              ${collapsed ? "lg:justify-center lg:px-3" : ""}
              ${
                isActive
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            <User size={19} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Profile</span>
          </NavLink>

          <NavLink
            to="/settings"
            onClick={closeMobile}
            className={`
              mt-1 flex items-center gap-3 rounded-xl px-4 py-3
              text-sm font-medium text-zinc-400 transition
              hover:bg-white/5 hover:text-white
              ${collapsed ? "lg:justify-center lg:px-3" : ""}
            `}
          >
            <Settings size={19} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Settings</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className={`
              mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3
              text-sm font-medium text-zinc-400 transition
              hover:bg-red-500/10 hover:text-red-400
              ${collapsed ? "lg:justify-center lg:px-3" : ""}
            `}
          >
            <LogOut size={19} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
