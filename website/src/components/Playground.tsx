"use client";

import { useState } from "react";
import { PROJECT_CONFIG } from "@/config";

export function Playground() {
  const { codePlayground } = PROJECT_CONFIG;
  const [activeTabId, setActiveTabId] = useState(codePlayground.tabs[0].id);
  const [copied, setCopied] = useState(false);

  const currentTab =
    codePlayground.tabs.find((t) => t.id === activeTabId) ||
    codePlayground.tabs[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section id="playground" className="projects-section" style={{ paddingTop: "1rem" }}>
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-label-mono">Section III</div>
          <h2 className="section-title">{codePlayground.title}</h2>
          <p className="section-description">
            Idiomatic bindings across multiple language runtimes with uniform
            zero-copy semantics.
          </p>
        </div>

        <div className="section-header-right label-mono">
          Pp. 07 — 11
          <br />
          Runtime Spec
        </div>
      </div>

      <div style={{ marginTop: "1.75rem" }}>
        {/* Language Tabs */}
        <div className="install-tabs">
          {codePlayground.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`install-tab-btn ${
                activeTabId === tab.id ? "active" : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Window */}
        <div className="code-window">
          <div className="code-window-header">
            <div className="code-window-dots">
              <span className="code-window-dot"></span>
              <span className="code-window-dot"></span>
              <span className="code-window-dot"></span>
            </div>
            <div className="code-window-title">
              <i className="fas fa-file-code mr-1"></i>
              <span>{currentTab.filename}</span>
            </div>
            <div>
              <button
                onClick={handleCopy}
                className={`copy-btn ${copied ? "copied" : ""}`}
                title="Copy code snippet"
              >
                <i className={`fas ${copied ? "fa-check" : "fa-copy"}`}></i>
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          <pre className="code-window-body">
            <code>{currentTab.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
