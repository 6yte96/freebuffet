"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PROJECT_CONFIG } from "@/config";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  currentSection?: string;
}

const NAV_ITEMS = [
  { id: "session", label: "Session" },
  { id: "menu", label: "Menu" },
  { id: "free-tiers", label: "Free Tiers" },
  { id: "source", label: "Source" },
];

export function Header({ currentSection: initialSection = "home" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const { brand, links } = PROJECT_CONFIG;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Scroll-spy: highlight the nav item for the section in view
    const ids = NAV_ITEMS.map((i) => i.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock body scroll + handle Escape while drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className={`header ${isScrolled ? "scrolled" : ""}`}>
        <div className="masthead">
          <button
            className="drawer-toggle"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <span className="drawer-toggle-bar"></span>
            <span className="drawer-toggle-bar"></span>
            <span className="drawer-toggle-bar"></span>
          </button>

          <Link href="/" className="brand-link">
            {brand.name}
            <span>{brand.domainSuffix}</span>
          </Link>

          <p className="masthead-tagline">{brand.tagline}</p>
        </div>

        <nav className="nav" aria-label="Sections">
          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-link ${activeSection === item.id ? "active" : ""}`}
                aria-current={activeSection === item.id ? "true" : undefined}
              >
                <span>{item.label}</span>
              </a>
            ))}
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link nav-link-github"
            >
              <i className="fab fa-github mr-1"></i>
              <span>GitHub</span>
            </a>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`drawer-overlay ${drawerOpen ? "is-visible" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside className={`drawer ${drawerOpen ? "is-open" : ""}`} aria-label="Sections">
        <div className="drawer-header">
          <Link href="/" className="drawer-brand" onClick={closeDrawer}>
            {brand.name}
            <span>{brand.domainSuffix}</span>
          </Link>
          <button
            className="drawer-close"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="drawer-nav">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="drawer-link"
              onClick={closeDrawer}
            >
              <i className="fas fa-arrow-right"></i>
              <span>{item.label}</span>
            </a>
          ))}
          <a
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="drawer-link"
            onClick={closeDrawer}
          >
            <i className="fab fa-github"></i>
            <span>GitHub Repository</span>
          </a>
        </nav>

        <div className="drawer-footer">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
