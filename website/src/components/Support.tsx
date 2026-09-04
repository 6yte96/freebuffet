"use client";

import { useState } from "react";
import { PROJECT_CONFIG } from "@/config";

export function Support() {
  const { links } = PROJECT_CONFIG;
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url = "https://6yte96.github.io/freebuffet/";
    const title = "FreeBuffet — 165 free LLM providers, one CLI";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        await navigator.clipboard.writeText(`${title} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user dismissed the share sheet; nothing to do
    }
  };

  return (
    <section id="support" className="projects-section">
      <div className="container" style={{ padding: 0 }}>
        <article className="project-card postcard-card support-card">
          <div className="postcard-topline">
            <div className="postcard-tags">
              <span className="postcard-tag boxed tilt-up">SUPPORT</span>
            </div>
          </div>

          <div className="card-content postcard-content">
            <h3 className="card-title postcard-title support-title">
              Keep the Buffet Open
            </h3>
            <p className="card-excerpt postcard-excerpt support-excerpt">
              FreeBuffet is MIT-licensed and built in the open. If it saved you
              an afternoon of config wrangling, star the repo or pass the menu
              along to another engineer. Sponsor details are coming soon.
            </p>
          </div>

          <div className="card-footer postcard-footer support-footer">
            <div className="postcard-footer-copy">
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="postcard-repo-link"
              >
                <span aria-hidden="true">↳</span>
                <span>6yte96/freebuffet</span>
              </a>

              <div className="postcard-meta-line">
                <span>@{PROJECT_CONFIG.brand.handle}</span>
                <span>·</span>
                <span>MIT License</span>
                <span>·</span>
                <time dateTime="2026-09-04">2026 EDITION</time>
              </div>
            </div>

            <div className="postcard-actions">
              <div
                className="postcard-impressions-stamp"
                title="License: MIT"
              >
                <span>LICENSE</span>
                <strong>MIT</strong>
              </div>

              <div className="support-actions">
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-btn primary"
                >
                  <i className="far fa-star"></i>
                  <span>Star on GitHub</span>
                </a>

                <button
                  type="button"
                  onClick={handleShare}
                  className="support-btn"
                  aria-label="Share FreeBuffet"
                >
                  <i className="fas fa-share-nodes"></i>
                  <span>{copied || shared ? "Shared" : "Share"}</span>
                </button>

                <a
                  href={`${links.github}/sponsorships`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-btn"
                  title="Sponsor details coming soon"
                >
                  <i className="fas fa-heart"></i>
                  <span>Sponsor</span>
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
