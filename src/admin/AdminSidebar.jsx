import {
  LayoutDashboard,
  Film,
  Tv,
  Layers,
  List,
  Image,
  Users,
  Bell,
  BarChart3,
  Settings,
  X,
  LogOut,
} from "lucide-react";

const AdminSidebar = ({
  activePage,
  onNavigate,
  open,
  onClose,
  onLogout,
}) => {
  const menu = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
    },
    {
      label: "Movies",
      icon: Film,
      path: "/admin/movies",
    },
    {
      label: "Series",
      icon: Tv,
      path: "/admin/series",
    },
    {
      label: "Genres",
      icon: List,
      path: "/admin/genres",
    },
    {
      label: "Home Sections",
      icon: LayoutDashboard,
      path: "/admin/home-sections",
    },
    {
      label: "Home Banners",
      icon: Image,
      path: "/admin/banners",
    },
    {
      label: "Users",
      icon: Users,
      path: "/admin/users",
    },
    {
      label: "Notifications",
      icon: Bell,
      path: "/admin/notifications",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/admin/analytics",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
    },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0b0b10] transition-transform duration-300 lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div>
            <h1 className="text-xl font-bold text-white">
              CINEVO
            </h1>

            <p className="text-xs text-red-500">
              ADMIN PANEL
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menu.map((item) => {
            const Icon = item.icon;

            const active =
              activePage === item.path;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  onNavigate(item.path);
                  onClose?.();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-red-600 text-white"
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;