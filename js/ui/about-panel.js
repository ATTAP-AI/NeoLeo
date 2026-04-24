/* ══════════════════════════════════════════════════════════════════
   ABOUT PANEL — floating, draggable, expandable
   ══════════════════════════════════════════════════════════════════
   Wires #about-btn to open #about-panel (and its backing overlay).
   The panel contains the NeoLeo introduction text (from the open-
   source launch document) rendered in black-on-white for legibility.

   Behaviors:
     - Click #about-btn → show overlay + panel, fade in.
     - Click overlay, #about-close, or press Escape → hide.
     - Click #about-expand → toggle between default size and maximized
       (fills ~96vw × 94vh). Remembers last mode in localStorage.
     - Drag the header (#about-header) → reposition the panel. Only
       active in default (non-maximized) mode. Disabled on touch so
       native scrolling inside the body still works.
     - Native CSS `resize: both` on the panel allows corner drag to
       resize in desktop browsers.

   The panel is created at body level with position:fixed so it floats
   above the canvas/panel layout and is unaffected by #panel.collapsed.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var KEY_MAX = 'neoleo_aboutMaximized';

  function byId(id){ return document.getElementById(id); }

  function show(){
    var overlay = byId('about-overlay'), panel = byId('about-panel');
    if(!overlay || !panel) return;
    overlay.style.display = 'block';
    panel.style.display = 'flex';
    /* Fade-in: use a frame of delay so the display change commits
       before opacity transitions. */
    overlay.style.opacity = '0';
    panel.style.opacity = '0';
    panel.style.transition = 'opacity 0.18s ease';
    overlay.style.transition = 'opacity 0.18s ease';
    requestAnimationFrame(function(){
      overlay.style.opacity = '1';
      panel.style.opacity = '1';
    });
    /* Reset scroll to top on each open so readers see the intro. */
    var body = byId('about-body');
    if(body) body.scrollTop = 0;
  }

  function hide(){
    var overlay = byId('about-overlay'), panel = byId('about-panel');
    if(!overlay || !panel) return;
    overlay.style.opacity = '0';
    panel.style.opacity = '0';
    setTimeout(function(){
      overlay.style.display = 'none';
      panel.style.display = 'none';
    }, 180);
  }

  function isOpen(){
    var panel = byId('about-panel');
    return !!(panel && panel.style.display === 'flex');
  }

  function applyMaximized(on){
    var panel = byId('about-panel');
    if(!panel) return;
    if(on){
      panel.style.width    = '96vw';
      panel.style.height   = '94vh';
      panel.style.top      = '50%';
      panel.style.left     = '50%';
      panel.style.transform= 'translate(-50%,-50%)';
    } else {
      panel.style.width    = 'min(720px,92vw)';
      panel.style.height   = 'min(780px,88vh)';
      panel.style.top      = '50%';
      panel.style.left     = '50%';
      panel.style.transform= 'translate(-50%,-50%)';
    }
    try{ localStorage.setItem(KEY_MAX, on ? '1' : '0'); }catch(_){}
    panel.dataset.maximized = on ? '1' : '0';
  }

  function toggleMaximized(){
    var panel = byId('about-panel');
    var on = panel && panel.dataset.maximized === '1';
    applyMaximized(!on);
  }

  function wireDrag(){
    /* Header-drag repositioning for mouse users. Touch is left alone
       so users can scroll the header area on small screens without
       getting stuck in a drag. Maximized mode disables drag too. */
    var header = byId('about-header'), panel = byId('about-panel');
    if(!header || !panel) return;
    var dragging = false, sx = 0, sy = 0, px = 0, py = 0;

    header.addEventListener('mousedown', function(e){
      /* Ignore clicks on the close/expand buttons. */
      if(e.target.closest && e.target.closest('button')) return;
      if(panel.dataset.maximized === '1') return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      var r = panel.getBoundingClientRect();
      px = r.left; py = r.top;
      /* While dragging we anchor the panel to its current rect so the
         translate(-50%,-50%) centering stops fighting our absolute
         coords. */
      panel.style.transform = 'none';
      panel.style.left = px + 'px';
      panel.style.top  = py + 'px';
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if(!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      var nx = Math.max(0, Math.min(window.innerWidth  - 80, px + dx));
      var ny = Math.max(0, Math.min(window.innerHeight - 40, py + dy));
      panel.style.left = nx + 'px';
      panel.style.top  = ny + 'px';
    });
    window.addEventListener('mouseup', function(){ dragging = false; });
  }

  function init(){
    var btn = byId('about-btn');
    if(!btn) return;
    btn.addEventListener('click', function(){ isOpen() ? hide() : show(); });

    var closeBtn = byId('about-close');
    if(closeBtn) closeBtn.addEventListener('click', hide);

    var expandBtn = byId('about-expand');
    if(expandBtn) expandBtn.addEventListener('click', toggleMaximized);

    var overlay = byId('about-overlay');
    if(overlay) overlay.addEventListener('click', hide);

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && isOpen()) hide();
    });

    /* Restore last max state (but keep the panel hidden until opened). */
    var saved = null;
    try{ saved = localStorage.getItem(KEY_MAX); }catch(_){}
    applyMaximized(saved === '1');

    wireDrag();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose for debugging / programmatic triggers. */
  window._aboutPanel = {
    open:  show,
    close: hide,
    toggle: function(){ isOpen() ? hide() : show(); },
    isOpen: isOpen,
    maximize: function(){ applyMaximized(true); },
    restore:  function(){ applyMaximized(false); }
  };
})();
