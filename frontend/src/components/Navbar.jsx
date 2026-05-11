import { BarChart3, Compass, Search, UsersRound } from "lucide-react";

const NAV_ITEMS = [
  { id: "demo", label: "Feed", icon: Compass },
  { id: "item", label: "Items", icon: Search },
  { id: "user", label: "Users", icon: UsersRound },
  { id: "metrics", label: "Models", icon: BarChart3 },
];

export default function Navbar({ activePage, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <button className="text-left" onClick={() => onNavigate("demo")} type="button">
          <h1 className="text-xl font-semibold uppercase text-rose-700">Pin-teresting</h1>
        </button>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                  active
                    ? "bg-stone-950 text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                }`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
