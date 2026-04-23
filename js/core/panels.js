/* ══════════════════════════════════════════════════════════
   PANEL Z-INDEX MANAGER — Brings clicked/opened panels to front.
   Reserved tiers:
     500-899   = normal popup panels (managed by this system)
     2000      = color wheel modal
     3000      = save dialog
     6000+     = showcase/export
     9000+     = overlays, tooltips
   ══════════════════════════════════════════════════════════ */
var _panelZ = 500;                     // current highest z-index for popups
var _PANEL_Z_MIN  = 500;               // floor
var _PANEL_Z_MAX  = 899;               // ceiling (below modals)
var _managedPanels = {};               // id → true  (panels we manage)

/** Register a panel for z-index management + click-to-front. */
function registerPanel(id){
  var p = (typeof id === 'string') ? document.getElementById(id) : id;
  if(!p) return;
  var pid = p.id || id;
  if(_managedPanels[pid]) return;      // already registered
  _managedPanels[pid] = true;
  /* Bring to front on any pointerdown inside the panel (works for mouse/touch/pen) */
  p.addEventListener('pointerdown', function(){ bringToFront(pid); }, true);
}

/** Bring a panel to the top of the stack. Auto-registers if needed. */
function bringToFront(id){
  var p = (typeof id === 'string') ? document.getElementById(id) : id;
  if(!p) return;
  var pid = p.id || id;
  /* Auto-register so click-to-front works even for late-created panels */
  if(!_managedPanels[pid]) registerPanel(pid);
  _panelZ++;
  /* If we've drifted too high, renumber all panels down */
  if(_panelZ > _PANEL_Z_MAX){
    _panelZ = _PANEL_Z_MIN;
    /* Reset all managed panels to the floor, the requested one goes on top */
    for(var k in _managedPanels){
      var el = document.getElementById(k);
      if(el) el.style.zIndex = _PANEL_Z_MIN;
    }
    _panelZ = _PANEL_Z_MIN + 1;
  }
  p.style.zIndex = _panelZ;
}

window.registerPanel = registerPanel;
window.bringToFront  = bringToFront;

/* ── Position, open, close floating panels ── */
function positionPanel(id){
  const p=document.getElementById(id);
  const tb=document.getElementById('tb');
  var savedPos=p._floatPos;
  if(savedPos){
    p.style.left=savedPos.left+'px';
    p.style.top=savedPos.top+'px';
  } else {
    var tbR=tb.getBoundingClientRect();
    var pw=parseInt(getComputedStyle(p).width)||260;
    p.style.left=Math.max(4, tbR.left - pw - 8)+'px';
    p.style.top='10px';
  }
  p.style.right='auto';
  p.style.bottom='auto';
}
function openPanel(id){
  /* No longer auto-close other panels — all popups stay open until
     the user explicitly closes them. bringToFront ensures the newly
     opened panel appears above any already-open panels. */
  var p = document.getElementById(id);
  if(!p) return;
  /* Only reposition if panel is not already open (preserve drag position) */
  if(!p.classList.contains('open')) positionPanel(id);
  p.classList.add('open');
  bringToFront(id);
  if(id==='upload-panel'&&window._positionUploadPanel)window._positionUploadPanel();
}
function closePanel(id){document.getElementById(id).classList.remove('open');}
window.positionPanel=positionPanel;
window.openPanel=openPanel;
window.closePanel=closePanel;

/* ── Make all floating panel headers draggable ── */
(function(){
  function makeDraggable(panelId){
    var panel=document.getElementById(panelId);
    if(!panel)return;
    var hdr=panel.querySelector('.fx-hdr');
    if(!hdr)return;
    /* Prevent browser gesture hijack on touch/pen */
    hdr.style.touchAction='none';
    var drag=null;
    hdr.addEventListener('pointerdown',function(e){
      if(e.target.classList.contains('fx-cls'))return;
      e.preventDefault();
      bringToFront(panelId);
      hdr.style.cursor='grabbing';
      try{hdr.setPointerCapture(e.pointerId);}catch(_){}
      var r=panel.getBoundingClientRect();
      drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top,pid:e.pointerId};
      function onMove(ev){
        if(!drag)return;
        var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
        var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
        panel.style.left=nl+'px';
        panel.style.top=nt+'px';
        panel._floatPos={left:nl,top:nt};
      }
      function onUp(){
        drag=null;hdr.style.cursor='grab';
        hdr.removeEventListener('pointermove',onMove);
        hdr.removeEventListener('pointerup',onUp);
        hdr.removeEventListener('pointercancel',onUp);
      }
      hdr.addEventListener('pointermove',onMove);
      hdr.addEventListener('pointerup',onUp);
      hdr.addEventListener('pointercancel',onUp);
    });
  }
  setTimeout(function(){
    /* Make core panels draggable + register them for z-management */
    ['light-panel','atmo-panel','upload-panel','prompt-panel','layers-panel'].forEach(function(id){
      makeDraggable(id);
      registerPanel(id);
    });
  },300);

  /* Late init: register ALL popup panels (including dynamically created ones)
     after all modules have loaded. Runs once, picks up every known panel ID. */
  setTimeout(function(){
    var popupIds = [
      /* Core fx-panels */
      'light-panel','atmo-panel','upload-panel','prompt-panel','layers-panel',
      /* Showcase & Help */
      'showcase-panel','help-panel',
      /* Experimental Tools floating panel */
      'exp-body',
      /* Tool panels */
      'hum-panel','nat-panel','curves-panel','grad-picker-panel',
      'tex-picker-panel','mp-panel','bp-box'
    ];
    popupIds.forEach(function(id){ registerPanel(id); });
  }, 2000);
})();
