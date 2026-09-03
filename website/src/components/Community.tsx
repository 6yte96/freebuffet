import { PROJECT_CONFIG } from "@/config";

export function Community() {
  const { links } = PROJECT_CONFIG;

  const quickIssues = [
    {
      title: "Optimize IPC memory alignment on ARM64 Graviton instances",
      tag: "GOOD FIRST ISSUE",
      component: "ipc-core",
    },
    {
      title: "Add Tokio Broadcast stream wrapper for Python AsyncIO worker",
      tag: "HELP WANTED",
      component: "pyo3-bridge",
    },
    {
      title: "Implement distributed OpenTelemetry baggage header propagation",
      tag: "DOCUMENTATION",
      component: "telemetry",
    },
  ];

  return (
    <section id="community" className="projects-section" style={{ paddingTop: "1rem" }}>
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-label-mono">Section VII</div>
          <h2 className="section-title">Open Collective &amp; Wire</h2>
          <p className="section-description">
            Join the decentralized community of systems engineers, contributors, and core maintainers.
          </p>
        </div>

        <div className="section-header-right label-mono">
          Pp. 25 — 28
          <br />
          Community Wire
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginTop: "1.75rem",
        }}
      >
        {/* Contributing Card */}
        <div className="press-run-card" style={{ background: "var(--background)" }}>
          <div className="press-run-label">Contributing Protocol</div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "1.25rem",
              lineHeight: 1.6,
            }}
          >
            All development happens publicly on GitHub. Review our RFC process, write-ahead log specifications, and run local test harnesses.
          </p>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href={`${links.github}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-broadsheet-primary"
            >
              <span>Contribution Guide</span>
              <i className="fas fa-arrow-right ml-1" style={{ fontSize: "10px" }}></i>
            </a>
            <a
              href={links.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-broadsheet-outline"
            >
              <span>Read Documentation</span>
            </a>
          </div>
        </div>

        {/* Selected Good First Issues */}
        <div className="press-run-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--rule)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Open Dispatches (Help Wanted)
          </div>

          <div>
            {quickIssues.map((issue, idx) => (
              <a
                key={idx}
                href={`${links.github}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="issue-card"
              >
                <div>
                  <div className="issue-card-title">{issue.title}</div>
                  <div className="issue-card-meta">
                    <span className="telemetry-pill mr-2" style={{ padding: "0.1rem 0.4rem", fontSize: "9px" }}>
                      {issue.tag}
                    </span>
                    <span>component: {issue.component}</span>
                  </div>
                </div>
                <i className="fas fa-external-link-alt" style={{ fontSize: "11px", color: "var(--muted-foreground)" }}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
