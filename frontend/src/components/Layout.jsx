import Navbar from "./Navbar.jsx";

export default function Layout({ activePage, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-[#f4f5f2] text-stone-950">
      <Navbar activePage={activePage} onNavigate={onNavigate} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
