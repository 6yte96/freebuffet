# Complete Guide to the Broadsheet Design System

This guide outlines the core design tokens, typographic hierarchy, component guidelines, and implementation patterns behind the **Paper & Ink Broadsheet Design System**.

---

## 1. Design Philosophy

The Broadsheet design system rejects generic SaaS templates (gradients, bubble buttons, high border radiuses, fuzzy box-shadows) in favor of **19th & 20th century print editorial craftsmanship** merged with modern web performance:

- **Ink on Paper**: Crisp, high-contrast black rule lines against parchment tones.
- **Strict 1px Ruled Grid**: Bento cards are boxed in a cage constructed with `gap: 1px` over a background set to `var(--rule)`.
- **Typographic Authority**: Large Space Mono editorial headlines paired with legible Rubik body copy.
- **Telemetry Stamps**: Print-era physical artifacts: tilted stamps, rotated boxed tags, and monospace edition indicators.

---

## 2. Design Tokens

### Color Tokens

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `--background` | `#F2F8FC` | `#24221f` | Canvas / Paper background |
| `--foreground` | `#000000` | `#F2F8FC` | Primary text and headings |
| `--surface` | `#e3eef5` | `#302d28` | Table headers, cards hover, secondary panels |
| `--rule` | `#000000` | `#F2F8FC` | 1px border dividers and grid cage borders |
| `--rule-soft` | `rgba(0,0,0,0.45)` | `#82796d` | Dashed lines, telemetry dividers |
| `--highlight-bg` | `#000000` | `#F2F8FC` | Active button backgrounds, headline highlight |
| `--highlight-text` | `#F2F8FC` | `#24221f` | Inverted highlight text |
| `--muted-foreground` | `rgba(0,0,0,0.68)` | `rgba(242,248,252,0.68)` | Subtitles, dates, edition notes |

### Typography Stacks

* **Monospace Stack (`--font-mono`)**:
  ```css
  'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  ```
  * Used for: Brand mark, headlines, card titles, tags, telemetry numbers, dates, code blocks, and button labels.

* **Sans-Serif Stack (`--font-sans`)**:
  ```css
  'Rubik', ui-sans-serif, system-ui, sans-serif;
  ```
  * Used for: Paragraphs, descriptions, feature excerpts, and long-form prose.

---

## 3. Core Component Anatomy

### 1. The Postcard Card (`.project-card.postcard-card`)

```html
<article class="project-card postcard-card bento-xl">
  <!-- Topline with Tilted Tags -->
  <div class="postcard-topline">
    <div class="postcard-tags">
      <span class="postcard-tag boxed tilt-up">CATEGORY</span>
      <span class="postcard-tag plain">LANGUAGE / PROTOCOL</span>
    </div>
  </div>

  <!-- Content -->
  <div class="card-content postcard-content">
    <h3 class="card-title postcard-title">
      <a href="...">Feature or Capability Title</a>
    </h3>
    <p class="card-excerpt postcard-excerpt">
      By @handle — Concise technical description explaining the architectural advantage.
    </p>
  </div>

  <!-- Footer -->
  <div class="card-footer postcard-footer">
    <div class="postcard-footer-copy">
      <a href="..." class="postcard-repo-link">
        <span aria-hidden="true">↳</span>
        <span>github.com/org/repo</span>
      </a>
      <div className="postcard-meta-line">
        <span>@handle</span>
        <span>·</span>
        <span>340★</span>
        <span>·</span>
        <time>2026 EDITION</time>
      </div>
    </div>

    <!-- Actions & Physical Stamp -->
    <div class="postcard-actions">
      <div class="bookmark-container text-bookmark postcard-bookmark">
        <button class="bookmark-btn">
          <i class="far fa-bookmark"></i>
        </button>
      </div>
      <div class="postcard-impressions-stamp" title="3,420 impressions">
        <span>Impressions</span>
        <strong>3,420</strong>
      </div>
    </div>
  </div>
</article>
```

### 2. Bento Grid Cage

The signature broadsheet grid lines are achieved by applying a 1px gap on a container with `var(--rule)` background:

```css
.projects-grid {
  display: grid !important;
  grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
  grid-auto-rows: minmax(420px, auto) !important;
  grid-auto-flow: dense !important;
  gap: 1px !important;
  background: var(--rule) !important;
  border: 1px solid var(--rule);
  overflow: hidden;
}

/* Individual card resets borders and sets solid paper background */
.project-card {
  border: 0 !important;
  border-radius: 0 !important;
  background: var(--background) !important;
}
```

### 3. Hero Inverted Highlight

To create the signature newspaper inverted black highlight box:

```html
<h1 class="hero-title">
  <span>High-Performance</span><br />
  <span class="gradient-text">Distributed Task</span><br />
  <span>Orchestrator</span>
</h1>
```

CSS backing:
```css
.hero-title .gradient-text {
  display: inline-block;
  background: var(--highlight-bg) !important;
  color: var(--highlight-text) !important;
  -webkit-text-fill-color: var(--highlight-text) !important;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  padding: 0.08em 0.1em 0.12em;
  font-size: 0.92em;
  line-height: 1;
  vertical-align: baseline;
}
```

### 4. Telemetry Press-Run Card

```html
<div class="press-run-card">
  <div class="press-run-label">Press run</div>
  <div class="press-stat">
    <span class="press-stat-number">2.8M</span>
    <span class="press-stat-label">Monthly Computes</span>
  </div>
  <div class="press-stat">
    <span class="press-stat-number"><12µs</span>
    <span class="press-stat-label">IPC Round-Trip</span>
  </div>
</div>
<div class="press-run-update">Updated 04:12 UTC · auto</div>
```

---

## 4. Customization Workflows

### How to Add a New Feature Card
Open `project.config.ts` and add an object to `features`:
```typescript
{
  id: "zero-alloc",
  bentoClass: "bento-wide", // 'bento-xl' | 'bento-tall' | 'bento-wide' | 'bento-md' | 'bento-sm' | 'bento-lg'
  category: "PERFORMANCE",
  tech: "RUST / ARENA",
  title: "Arena Memory Allocation",
  description: "Bulk allocates memory chunks to eliminate allocator lock contention during high throughput streaming.",
  repoLinkText: "org/repo-alloc",
  impressions: "4,120",
  stars: "185★",
  tilt: "tilt-up", // 'tilt-up' | 'tilt-down'
}
```

### How to Add Interactive Code Examples
Open `project.config.ts` and add a new entry to `codePlayground.tabs`:
```typescript
{
  id: "go",
  label: "Go",
  filename: "main.go",
  code: `package main

import (
    "fmt"
    "github.com/org/yourproject"
)

func main() {
    client := yourproject.NewClient()
    fmt.Println("Connected to cluster.")
}`,
}
```

### How to Update Latency Benchmarks
Modify `benchmarks.rows` in `project.config.ts`:
```typescript
{
  name: "YourProject (Ours)",
  isTarget: true,
  metrics: ["1,420,000 ops/s", "8.2 µs", "11.6 µs", "14.2 MB RSS"],
  highlight: true,
}
```

---

## 5. Deployment Best Practices

* **Static Export**: The template is 100% compatible with `output: 'export'` if you want to deploy to GitHub Pages or an S3 bucket without node runtime dependencies.
* **Zero Layout Shift (CLS)**: The masthead, bento cards, and code windows have explicit min-heights preventing layout shifts.
* **SEO & Metadata**: All OpenGraph tags, JSON-LD structure, and twitter card images automatically derive from `PROJECT_CONFIG.meta`.
