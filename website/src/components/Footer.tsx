import { PROJECT_CONFIG } from "@/config";

export function Footer() {
  const { brand, links, meta } = PROJECT_CONFIG;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>
            {brand.name}
            <span>{brand.domainSuffix}</span>
          </h3>
          <p>{meta.description}</p>
        </div>

        <div className="footer-section">
          <h4>Navigation</h4>
          <div className="footer-links">
            <a href="#session" className="footer-link">
              Session
            </a>
            <a href="#menu" className="footer-link">
              Menu
            </a>
            <a href="#free-tiers" className="footer-link">
              Free Tiers
            </a>
            <a href="#source" className="footer-link">
              Source
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Transmissions</h4>
          <div className="social-links">
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              title="GitHub Repository"
            >
              <i className="fab fa-github"></i>
            </a>
            {links.discord && (
              <a
                href={links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="Discord Community"
              >
                <i className="fab fa-discord"></i>
              </a>
            )}
            {links.twitter && (
              <a
                href={links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="Twitter/X Dispatch"
              >
                <i className="fab fa-twitter"></i>
              </a>
            )}
            {links.npm && (
              <a
                href={links.npm}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="npm Package"
              >
                <i className="fab fa-npm"></i>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {currentYear} {brand.name} Contributors.
        </p>
        <p className="footer-version">
          <a
            href="https://github.com/6yte96/freebuffet/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            MIT License
          </a>
          {" // "}
          v0.2.0 // @{brand.handle}
        </p>
      </div>
    </footer>
  );
}
