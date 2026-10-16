"use client";

import { useState } from "react";
import { PROJECT_CONFIG } from "@/config";
import { HeroBuffetVisual } from "./HeroBuffetVisual";

export function Hero() {
  const { hero, install, telemetry, links } = PROJECT_CONFIG;
  const [selectedManager, setSelectedManager] = useState(
    install.defaultManager || "npm"
  );
  const [copied, setCopied] = useState(false);

  const currentCommand =
    install.managers[selectedManager] || `npm install ${PROJECT_CONFIG.brand.name}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="issue-line">
          <span className="issue-badge">{hero.issueBadge}</span>
        </div>

        <h1 className="hero-title">
          <span>{hero.titleLines.before}</span>
          <br />
          <span className="gradient-text">{hero.titleLines.highlight}</span>
          <br />
          <span>{hero.titleLines.after}</span>
        </h1>

        <p className="hero-description">{hero.description}</p>

        {/* Installation Bar with Package Manager Tabs */}
        <div style={{ marginTop: "2rem" }}>
          <div className="install-tabs">
            {Object.keys(install.managers).map((manager) => (
              <button
                key={manager}
                type="button"
                onClick={() => setSelectedManager(manager)}
                className={`install-tab-btn ${
                  selectedManager === manager ? "active" : ""
                }`}
              >
                {manager}
              </button>
            ))}
          </div>

          <div className="install-box">
            <div className="install-box-code">
              <span className="prompt">$</span>
              <span>{currentCommand}</span>
            </div>
            <button
              onClick={handleCopy}
              className={`copy-btn ${copied ? "copied" : ""}`}
              title="Copy installation command"
            >
              <i
                className={`fas ${
                  copied ? "fa-check" : "fa-copy"
                }`}
              ></i>
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "1.75rem",
          }}
        >
          <a href={hero.primaryCta.href} className="btn-broadsheet-primary">
            <span>{hero.primaryCta.text}</span>
            <i
              className="fas fa-arrow-right"
              style={{ marginLeft: "0.5rem", fontSize: "10px" }}
            ></i>
          </a>
          <a
            href={hero.secondaryCta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-broadsheet-outline"
          >
            <i
              className="fab fa-github"
              style={{ marginRight: "0.45rem", fontSize: "12px" }}
            ></i>
            <span>{hero.secondaryCta.text}</span>
          </a>
        </div>
        {/* Published package and live page */}
        <div
          className="font-mono text-xs text-muted-foreground"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem 1rem",
            marginTop: "1.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <a
            href="https://www.npmjs.com/package/freebuffet"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            npm: freebuffet@0.2.0
          </a>
          <span>MIT License</span>
          <span>node &gt;= 18 / bun &gt;= 1.0</span>
          <a
            href="https://6yte96.github.io/freebuffet/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            live page
          </a>
          <a
            href="https://6yte96.me"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            6yte96.me
          </a>
        </div>
      </div>

      <div className="hero-visual">
        <HeroBuffetVisual />
      </div>
    </section>
  );
}
