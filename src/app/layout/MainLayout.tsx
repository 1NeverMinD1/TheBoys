import { NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/", label: "Главная", end: true },
  { to: "/clubs", label: "Клубы", end: false },
  { to: "/map", label: "Карта", end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-violet-600/20 text-violet-300"
      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
  }`;

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="text-lg font-black tracking-tight">
            Game<span className="text-violet-400">Clubs</span>
          </NavLink>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-800 py-6 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} GameClubs
      </footer>
    </div>
  );
}
