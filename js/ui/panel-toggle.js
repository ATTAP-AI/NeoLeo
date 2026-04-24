/* ══════════════════════════════════════════════════════════════════
   PANEL TOGGLE — collapse/expand the right-side panel
   ══════════════════════════════════════════════════════════════════
   Adds a fixed chevron button on the left edge of #panel. Clicking /
   tapping toggles the .collapsed class on both #panel and the button,
   which in css/panel.css transitions the panel's width from 360px→0
   while the button slides to right:0. Stage (flex:1) reclaims the
   freed width automatically.

   After the 0.25s CSS transition completes we reflow the canvas stack
   via _sz() (canvas pixel size follows display size), reapply the
   viewport transform (pinch-zoom/pan state stays consistent at the
   new stage dimensions), and reposition the status bar.

   Preference persists in localStorage.neoleo_panelCollapsed.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var KEY = 'neoleo_panelCollapsed';
  var TRANSITION_MS = 280; /* CSS is 0.25s; add a small buffer so the
                              reflow calls land after the final frame */

  function reflow(){
    /* The order matters: resize canvases first so transform math below
       operates on correct dimensions; then apply viewport transform;
       then reposition status bar (viewport.apply already calls
       _repositionBar but calling it here too is harmless and covers
       the case where viewport.js hasn't loaded yet). */
    if(typeof window._sz === 'function') window._sz();
    if(window._viewport && typeof window._viewport.apply === 'function'){
      window._viewport.apply();
    }
    if(typeof window._repositionBar === 'function') window._repositionBar();
  }

  function setCollapsed(collapsed){
    var panel = document.getElementById('panel');
    var btn   = document.getElementById('panel-toggle');
    if(!panel || !btn) return;
    panel.classList.toggle('collapsed', collapsed);
    btn.classList.toggle('collapsed', collapsed);
    /* Swap the chevron glyph: ▶ means "click to collapse" (pushes panel
       toward the right edge), ◀ means "click to expand" (pulls panel
       back toward the left). */
    btn.innerHTML = collapsed ? '&#9664;' : '&#9654;';
    btn.title = collapsed
      ? 'Show side panel'
      : 'Collapse side panel (frees canvas width)';
    try{ localStorage.setItem(KEY, collapsed ? '1' : '0'); }catch(_){}
    /* Reflow once at the start of the animation (so intermediate
       frames look right) and again once the transition has finished. */
    reflow();
    setTimeout(reflow, TRANSITION_MS);
  }

  function init(){
    var btn = document.getElementById('panel-toggle');
    if(!btn) return;
    /* Read persisted state. Default: expanded. */
    var saved = null;
    try{ saved = localStorage.getItem(KEY); }catch(_){}
    if(saved === '1'){
      setCollapsed(true);
    } else {
      /* Make sure the glyph is set even if we never collapsed */
      btn.innerHTML = '&#9654;';
    }
    btn.addEventListener('click', function(){
      var panel = document.getElementById('panel');
      setCollapsed(!(panel && panel.classList.contains('collapsed')));
    });
  }

  /* Defer one frame so panel.css has taken effect and initial sizes
     are stable before we potentially collapse. */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      requestAnimationFrame(init);
    });
  } else {
    requestAnimationFrame(init);
  }

  /* Expose for debugging + keyboard shortcuts later */
  window._panelToggle = {
    collapse: function(){ setCollapsed(true); },
    expand:   function(){ setCollapsed(false); },
    toggle:   function(){
      var p = document.getElementById('panel');
      setCollapsed(!(p && p.classList.contains('collapsed')));
    },
    isCollapsed: function(){
      var p = document.getElementById('panel');
      return !!(p && p.classList.contains('collapsed'));
    }
  };
})();
