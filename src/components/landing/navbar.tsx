import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          FormChat
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-6 text-sm text-muted md:flex"
        >
          <a href="#features" className="transition hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-foreground">
            How it works
          </a>
          <a href="#demo" className="transition hover:text-foreground">
            Demo
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}