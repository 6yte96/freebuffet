# FreeBuffet Landing Page

Static marketing site for FreeBuffet, built on the [Broadsheet editorial template](https://github.com/6yte96/minimalism) (Next.js 15 App Router + Paper & Ink design system).

**Live at:** `https://6yte96.github.io/freebuffet/`

## Audience & Structure

The page is written for developers and AI engineers who want free or cheap LLM access without config toil. Sections follow their reading order:

| Section | Answers the question |
|---------|----------------------|
| Hero | What is it, how do I run it |
| `#session` Session | What happens when I run it (real output formats) |
| `#menu` Menu | What it does, searchable like the CLI |
| `#free-tiers` Free Tiers | Is it really free (the ledger) |
| `#source` Source | Where is the code, how to contribute |

Nav is intentionally four items plus GitHub. No changelog or community boilerplate; the roadmap dispatches live at the end of Source.

## Quick Start

```sh
cd website
bun install
bun run dev        # http://localhost:3000/freebuffet
```

## Editing Content

All landing page copy lives in **one file**: [`project.config.ts`](./project.config.ts).
Change hero lines, provider stats, feature cards, code samples, the free-tier ledger table, architecture layers, or the changelog — no React knowledge required.

Stats that should stay in sync with the CLI (`165 providers · 99 free tiers · 47 no-CC · 19 local engines`) are marked `// TODO: sync` in that file — bump them whenever `src/providers.ts` changes.

## Static Export & GitHub Pages

The site is preconfigured for **GitHub Pages project pages**:

- `output: "export"` in [`next.config.ts`](./next.config.ts) → static files in `out/`
- `basePath: "/freebuffet"` so assets resolve under the repo subpath
- Set `NEXT_PUBLIC_BASE_PATH=""` env to build for a custom domain root instead

Build locally:

```sh
bun run build      # static export → out/
bun run type-check # tsc --noEmit
```

## Deployment

Deployment is automated via [`.github/workflows/website.yml`](../.github/workflows/website.yml):

1. On every push to `main` touching `website/**`, the workflow builds the static export and publishes it with the official Pages actions.
2. **One-time setup (repo admin):** GitHub → Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Design System

See [`GUIDE.md`](./GUIDE.md) for the full Paper & Ink Broadsheet tokens — 1px rule cages, Space Mono headlines, inverted highlight boxes, telemetry stamps.

## Template Credit

Based on [minimalism](https://github.com/6yte96/minimalism) — Broadsheet Open-Source Project Landing Page Template. MIT.
