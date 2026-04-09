/**
 * NeoLeo — Main Script Loader
 * Loads all modules in dependency order via dynamic script injection.
 * This replaces the single monolithic <script> block.
 */
(function () {
  'use strict';

  // All scripts in dependency order
  var scripts = [
    // ── Core (no dependencies) ──
    'js/core/utils.js',
    'js/core/state.js',
    'js/core/canvas.js',
    'js/core/palette.js',
    'js/core/panels.js',

    // ── Engines (depend on core) ──
    'js/engines/engine-params.js',
    'js/engines/core-engines.js',
    'js/engines/extended-engines.js',
    'js/engines/organic-engines.js',
    'js/engines/engine-registry.js',
    'js/engines/generate.js',
    'js/engines/engine-cycle.js',

    // ── Drawing (depend on core + state) ──
    'js/drawing/draw-state.js',
    'js/drawing/brush-stroke.js',
    'js/drawing/draw-tools.js',
    'js/drawing/ps-tools.js',
    'js/drawing/texture-tool.js',
    'js/drawing/mark-color-picker.js',

    // ── FX (depend on core) ──
    'js/fx/lighting.js',
    'js/fx/atmosphere.js',

    // ── Layers (depend on core + drawing) ──
    'js/layers/layers.js',

    // ── Upload (depend on core + layers) ──
    'js/upload/upload.js',
    'js/upload/placement.js',
    'js/upload/image-composite.js',
    'js/upload/image-signal.js',

    // ── AI (depends on engines + state) ──
    'js/ai/ai-prompt.js',

    // ── Tools (depend on drawing + core) ──
    'js/tools/crop.js',
    'js/tools/humanize.js',
    'js/tools/curves.js',
    'js/tools/gradient-tool.js',
    'js/tools/canvas-resize.js',
    'js/tools/freeform-canvas.js',

    // ── Experimental (depend on core + drawing) ──
    'js/experimental/intent-sculpting.js',
    'js/experimental/temporal-canvases.js',
    'js/experimental/modality-cycler.js',
    'js/experimental/object-mode.js',
    'js/experimental/probability-painting.js',
    'js/experimental/memory-drawing.js',
    'js/experimental/morphogenesis.js',
    'js/experimental/organic-forms.js',
    'js/experimental/topology-engine.js',
    'js/experimental/leo-toolset.js',

    // ── Export (depends on core + FX) ──
    'js/export/export.js',

    // ── Save system (depends on core + engines) ──
    'js/save/save-restore.js',
    'js/save/generation-history.js',
    'js/save/settings-save.js',

    // ── UI helpers (depend on various modules) ──
    'js/ui/render-popup.js',
    'js/ui/seed-slider.js',
    'js/ui/color-wheel.js',
    'js/ui/custom-palette.js',
    'js/ui/more-engines.js',
    'js/ui/tooltips.js',
    'js/ui/section-toggles.js',
    'js/ui/resolution-controls.js',
    'js/ui/bg-color-picker.js',
    'js/ui/brush-picker.js',
    'js/ui/fullscreen.js',
    'js/ui/image-adjustments.js',
    'js/ui/happy-hallucinations.js',
    'js/ui/naturalize.js',
    'js/ui/help-panel.js',

    // ── Engine init (depends on drawing, layers, experimental — wires engine buttons + palette + resetToBlank) ──
    'js/engines/engine-init.js',

    // ── Core events (last — wires keyboard shortcuts after all tools registered) ──
    'js/core/undo.js',
    'js/core/events.js'
  ];

  var idx = 0;

  function loadNext() {
    if (idx >= scripts.length) {
      console.log('[NeoLeo] All ' + scripts.length + ' modules loaded.');
      // Trigger initial canvas sizing after all scripts are ready
      if (typeof window._sz === 'function') {
        window._sz();
      }
      return;
    }
    var src = scripts[idx++];
    var el = document.createElement('script');
    el.src = src + '?v=' + Date.now();
    el.onload = loadNext;
    el.onerror = function () {
      console.warn('[NeoLeo] Failed to load: ' + src + ' — continuing...');
      loadNext();
    };
    document.body.appendChild(el);
  }

  loadNext();
})();
