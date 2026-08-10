# free-coding-models reference notes

These notes summarize the parts of `free-coding-models/` that are useful for FreeBuffet. The goal is not a full copy; FreeBuffet should adopt the stable TUI and product patterns that matter for setup, saved keys, provider browsing, model selection, and agent config generation.

## Architecture

- Entry point: `bin/free-coding-models.js`
  - Parses CLI args early.
  - Loads config before UI.
  - Installs global `uncaughtException` and `unhandledRejection` handlers that restore terminal state before printing errors.
  - Delegates the actual interactive app to `src/tui/app.js`.
- Core logic lives outside the TUI:
  - `src/core/config.js`: persistent config and API keys.
  - `src/core/setup.js`: first-run API key wizard.
  - `src/core/ping.js` and `src/core/ping-loop.js`: provider requests and background checks.
  - `src/core/*-config.js`, `tool-*`, `endpoint-installer.js`: integration-specific config/launch logic.
- TUI logic is split by responsibility:
  - `src/tui/tui-state.js`: single mutable state object.
  - `src/tui/app.js`: startup, render loop, raw input wiring, cleanup.
  - `src/tui/key-handler.js`: all key handling and state transitions.
  - `src/tui/render-table.js`: pure string renderer.
  - `src/tui/render-helpers.js`: ANSI stripping, display width, viewport, masking.
  - `src/tui/overlays.js`: settings/help/install/recommend overlays.

## TUI patterns to adopt

- Use one long-lived TUI session for raw input instead of nested prompt screens.
- Keep all UI position, cursor, filter, selection, and overlay state in a single object.
- Render from state on a timer or after state changes; renderers should return strings and avoid side effects.
- Use alternate screen enter/leave sequences so broken renders do not pollute shell scrollback:
  - enter: `\x1b[?1049h\x1b[?25l\x1b[?7l`
  - leave: `\x1b[?7h\x1b[?1049l\x1b[?25h`
- Always restore raw mode, cursor visibility, wrapping, and alternate screen on exit or fatal error.
- Call `process.stdin.resume()` before raw-mode keypress flows. A previous readline prompt can pause stdin, which can make the process exit right after a screen renders.
- Use display-width aware padding for aligned columns. Plain `value.length` is not enough once ANSI colors or emoji enter the output.
- Esc closes the current overlay/view and returns to the previous view. Ctrl+C exits.
- Footer help should be generated from the active view, not hard-coded globally.

## Feature patterns to adopt

- First-run setup:
  - If no usable provider key exists, show a simple setup wizard.
  - Each provider is optional; Enter skips.
  - Save once after collecting answers.
- Settings/manage keys:
  - Saved providers should be visible and masked.
  - Users can update, delete, and test saved keys without leaving the app.
- Provider/model browsing:
  - Search should match provider id, name, URL, website, tags, and model id.
  - Free models should sort first.
  - Unusable or missing-key rows should be visually distinct.
- Product navigation:
  - Home should be a real menu with stable actions:
    - setup agents from saved keys
    - add/update provider keys
    - browse providers
    - manage saved keys
  - Actions should not fall through into unrelated flows.
- Testing:
  - Use tmux for TUI regression testing:
    - spawn a detached session
    - send keys
    - capture pane output
    - kill the session

## FreeBuffet essentials

1. Fix raw-mode lifecycle first: resume stdin before raw keypress selectors and always restore on exit.
2. Add fatal error handlers that restore terminal state before printing errors.
3. Keep the current provider/model picker, but stabilize transitions before adding more overlays.
4. Extract shared TUI helpers later: state, renderer, key handler, view stack.
5. Add tmux smoke tests for the home menu and provider picker.
