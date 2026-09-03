"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PROJECT_CONFIG } from "@/config";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  currentSection?: string;
}

export function Header({ currentSection = "home" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { brand, links } = PROJECT_CONFIG;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <header className={`header ${isScrolled ? "scrolled" : ""}`}>
        <div className="masthead">
          <button
            className="drawer-toggle"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
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

        <nav className="nav">
          <div className="nav-links">
            <Link
              href="#features"
              className={`nav-link ${currentSection === "features" ? "active" : ""}`}
            >
              <span>Features</span>
            </Link>
            <Link
              href="#playground"
              className={`nav-link ${currentSection === "playground" ? "active" : ""}`}
            >
              <span>Manifest</span>
            </Link>
            <Link
              href="#benchmarks"
              className={`nav-link ${currentSection === "benchmarks" ? "active" : ""}`}
            >
              <span>Benchmarks</span>
            </Link>
            <Link
              href="#architecture"
              className={`nav-link ${currentSection === "architecture" ? "active" : ""}`}
            >
              <span>Architecture</span>
            </Link>
            <Link
              href="#dispatches"
              className={`nav-link ${currentSection === "dispatches" ? "active" : ""}`}
            >
              <span>Dispatches</span>
            </Link>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
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
      />

      {/* Mobile Drawer */}
      <aside className={`drawer ${drawerOpen ? "is-open" : ""}`}>
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
          <a href="#features" className="drawer-link" onClick={closeDrawer}>
            <i className="fas fa-layer-group"></i>
            <span>Features</span>
          </a>
          <a href="#playground" className="drawer-link" onClick={closeDrawer}>
            <i className="fas fa-terminal"></i>
            <span>Code Manifest</span>
          </a>
          <a href="#benchmarks" className="drawer-link" onClick={closeDrawer}>
            <i className="fas fa-chart-line"></i>
            <span>Benchmarks</span>
          </a>
          <a href="#architecture" className="drawer-link" onClick={closeDrawer}>
            <i className="fas fa-sitemap"></i>
            <span>Architecture</span>
          </a>
          <a href="#dispatches" className="drawer-link" onClick={closeDrawer}>
            <i className="fas fa-newspaper"></i>
            <span>Dispatches</span>
          </a>
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
