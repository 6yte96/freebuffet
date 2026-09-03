import { PROJECT_CONFIG } from "@/config";

export function Changelog() {
  const { changelog } = PROJECT_CONFIG;

  return (
    <section id="dispatches" className="projects-section" style={{ paddingTop: "1rem" }}>
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-label-mono">Section VI</div>
          <h2 className="section-title">Release Dispatches</h2>
          <p className="section-description">
            Chronological ledger of engine improvements, security audits, and protocol upgrades.
          </p>
        </div>

        <div className="section-header-right label-mono">
          Pp. 20 — 24
          <br />
          Dispatch Ledger
        </div>
      </div>

      <div style={{ marginTop: "1.75rem" }}>
        <div className="editorial-chronicle-list">
          {changelog.map((entry, idx) => (
            <div key={idx} className="editorial-chronicle-card">
              <div className="chronicle-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="postcard-tag boxed tilt-up" style={{ fontSize: "10px" }}>
                    {entry.version}
                  </span>
                  <span className="label-mono">{entry.date}</span>
                </div>
                <h3 className="chronicle-role" style={{ marginTop: "0.5rem" }}>
                  {entry.title}
                </h3>
              </div>

              <div className="chronicle-body">
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {entry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
