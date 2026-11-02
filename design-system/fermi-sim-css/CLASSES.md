# fermi-sim.css: class catalogue

The class name is the public API. These are BEM classes with the `fsim-` prefix, defined in `_styles/`, in the layer `fermi.components`. New sims use these classes directly.

In v1, live sims keep their legacy markup, and the look reaches them through the legacy selectors in `override.css`. Their JS rewrites `className` about 1,900 times across the fleet, so v1 adds no classes to their DOM.

Track R moves each sim onto these classes and deletes the matching legacy rules.

| canonical class | role | legacy selectors it replaces (2-D shell · 3-D shell · legacy QM) |
|---|---|---|
| `.fsim-page` | page ground | `html`, `body`, `#shell`, `.shell-hero`, `.plot-area`, `.main-container` |
| `.fsim-topbar` | top bar | `.shell-header` · `.top-bar` (incl. `header.sim-header.top-bar`, `.control-bar.top-bar`) |
| `.fsim-topbar__title` | sim title | `.shell-title` · `.top-bar h1` |
| `.fsim-topbar__label` | header label | `.shell-header label`, `.lbl-speed`, `.ht-ctl` |
| `.fsim-topbar__sep` | divider | `.shell-sep`, `.shell-divider`, `.hdr-sep` |
| `.fsim-btn` | button (shape) | `.shell-btn`, `.btn-topbar`, sidebar `button` |
| `.fsim-btn--primary` | Play, the one loud action | `#shell-play` · `#btnPlayPause` · `#playpause-btn` |
| `.fsim-btn--selected` / `[aria-pressed=true]` | toggled option | `#btn-gi.active`, `#btn-cg.active`, `.active/.on/.selected` |
| `.fsim-btn--tutor` + `.fsim-btn__icon` | Ask AI Tutor pill | `#ask-euler`, `.ask-euler` + `.ask-euler-icon` |
| `.fsim-btn--ghost` | quiet text button | `.gv-textbtn` |
| `.fsim-stage` | simulation window | `.plot-box`, `.canvas-frame` |
| `.fsim-stage__hint` | on-stage hint | `.stage-hint`, `.release-hint`, `.rotate-drag-hint` |
| `.fsim-sidebar` | control sidebar | `.shell-aside` · `#sb-sidebar` |
| `.fsim-panel` / `.fsim-panel__head` | control box / its heading | `.shell-panel`, `.ctrl-box` / `.aside-zone-head`, `.shell-panel-head` |
| `.fsim-control__label` / `__value` / `__range` | slider label / value / range | `.ctrl-box-label` / `.slider-val` / `.control-range` |
| `.fsim-slider` | range input | `.shell-aside input[type=range]` |
| `.fsim-readout__row` / `__label` / `__value` | readout | `.stat-row` / `.stat-label` / `.stat-value` |
| `.fsim-note` | helper text | `.hint`, `.note-text`, `.readout-sub` |
| `.fsim-hide-tab` | sidebar HIDE tab | `#sb-hide-tab` |
| `.fsim-inquiry__title` / `__text` | Guided Inquiry card | `.inq-step h4` / `.inq-step p` |
| `.fsim-inquiry__dot` (`--on`) | card progress dot | `.inq-dot` (`.active`, `.done`) |
| `.fsim-choice` (`--correct`, `--wrong`) | answer choice | `.choice` (`.correct`, `.wrong`) |
| `.fsim-feedback` (`--correct`, `--wrong`, `--near`) | prediction feedback | `.predict-eval` |
| `.fsim-chip` (`--active`) | small toggle/tag | `.ps-chip`, legend chips |
| `.fsim-card` / `__title` / `__body` | raised card | `.gv-board`, `.ps-card` |
| `.fsim-sheet-scrim` | Physics sheet backdrop | `#phys-backdrop` |
| `.fsim-sheet` / `__head` / `__kicker` / `__lede` | the Physics sheet | `.phys-modal` / `.phys-head` / `.phys-kicker` / `.lede` |

The Simulation guide (`#gv-*`, `.gv-*`) is owned by the UX guide layer. Its Horizon colours and type live in `override.css`. Its canonical classes arrive when the guide engine adopts this sheet.
