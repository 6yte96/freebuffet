"use client";

import { useState, useMemo } from "react";
import { PROJECT_CONFIG } from "@/config";

export function FeatureBento() {
  const { features, links, brand } = PROJECT_CONFIG;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    const set = new Set(features.map((f) => f.category));
    return ["all", ...Array.from(set)];
  }, [features]);

  const filteredFeatures = useMemo(() => {
    return features.filter((feat) => {
      const matchCat =
        selectedCategory === "all" || feat.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCat;

      const text = `${feat.title} ${feat.description} ${feat.tech} ${feat.category}`.toLowerCase();
      return matchCat && text.includes(query);
    });
  }, [features, selectedCategory, searchQuery]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="features" className="projects-section">
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-label-mono">Section II</div>
          <h2 className="section-title">Core Capabilities</h2>
          <p className="section-description">
            Architectural primitives and systems features powering resilient,
            zero-overhead execution.
          </p>
        </div>

        <div className="section-header-right label-mono">
          Pp. 02 — 06
          <br />
          Folio 2026-A
        </div>
      </div>

      {/* Editorial Filter Bar */}
      <div className="editorial-filter-bar">
        <div className="filter-bar-left">
          <span className="label-mono filter-bar-label">find</span>
          <span className="filter-prompt font-mono">$</span>
          <div className="editorial-search-form">
            <input
              type="text"
              placeholder="grep capability, architecture, protocol…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="editorial-search-input"
            />
          </div>
        </div>

        <div className="filter-bar-right">
          <span className="label-mono filter-bar-label">sort</span>
          <div className="editorial-sort-buttons">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`editorial-sort-btn ${
                  selectedCategory === cat ? "active" : ""
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="projects-grid">
        {filteredFeatures.map((feat, index) => {
          const isBookmarked = !!bookmarkedIds[feat.id];

          return (
            <article
              key={feat.id}
              className={`project-card postcard-card ${feat.bentoClass}`}
              style={{ animationDelay: `${(index % 6) * 0.1}s` }}
            >
              <div className="postcard-topline">
                <div className="postcard-tags">
                  <span className={`postcard-tag boxed ${feat.tilt}`}>
                    {feat.category}
                  </span>
                  <span className="postcard-tag plain">{feat.tech}</span>
                </div>
              </div>

              <div className="card-content postcard-content">
                <h3 className="card-title postcard-title">
                  <a href={`#${feat.id}`}>{feat.title}</a>
                </h3>
                <p className="card-excerpt postcard-excerpt">
                  By @{brand.handle} — {feat.description}
                </p>
              </div>

              <div className="card-footer postcard-footer">
                <div className="postcard-footer-copy">
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="postcard-repo-link"
                  >
                    <span aria-hidden="true">↳</span>
                    <span>{feat.repoLinkText || `${brand.name}/${feat.id}`}</span>
                  </a>

                  <div className="postcard-meta-line">
                    <span>@{brand.handle}</span>
                    <span>·</span>
                    <span>{feat.meta}</span>
                    <span>·</span>
                    <time dateTime="2026-09-01">2026 EDITION</time>
                  </div>
                </div>

                <div className="postcard-actions">
                  <div className="bookmark-container text-bookmark postcard-bookmark">
                    <button
                      onClick={() => toggleBookmark(feat.id)}
                      className={`bookmark-btn ${
                        isBookmarked ? "bookmarked" : ""
                      }`}
                      title={
                        isBookmarked
                          ? "Remove bookmark"
                          : "Bookmark capability"
                      }
                      aria-label="Bookmark capability"
                    >
                      <i
                        className={
                          isBookmarked ? "fas fa-bookmark" : "far fa-bookmark"
                        }
                      ></i>
                    </button>
                  </div>

                  <div
                    className="postcard-impressions-stamp"
                    title={`${feat.stamp.label}: ${feat.stamp.value}`}
                  >
                    <span>{feat.stamp.label}</span>
                    <strong>{feat.stamp.value}</strong>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
