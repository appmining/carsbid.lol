"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useMagnetic } from "@/lib/useMagnetic";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

/** `/#siralama` lives on the home route, so compare only the path part. */
function isCurrent(pathname: string, href: string): boolean {
  const path = href.split("#")[0] || "/";
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.25);
  const headerRef = useRef<HTMLElement>(null);
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const NAV = [
    { href: "/#siralama", label: t("ranking") },
    { href: "/patronlar", label: t("patrons") },
    { href: "/hakkinda", label: t("about") },
    { href: "/kurallar", label: t("rules") },
  ];

  // The menu had no way out other than the toggle: no Escape, no click-away,
  // and the page kept scrolling behind it.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      /* Was transition-all, which animated every property that differs between
         the two states. Only these two actually change. */
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300 ${
        scrolled
          ? "border-border-soft/80 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70"
          : "border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 transition-[height] duration-300 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link href="/" locale={locale} className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-bg">
            <Logo />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            carsbid<span className="text-accent">.lol</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                aria-current={current ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface hover:text-text ${
                  current ? "text-text" : "text-text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            ref={ctaRef}
            href="/patronlar"
            locale={locale}
            className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-[background-color,transform] duration-150 ease-out hover:bg-accent-2 active:scale-[0.97]"
          >
            {t("becomePatron")}
          </Link>
        </div>

        {/* The language control sits in the bar itself on small screens rather
            than inside the menu: a visitor whose browser language pinned them
            to a language they don't read has to be able to see the way out. */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-lg text-text-muted hover:bg-surface [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"
            aria-label={t("menu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-border-soft bg-bg px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const current = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface hover:text-text ${
                    current ? "text-text" : "text-text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/patronlar"
              locale={locale}
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-bg"
            >
              {t("becomePatron")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
