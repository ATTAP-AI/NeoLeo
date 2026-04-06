# NeoLeo

**New Art Forms for a New Age**

NeoLeo is a standalone, browser-based generative art and digital painting application. It combines 48 procedural art engines with a full suite of drawing and image editing tools — all in a single HTML file.

Build: **2026-04-01 16:51 UTC — Checkpoint 2**

---

## Getting Started

Open the HTML file directly in any modern browser (Chrome, Firefox, Safari, Edge). No installation or server required.

---

## Features

### Generative Engines (48)

Six primary engines are always visible; 42 more are available under "More Engines."

| Category | Engines |
|---|---|
| **Organic** | Flow Field, Differential Growth, Physarum / Slime Mold, Space Colonization, Reaction-Diffusion, Cell / Tissue Growth, Watercolor / Wet Media, Diatom / Biomorph, Fungal Network, Hydraulic Erosion |
| **Physics** | Strange Attractor, Wave Interference, Gravity Wells, Boid Flocking, Magnetic Field Lines, Sand Drift, Oscilloscope |
| **Geometric** | Recursive Subdivision, Lissajous Mesh, Voronoi Diagram, Truchet Tiles, Penrose Tiling, Spirograph, Apollonian Gasket, Space-Filling Curve, Weave / Knot Diagram, Möbius / Torus |
| **Fractal** | Julia / Mandelbrot, Newton's Fractal, Iterated Function Systems, Flame Fractal, Domain-Warped Noise, Curl Noise Sheets, Ridged Multifractal |
| **Procedural** | L-System Plants, Marble / Wood, Contour / Isoline Map, Chladni Figures, Waveform Collapse, ASCII Density Map |
| **Cellular** | Conway Game of Life, Langton's Ant, Cave / Dungeon Map, Crystal Growth (DLA) |
| **Graph** | Force-Directed Graph, Minimum Spanning Tree, Delaunay Triangulation |

Each engine exposes its own parameter sliders. Engine opacity is adjustable, and a **Cycle** mode runs through all engines at max settings.

### Drawing & Painting Tools

**Core tools:** Brush (B), Pencil (P), Line (L), Rectangle (R), Ellipse (E), Triangle (T), Polygon (G), Free Shape (S), Flood Fill (F), Color Replace (C), Crop (scissors icon)

**Photo-editing tools:** Eraser, Eyedropper (I), Clone Stamp, Healing Brush (J), Dodge (O), Burn (X), Smudge (M), Blur (U), Sharpen (H), Sponge (Z), Gradient (multi-stop, linear/radial), Texture Map (W), Humanize (Q), Curves (V)

**Brush parameters:** Size (1–80 px), Opacity (5–100%), Hardness (0–100%), Tolerance, Shape Mode (Stroke / Fill / Fill+Stroke)

### Palettes (11)

Ember, Ink & Paper, Deep Ocean, Neon Circuit, Earth Strata, Ghost, Aurora, Void, Rust & Salt, Botanic, and a fully editable **Custom** palette (up to 6 colors + background). Save and load unlimited named palettes.

### Lighting System

- Up to 2 light sources (Point, Spot, Rim)
- Per-light color, intensity, position, radius, and bloom
- Ambient fill light
- Screen blend rendering
- Apply to canvas or reset

### Atmosphere Panel

- **Vignette** — edge darkening
- **Fog / Haze** — Flat, Radial, Ground Fog, Top Haze with color and intensity
- **Film Grain** — multiple grain types and density control
- **Chromatic Aberration**
- **Color Grade** — temperature, saturation, contrast, brightness

### Layers

- Multiple drawing layers with add, duplicate, merge down, flatten, rename, reorder, and visibility toggle
- Per-layer blend mode (Under/Over) and opacity
- Engine layer capture — snapshot engine output as a layer
- **Gen+Layer** — generate and capture in one action

### Image Upload & Placement

- Drag-and-drop or click to upload (PNG/JPEG, max 5 MB)
- On-canvas placement with drag, resize handles, and commit/cancel
- Image adjustments: brightness, contrast, saturation, temperature
- Blend mode and opacity controls
- Crop, merge drawing/engine onto image, flatten all, bake to canvas

### Image Signal (Experimental)

Extract palette, density map, and gradient data from an uploaded image. Broadcasts analysis to all engines so generation is influenced by the source image. Includes luminance mapping, Sobel gradients, K-means palette extraction, and warmth analysis.

### FX Modes

- **Happy Hallucinations** — one-click composite: random engine + random palette + random drawing tool overlay
- **Multi-Pass Blend** — generate multiple layers with configurable blend mode and opacity per pass
- **Object Mode** — draw marks, select bounding boxes, and transform objects with persistent ID tracking

### AI Prompt (Requires Anthropic API Key)

Describe what you want in plain language. The AI selects engines, palettes, lighting, atmosphere, and drawing parameters. Supports streaming responses and chat history.

### Export & Save

- **PNG download** — single click or right-click to save
- **Save States** — up to 8 full workspace snapshots in browser storage
- **History** — navigate previous generations, restore, export, or delete entries

---

## Keyboard Shortcuts

| Key | Tool | | Key | Tool |
|---|---|---|---|---|
| B | Brush | | I | Eyedropper |
| P | Pencil | | J | Healing Brush |
| L | Line | | O | Dodge |
| R | Rectangle | | X | Burn |
| E | Ellipse | | M | Smudge |
| T | Triangle | | U | Blur |
| G | Polygon | | H | Sharpen |
| S | Free Shape | | Z | Sponge |
| F | Flood Fill | | W | Texture Map |
| C | Color Replace | | Q | Humanize |
| V | Curves | | G | Gradient |
| Esc | Select (deactivate) | | | |

| Shortcut | Action |
|---|---|
| Shift+U | Upload Image |
| Shift+P | AI Prompt |
| Shift+L | Lighting Panel |
| Shift+A | Atmosphere Panel |
| Shift+Y | Layers Panel |
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |
| [ / ] | Navigate history |

---

## Canvas Options

- **Presets:** Square 750×750, 9:16 Portrait, 16:9 Landscape, Custom
- **Background:** Transparent, solid color, or preset swatches
- **Fullscreen** toggle

---

## Seed System

Each generation uses a numeric seed for reproducibility. Lock the seed to iterate on a specific composition, or randomize for fresh results.

---

## Technical Notes

- Standalone single-file HTML — no dependencies, no build step
- Runs entirely in-browser using Canvas 2D
- Bezier-interpolated brush strokes
- All state stored in browser localStorage

---

*NeoLeo — Checkpoint 2 — April 2026*
