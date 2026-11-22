import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row">
        <p>&copy; {year} FormChat. A helper bot.</p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <a href="#features" className="transition hover:text-foreground">
            Features
          </a>
          <Link href="/login" className="transition hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="transition hover:text-foreground">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}