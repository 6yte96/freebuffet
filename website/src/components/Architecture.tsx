import { PROJECT_CONFIG } from "@/config";

export function Architecture() {
  const { architecture } = PROJECT_CONFIG;

  return (
    <section id="architecture" className="projects-section" style={{ paddingTop: "1rem" }}>
      <div className="section-header">
        <div className="section-header-left">
          <div className="section-label-mono">Section V</div>
          <h2 className="section-title">{architecture.title}</h2>
          <p className="section-description">{architecture.subtitle}</p>
        </div>

        <div className="section-header-right label-mono">
          Pp. 16 — 19
          <br />
          Core Topology
        </div>
      </div>

      <div
        className="container"
        style={{ padding: 0, marginTop: "1.75rem" }}
      >
        <div className="editorial-chronicle-list">
          {architecture.layers.map((layer, idx) => (
            <div key={idx} className="editorial-chronicle-card">
              <div className="chronicle-header">
                <span className="label-mono">PROTOCOL LAYER {idx}</span>
                <h3 className="chronicle-role">{layer.name}</h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  SPEC // {layer.spec}
                </span>
              </div>

              <div className="chronicle-body">
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {layer.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
