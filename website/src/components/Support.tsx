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
    <div className="support-strip">
      <div className="support-copy">
        <h3 className="support-heading">Keep the Buffet Open</h3>
        <p className="support-text">
          FreeBuffet is MIT-licensed and built in the open. If it saved you an
          afternoon of config wrangling, star the repo or pass the menu along
          to another engineer.
        </p>
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
          <span>
            {copied || shared ? "Shared" : "Share"}
          </span>
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
  );
}
