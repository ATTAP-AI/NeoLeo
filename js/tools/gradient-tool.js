/* ══════════════════════════════════════════════════════════════
   GRADIENT TOOL v2 — Photoshop-accurate implementation
   Features: on-canvas live handle, gradient editor, 5 types,
   multi-stop editor with draggable stops, presets, opacity
   ══════════════════════════════════════════════════════════════ */
(function(){

/* ── State ── */
var gStops=[{pos:0,color:'#ff0000',opacity:1},{pos:.17,color:'#ff8800',opacity:1},{pos:.33,color:'#ffff00',opacity:1},{pos:.5,color:'#00cc00',opacity:1},{pos:.67,color:'#0000ff',opacity:1},{pos:.83,color:'#8800cc',opacity:1},{pos:1,color:'#ff0000',opacity:1}];
var gType='linear', gReverse=false, gOpacity=1.0;
var gX0=null,gY0=null,gX1=null,gY1=null; /* current gradient endpoints (canvas coords) */
var gActive=false; /* true when gradient is committed and handles are shown */
var gDrag=null;    /* 'start'|'end'|null */
var gEditorOpen=false;
var gSelStop=0;

/* ── CSS ── */
(function(){
  var s=document.createElement('style');
  s.textContent=[
    '.grad-type-btn{flex:1;padding:4px 2px;background:none;border:1px solid #1a1a2a;color:#444;font-size:11px;cursor:pointer;font-family:inherit;transition:all .1s;line-height:1;}',
    '.grad-type-btn:hover{color:var(--txt);border-color:#444;}',
    '.grad-type-btn.active{background:rgba(232,245,10,.1);border-color:var(--acc);color:var(--acc);}',
    '#grad-editor{position:fixed;z-index:10000;background:#0d0d18;border:1px solid #2a2a40;padding:0;width:310px;box-shadow:0 12px 48px rgba(0,0,0,.9);font-family:"Courier New",monospace;}',
    '#grad-editor-head{padding:8px 12px;border-bottom:1px solid #1a1a2a;display:flex;align-items:center;justify-content:space-between;}',
    '#grad-editor-head span{font-size:9px;letter-spacing:.2em;color:var(--acc);text-transform:uppercase;}',
    '#grad-editor-close{background:none;border:none;color:#444;font-size:13px;cursor:pointer;padding:0;line-height:1;}',
    '#grad-editor-close:hover{color:var(--txt);}',
    '#grad-editor-body{padding:10px 12px;}',
    '.grad-preset-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;}',
    '.gp-swatch{height:16px;cursor:pointer;border:1px solid #1a1a2a;transition:border-color .1s;}',
    '.gp-swatch:hover,.gp-swatch.sel{border-color:var(--acc);}',
    /* Stop editor bar */
    '#gbar-wrap{position:relative;margin-bottom:2px;}',
    '#gbar-canvas{display:block;width:100%;height:28px;cursor:crosshair;border:1px solid #2a2a40;}',
    '#gbar-markers{position:relative;height:14px;}',
    '.gstop-tri{position:absolute;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #888;transform:translateX(-5px);cursor:ew-resize;top:2px;}',
    '.gstop-tri.sel{border-bottom-color:var(--acc);}',
    '.gstop-tri:hover{border-bottom-color:#fff;}',
    /* Opacity bar */
    '#gop-bar-wrap{position:relative;margin-bottom:2px;}',
    '#gop-canvas{display:block;width:100%;height:12px;cursor:crosshair;border:1px solid #2a2a40;}',
    '#gop-markers{position:relative;height:12px;}',
    '.gopstop-tri{position:absolute;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:7px solid #888;transform:translateX(-4px);cursor:ew-resize;bottom:2px;}',
    '.gopstop-tri.sel{border-top-color:var(--acc);}',
    /* Stop controls */
    '#gstop-ctrl{display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-top:1px solid #1a1a28;border-bottom:1px solid #1a1a28;margin:4px 0;}',
    '#gstop-col{width:24px;height:20px;cursor:pointer;border:1px solid #444;background:none;flex-shrink:0;}',
    '.gsc-label{font-size:8px;color:#97c3b0;}',
    '.gsc-num{width:36px;background:#080810;border:1px solid #1a1a28;color:#888;font-size:8px;padding:2px 3px;font-family:inherit;}',
    '#gstop-del{background:none;border:1px solid #2a0a0a;color:#ff4060;font-size:8px;cursor:pointer;padding:2px 6px;margin-left:auto;}',
    /* On-canvas gradient line overlay */
    '#grad-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;overflow:hidden;}',
  ].join('');
  document.head.appendChild(s);
})();

/* ── Presets ── */
var PRESETS=[
  [{pos:0,color:'#000000',opacity:1},{pos:1,color:'#ffffff',opacity:1}],
  [{pos:0,color:'#ffffff',opacity:1},{pos:1,color:'#ffffff',opacity:0}],
  [{pos:0,color:'#000000',opacity:1},{pos:1,color:'#000000',opacity:0}],
  [{pos:0,color:'#ff0000',opacity:1},{pos:.5,color:'#ff8800',opacity:1},{pos:1,color:'#ffff00',opacity:1}],
  [{pos:0,color:'#ff0000',opacity:1},{pos:.17,color:'#ff8800',opacity:1},{pos:.33,color:'#ffff00',opacity:1},{pos:.5,color:'#00cc00',opacity:1},{pos:.67,color:'#0000ff',opacity:1},{pos:.83,color:'#8800cc',opacity:1},{pos:1,color:'#ff0000',opacity:1}],
  [{pos:0,color:'#E8F50A',opacity:1},{pos:1,color:'#28E0D1',opacity:1}],
  [{pos:0,color:'#1a0533',opacity:1},{pos:.5,color:'#c060ff',opacity:1},{pos:1,color:'#1a0533',opacity:1}],
  [{pos:0,color:'#ff2040',opacity:1},{pos:.5,color:'#ff8040',opacity:1},{pos:1,color:'#ffcc00',opacity:1}],
  [{pos:0,color:'#0a1830',opacity:1},{pos:1,color:'#40c0ff',opacity:1}],
  [{pos:0,color:'#000000',opacity:1},{pos:.4,color:'#c0a060',opacity:1},{pos:1,color:'#000000',opacity:1}],
  [{pos:0,color:'#1a0a0a',opacity:1},{pos:.5,color:'#ff4060',opacity:1},{pos:1,color:'#1a0a0a',opacity:1}],
  [{pos:0,color:'#000000',opacity:0},{pos:.5,color:'#ffffff',opacity:1},{pos:1,color:'#000000',opacity:0}],
  [{pos:0,color:'#c060ff',opacity:1},{pos:.5,color:'#ff4080',opacity:1},{pos:1,color:'#ff8040',opacity:1}],
  [{pos:0,color:'#002040',opacity:1},{pos:1,color:'#40ff80',opacity:1}],
];

/* ── Sorted stops ── */
function sortedStops(){
  var s=gStops.slice().sort(function(a,b){return a.pos-b.pos;});
  if(gReverse)s=s.map(function(st){return{pos:1-st.pos,color:st.color,opacity:st.opacity};}).reverse();
  return s;
}

/* ── Interpolate colour at t ── */
function interpColor(t){
  var s=sortedStops();
  if(!s.length)return[0,0,0,1];
  if(t<=s[0].pos){var c=s[0];return[_cr(c),_cg(c),_cb(c),c.opacity];}
  if(t>=s[s.length-1].pos){var c=s[s.length-1];return[_cr(c),_cg(c),_cb(c),c.opacity];}
  for(var i=0;i<s.length-1;i++){
    if(t>=s[i].pos&&t<=s[i+1].pos){
      var f=(s[i+1].pos-s[i].pos)>0?(t-s[i].pos)/(s[i+1].pos-s[i].pos):0;
      return[Math.round(_cr(s[i])+(_cr(s[i+1])-_cr(s[i]))*f),
             Math.round(_cg(s[i])+(_cg(s[i+1])-_cg(s[i]))*f),
             Math.round(_cb(s[i])+(_cb(s[i+1])-_cb(s[i]))*f),
             s[i].opacity+(s[i+1].opacity-s[i].opacity)*f];}
  }
  return[128,128,128,1];
}
function _cr(s){return parseInt(s.color.slice(1,3),16);}
function _cg(s){return parseInt(s.color.slice(3,5),16);}
function _cb(s){return parseInt(s.color.slice(5,7),16);}

/* ── Draw gradient onto ctx ── */
function applyGradientToCtx(ctx,x0,y0,x1,y1){
  var W=ctx.canvas.width,H=ctx.canvas.height;
  var s=sortedStops();
  ctx.save();
  if(typeof clipToCanvas==='function')clipToCanvas(ctx);
  ctx.globalAlpha=gOpacity;
  var dx=x1-x0,dy=y1-y0,len=Math.sqrt(dx*dx+dy*dy)||1;
  var grd;
  if(gType==='linear'){
    grd=ctx.createLinearGradient(x0,y0,x1,y1);
    s.forEach(function(st){grd.addColorStop(Math.max(0,Math.min(1,st.pos)),'rgba('+_cr(st)+','+_cg(st)+','+_cb(st)+','+st.opacity+')');});
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  } else if(gType==='radial'){
    grd=ctx.createRadialGradient(x0,y0,0,x0,y0,len);
    s.forEach(function(st){grd.addColorStop(Math.max(0,Math.min(1,st.pos)),'rgba('+_cr(st)+','+_cg(st)+','+_cb(st)+','+st.opacity+')');});
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  } else if(gType==='reflected'){
    grd=ctx.createLinearGradient(x0-dx,y0-dy,x1,y1);
    s.forEach(function(st){
      var col='rgba('+_cr(st)+','+_cg(st)+','+_cb(st)+','+st.opacity+')';
      grd.addColorStop(Math.max(0,Math.min(1,(1-st.pos)*0.5)),col);
      grd.addColorStop(Math.max(0,Math.min(1,0.5+st.pos*0.5)),col);
    });
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  } else if(gType==='angle'){
    var id=ctx.createImageData(W,H);var d=id.data;
    var ba=Math.atan2(dy,dx);
    for(var py=0;py<H;py++)for(var px=0;px<W;px++){
      var t=(((Math.atan2(py-y0,px-x0)-ba)%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
      var c=interpColor(t);var i=(py*W+px)*4;
      d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=Math.round(c[3]*255);
    }
    ctx.putImageData(id,0,0);
  } else if(gType==='diamond'){
    var id2=ctx.createImageData(W,H);var d2=id2.data;
    for(var py2=0;py2<H;py2++)for(var px2=0;px2<W;px2++){
      var t2=Math.min(1,(Math.abs(px2-x0)+Math.abs(py2-y0))/len);
      var c2=interpColor(t2);var i2=(py2*W+px2)*4;
      d2[i2]=c2[0];d2[i2+1]=c2[1];d2[i2+2]=c2[2];d2[i2+3]=Math.round(c2[3]*255);
    }
    ctx.putImageData(id2,0,0);
  }
  ctx.restore();
}

/* ── Expose for outer IIFE commitGradient ── */
window._ps_gradient_commit=function(x0,y0,x1,y1){
  gX0=x0;gY0=y0;gX1=x1;gY1=y1;
  /* Save snapshot BEFORE drawing so restSnap can restore pre-gradient state */
  if(window._saveSnap)window._saveSnap();
  if(window._saveU)window._saveU();
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx){var _d=document.getElementById('dv');if(_d)lctx=_d.getContext('2d');}
  if(!lctx)return;
  applyGradientToCtx(lctx,x0,y0,x1,y1);
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  gActive=true;
  showGradientOverlay();
};

/* ── On-canvas overlay — the gradient line with handles ── */
var gOverlaySVG=null;

function getDispScale(){
  /* Scale factor from canvas pixels to CSS pixels */
  var dvEl=document.getElementById('dv')||document.querySelector('#cvwrap canvas');
  if(!dvEl)return 1;
  return dvEl.getBoundingClientRect().width/(dvEl.width||750);
}

function showGradientOverlay(){
  removeGradientOverlay();
  var wrap=document.getElementById('cvwrap');
  if(!wrap||gX0===null)return;

  var sc=getDispScale();
  var sx=gX0*sc, sy=gY0*sc, ex=gX1*sc, ey=gY1*sc;

  var div=document.createElement('div');
  div.id='grad-overlay';
  /* pointer-events:none on container — interaction handled via document mousedown below */
  div.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:10;';
  div.innerHTML='<svg id="grad-ol-svg" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;"></svg>';
  wrap.appendChild(div);
  gOverlaySVG=div;

  rebuildOverlaySVG();
}

function rebuildOverlaySVG(){
  var svg=document.getElementById('grad-ol-svg');
  if(!svg)return;
  svg.innerHTML='';
  var sc=getDispScale();
  var sx=gX0*sc, sy=gY0*sc, ex=gX1*sc, ey=gY1*sc;
  var dx=ex-sx, dy=ey-sy;
  var len=Math.sqrt(dx*dx+dy*dy)||1;

  /* Line */
  var line=document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1',sx);line.setAttribute('y1',sy);
  line.setAttribute('x2',ex);line.setAttribute('y2',ey);
  line.setAttribute('stroke','rgba(255,255,255,0.85)');
  line.setAttribute('stroke-width','1.5');
  line.style.pointerEvents='none';
  svg.appendChild(line);

  /* Stop handles — small squares along the line proportional to stop position */
  var sorted=gStops.slice().sort(function(a,b){return a.pos-b.pos;});
  if(gReverse)sorted=sorted.map(function(s){return{pos:1-s.pos,color:s.color,opacity:s.opacity};}).reverse();

  sorted.forEach(function(st,i){
    /* Only show midpoint stops (not the very start/end handles) as small squares */
    if(st.pos>0.01&&st.pos<0.99){
      var px=sx+dx*st.pos, py=sy+dy*st.pos;
      var sq=document.createElementNS('http://www.w3.org/2000/svg','rect');
      sq.setAttribute('x',px-6);sq.setAttribute('y',py-6);
      sq.setAttribute('width',12);sq.setAttribute('height',12);
      sq.setAttribute('fill','rgba(255,255,255,0.15)');
      sq.setAttribute('stroke','rgba(255,255,255,0.8)');
      sq.setAttribute('stroke-width','1.5');
      sq.style.cursor='ew-resize';sq.style.pointerEvents='all';
      sq.dataset.stopidx=String(i);
      svg.appendChild(sq);
      /* Inner dot */
      var dot=document.createElementNS('http://www.w3.org/2000/svg','rect');
      dot.setAttribute('x',px-2);dot.setAttribute('y',py-2);
      dot.setAttribute('width',4);dot.setAttribute('height',4);
      dot.setAttribute('fill','rgba(255,255,255,0.9)');
      dot.style.pointerEvents='none';
      svg.appendChild(dot);
      /* Wire drag for midpoint stop */
      (function(stopSt,sq2){
        sq2.addEventListener('mousedown',function(e){
          e.preventDefault();e.stopPropagation();
          var wrap2=document.getElementById('cvwrap');
          var rect=wrap2.getBoundingClientRect();
          var sc2=getDispScale();
          gSelStop=gStops.indexOf(stopSt);
          if(typeof syncInlineStopControls==='function')syncInlineStopControls();
          function onMove(ev){
            /* Project mouse onto gradient line */
            var mx=(ev.clientX-rect.left)/sc2, my=(ev.clientY-rect.top)/sc2;
            var adx=gX1-gX0, ady=gY1-gY0, len2=adx*adx+ady*ady||1;
            var t=Math.max(0.01,Math.min(0.99,((mx-gX0)*adx+(my-gY0)*ady)/len2));
            stopSt.pos=t;
            rebuildOverlaySVG();renderPanelPreview();reapplyGradient();
            if(typeof syncInlineStopControls==='function')syncInlineStopControls();
          }
          function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);}
          document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
        });
      })(st,sq);
    }
  });

  /* Start circle handle */
  var startG=document.createElementNS('http://www.w3.org/2000/svg','g');
  startG.style.cursor='grab';startG.style.pointerEvents='all';
  startG.id='grad-h-start';
  var sc1=document.createElementNS('http://www.w3.org/2000/svg','circle');
  sc1.setAttribute('cx',sx);sc1.setAttribute('cy',sy);sc1.setAttribute('r',9);
  sc1.setAttribute('fill','rgba(255,255,255,0.1)');
  sc1.setAttribute('stroke','rgba(255,255,255,0.9)');sc1.setAttribute('stroke-width',1.5);
  sc1.style.pointerEvents='none';
  var sc2=document.createElementNS('http://www.w3.org/2000/svg','circle');
  sc2.setAttribute('cx',sx);sc2.setAttribute('cy',sy);sc2.setAttribute('r',3);
  sc2.setAttribute('fill','rgba(255,255,255,0.95)');sc2.style.pointerEvents='none';
  startG.appendChild(sc1);startG.appendChild(sc2);
  svg.appendChild(startG);
  wireHandleDrag('grad-h-start','start');

  /* End circle handle (blue outlined, matching PS) */
  var endG=document.createElementNS('http://www.w3.org/2000/svg','g');
  endG.style.cursor='grab';endG.style.pointerEvents='all';
  endG.id='grad-h-end';
  var ec1=document.createElementNS('http://www.w3.org/2000/svg','circle');
  ec1.setAttribute('cx',ex);ec1.setAttribute('cy',ey);ec1.setAttribute('r',9);
  ec1.setAttribute('fill','rgba(40,100,255,0.2)');
  ec1.setAttribute('stroke','rgba(60,140,255,0.95)');ec1.setAttribute('stroke-width',2);
  ec1.style.pointerEvents='none';
  var ec2=document.createElementNS('http://www.w3.org/2000/svg','circle');
  ec2.setAttribute('cx',ex);ec2.setAttribute('cy',ey);ec2.setAttribute('r',3);
  ec2.setAttribute('fill','rgba(255,255,255,0.9)');ec2.style.pointerEvents='none';
  endG.appendChild(ec1);endG.appendChild(ec2);
  svg.appendChild(endG);
  wireHandleDrag('grad-h-end','end');
}

function removeGradientOverlay(){
  var old=document.getElementById('grad-overlay');
  if(old)old.remove();
  gOverlaySVG=null;
}

function wireHandleDrag(elemId,which){
  /* Interaction now handled by document-level mousedown below — no-op */
}

function updateOverlayPositions(){
  if(!gOverlaySVG)return;
  var sc=getDispScale();
  var sx=gX0*sc,sy=gY0*sc,ex=gX1*sc,ey=gY1*sc;
  var line=document.getElementById('grad-ol-line');
  var hs=document.getElementById('grad-h-start');
  var he=document.getElementById('grad-h-end');
  if(line){line.setAttribute('x1',sx);line.setAttribute('y1',sy);line.setAttribute('x2',ex);line.setAttribute('y2',ey);}
  if(hs){hs.setAttribute('cx',sx);hs.setAttribute('cy',sy);
    /* Also update the dot */
    var dots=gOverlaySVG.querySelectorAll('circle');
    if(dots[1]){dots[1].setAttribute('cx',sx);dots[1].setAttribute('cy',sy);}}
  if(he){he.setAttribute('x',ex-7);he.setAttribute('y',ey-7);
    var rects=gOverlaySVG.querySelectorAll('rect');
    if(rects[1]){rects[1].setAttribute('x',ex-2.5);rects[1].setAttribute('y',ey-2.5);}}
}

/* snap to angle on shift */
function snapAngle(x0,y0,x1,y1,shift){
  if(!shift)return[x1,y1];
  var dx=x1-x0,dy=y1-y0;
  var ang=Math.atan2(dy,dx);
  var snapped=Math.round(ang/(Math.PI/4))*(Math.PI/4);
  var len=Math.sqrt(dx*dx+dy*dy);
  return[x0+Math.cos(snapped)*len,y0+Math.sin(snapped)*len];
}

/* Re-apply without saveU (live drag) */
function reapplyGradient(){
  if(window._restSnap)window._restSnap();
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx){var _d=document.getElementById('dv');if(_d)lctx=_d.getContext('2d');}
  if(!lctx)return;
  applyGradientToCtx(lctx,gX0,gY0,gX1,gY1);
  if(window._layersCompositeFn)window._layersCompositeFn();
  renderPanelPreview();
}

/* Deactivate overlay when switching tools */
var _origSetTool2=window.setTool_ps;
var _patched=false;
if(!_patched){
  _patched=true;
  var _orig2=window.setTool_ps;
  window.setTool_ps=function(t){
    if(_orig2)_orig2(t);
    if(t==='gradient'){
      /* Auto-show overlay immediately when gradient tool activated */
      if(!gActive){
        var wrap=document.getElementById('cvwrap');
        if(wrap){
          var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
          if(!lctx){var _d2=document.getElementById('dv');if(_d2)lctx=_d2.getContext('2d');}
          if(lctx){
            var W=lctx.canvas.width, H=lctx.canvas.height;
            /* Default: diagonal top-left → bottom-right */
            if(gX0===null){gX0=W*0.15;gY0=H*0.15;gX1=W*0.85;gY1=H*0.85;}
            if(window._saveSnap)window._saveSnap();
            if(window._saveU)window._saveU();
            applyGradientToCtx(lctx,gX0,gY0,gX1,gY1);
            if(window._layersCompositeFn)window._layersCompositeFn();
            gActive=true;
            showGradientOverlay();
          }
        }
      }
    } else if(gActive){
      removeGradientOverlay();gActive=false;
    }
  };
}

/* ── Spacebar: pause/resume temporal play and loop ── */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  if(e.key!==' ')return;
  var tbody=document.getElementById('temporal-body');
  if(!tbody||tbody.style.display==='none')return;
  e.preventDefault();
  var _tc=window._tc;
  if(!_tc)return;
  if(_tc.playing){
    /* Pause */
    _tc.playing=false;
    if(_tc.rafId){cancelAnimationFrame(_tc.rafId);_tc.rafId=null;}
    var pb=document.getElementById('tc-play-btn');
    if(pb){pb.textContent='▶ Play';pb.style.color='#28E0D1';pb.style.borderColor='#28E0D1';}
    var lb=document.getElementById('tc-loop-btn');
    if(lb&&_tc.looping){lb.textContent='↺ Loop';lb.style.color='#20b090';lb.style.borderColor='#0a3a2a';}
    var si2=document.getElementById('si');if(si2)si2.textContent='Temporal paused — Space to resume';
  } else {
    /* Resume from current position */
    var framesEl=document.getElementById('tc-frames');
    var maxFrames2=framesEl?Math.max(10,Math.min(9999,parseInt(framesEl.value)||1000)):1000;
    _tc.playing=true;
    var pb2=document.getElementById('tc-play-btn');
    if(pb2){pb2.textContent=_tc.looping?'▶ Play':'⏸ Pause';pb2.style.color=_tc.looping?'#28E0D1':'#E8F50A';pb2.style.borderColor=_tc.looping?'#28E0D1':'#E8F50A';}
    var lb2=document.getElementById('tc-loop-btn');
    if(lb2&&_tc.looping){lb2.textContent='⏸ Loop';lb2.style.color='#E8F50A';lb2.style.borderColor='#E8F50A';}
    if(typeof startPlayback==='function')startPlayback(maxFrames2,_tc.looping);
    var si3=document.getElementById('si');if(si3)si3.textContent='Temporal resuming — Space to pause';
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&gActive){removeGradientOverlay();gActive=false;}
});

/* ── Document-level gradient handle interaction ── */
/* Handles drawn in SVG inside pointer-events:none div — we detect proximity here */
document.addEventListener('mousedown',function(e){
  if(!gActive||!gOverlaySVG)return;
  var wrap=document.getElementById('cvwrap');
  if(!wrap)return;
  var rect=wrap.getBoundingClientRect();
  var sc=getDispScale();
  var mx=(e.clientX-rect.left)/sc;
  var my=(e.clientY-rect.top)/sc;

  /* Check proximity to start handle (circle, r=9 in canvas px) */
  var HIT=14/sc; /* hit radius in canvas pixels */
  var distStart=Math.sqrt((mx-gX0)*(mx-gX0)+(my-gY0)*(my-gY0));
  var distEnd  =Math.sqrt((mx-gX1)*(mx-gX1)+(my-gY1)*(my-gY1));

  /* Check midpoint stop handles */
  var hitStop=-1;
  var dx=gX1-gX0, dy=gY1-gY0;
  gStops.forEach(function(st,i){
    if(st.pos<=0.02||st.pos>=0.98)return;
    var px=gX0+dx*st.pos, py=gY0+dy*st.pos;
    var d=Math.sqrt((mx-px)*(mx-px)+(my-py)*(my-py));
    if(d<HIT){hitStop=i;}
  });

  var which=null;
  var hitStopIdx=-1;
  if(distStart<HIT&&(hitStop<0||distStart<distEnd)){which='start';}
  else if(distEnd<HIT){which='end';}
  else if(hitStop>=0){which='stop';hitStopIdx=hitStop;}

  if(!which)return;
  e.preventDefault();e.stopPropagation();

  if(which==='stop'){
    /* Select the stop and wire drag */
    gSelStop=hitStopIdx;
    if(typeof syncInlineStopControls==='function')syncInlineStopControls();
  }

  function onMove(ev){
    var cx=(ev.clientX-rect.left)/sc;
    var cy=(ev.clientY-rect.top)/sc;
    cx=Math.max(0,Math.min(cx,wrap.offsetWidth/sc*sc/sc));
    cy=Math.max(0,Math.min(cy,wrap.offsetHeight/sc*sc/sc));
    /* Re-read rect each frame in case of scroll */
    var r2=wrap.getBoundingClientRect();
    var cx2=(ev.clientX-r2.left)/sc;
    var cy2=(ev.clientY-r2.top)/sc;

    if(which==='start'){gX0=cx2;gY0=cy2;}
    else if(which==='end'){gX1=cx2;gY1=cy2;}
    else if(which==='stop'){
      /* Project onto gradient line */
      var adx=gX1-gX0,ady=gY1-gY0,len2=adx*adx+ady*ady||1;
      var t=Math.max(0.01,Math.min(0.99,((cx2-gX0)*adx+(cy2-gY0)*ady)/len2));
      gStops[hitStopIdx].pos=t;
      if(typeof syncInlineStopControls==='function')syncInlineStopControls();
    }
    reapplyGradient();
    rebuildOverlaySVG();
    renderPanelPreview();
    if(typeof syncInlineStopControls==='function')syncInlineStopControls();
  }

  function onUp(){
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  }
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
},{capture:true});

/* ── Gradient panel preview ── */
function renderPanelPreview(){
  var c=document.getElementById('grad-preview');
  if(!c)return;
  var ctx=c.getContext('2d');
  var W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  /* checkerboard */
  for(var cy=0;cy<H;cy+=4)for(var cx=0;cx<W;cx+=4){
    ctx.fillStyle=((Math.floor(cx/4)+Math.floor(cy/4))%2)?'#aaa':'#777';
    ctx.fillRect(cx,cy,4,4);
  }
  var s=sortedStops();
  var grd=ctx.createLinearGradient(0,0,W,0);
  s.forEach(function(st){grd.addColorStop(Math.max(0,Math.min(1,st.pos)),'rgba('+_cr(st)+','+_cg(st)+','+_cb(st)+','+st.opacity+')');});
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
}

/* ── Gradient editor popup ── */
var gEdEl=null;

function openGradientEditor(near){
  if(gEdEl){gEdEl.remove();gEdEl=null;gEditorOpen=false;return;}
  gEditorOpen=true;
  gEdEl=document.createElement('div');
  gEdEl.id='grad-editor';
  gEdEl.innerHTML=[
    '<div id="grad-editor-head"><span>Gradient Editor</span><button id="grad-editor-close">✕</button></div>',
    '<div id="grad-editor-body">',
    /* presets */
    '<div style="font-size:8px;color:#97c3b0;margin-bottom:5px;letter-spacing:.1em;">PRESETS</div>',
    '<div class="grad-preset-strip" id="gp-strip"></div>',
    /* gradient name row */
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">',
    '<canvas id="gbar-canvas" width="256" height="28" style="flex:1;height:28px;cursor:crosshair;border:1px solid #2a2a40;"></canvas>',
    '</div>',
    /* colour stop markers */
    '<div id="gbar-markers" style="position:relative;height:16px;margin-bottom:4px;"></div>',
    /* stop controls */
    '<div id="gstop-ctrl">',
    '<span class="gsc-label">Colour</span>',
    '<input type="color" id="gstop-col">',
    '<span class="gsc-label" style="margin-left:6px;">Opacity</span>',
    '<input type="range" id="gstop-op" min="0" max="100" value="100" style="width:55px;">',
    '<span id="gstop-op-v" class="gsc-label">100%</span>',
    '<span class="gsc-label" style="margin-left:6px;">Pos</span>',
    '<input type="number" id="gstop-pos" min="0" max="100" value="0" class="gsc-num">',
    '<span class="gsc-label">%</span>',
    '<button id="gstop-del">Del</button>',
    '</div>',
    '<div style="font-size:7px;color:#333;margin-bottom:6px;">Click bar to add stop · Drag ▲ to move · Click ▲ to select</div>',
    /* options */
    '<div style="display:flex;gap:10px;align-items:center;border-top:1px solid #1a1a28;padding-top:6px;">',
    '<label style="font-size:8px;color:#97c3b0;display:flex;align-items:center;gap:3px;cursor:pointer;"><input type="checkbox" id="ged-reverse"> Reverse</label>',
    '<div style="font-size:8px;color:#97c3b0;margin-left:auto;">Opacity</div>',
    '<input type="range" id="ged-opacity" min="1" max="100" value="100" style="width:60px;">',
    '<span id="ged-opacity-v" style="font-size:8px;color:#97c3b0;min-width:26px;">100%</span>',
    '</div>',
    '</div>',
  ].join('');
  document.body.appendChild(gEdEl);

  /* Position */
  var br=near.getBoundingClientRect();
  var left=br.left-320; if(left<4)left=br.right+6;
  gEdEl.style.left=left+'px';
  gEdEl.style.top=Math.max(4,Math.min(window.innerHeight-400,br.top))+'px';

  /* Presets */
  var strip=document.getElementById('gp-strip');
  PRESETS.forEach(function(ps){
    var cv=document.createElement('canvas');cv.width=30;cv.height=16;cv.className='gp-swatch';
    var pc=cv.getContext('2d');
    var pg=pc.createLinearGradient(0,0,30,0);
    ps.forEach(function(st){pg.addColorStop(Math.max(0,Math.min(1,st.pos)),'rgba('+parseInt(st.color.slice(1,3),16)+','+parseInt(st.color.slice(3,5),16)+','+parseInt(st.color.slice(5,7),16)+','+st.opacity+')');});
    pc.fillStyle=pg;pc.fillRect(0,0,30,16);
    cv.onclick=function(){
      var preset={name:'preset',stops:ps};
      if(window._applyPresetGradient){window._applyPresetGradient(preset,null);}
      gSelStop=0;if(typeof refreshEditor==='function')refreshEditor();
    };
    strip.appendChild(cv);
  });

  refreshEditor();

  /* Close */
  document.getElementById('grad-editor-close').onclick=function(){gEdEl.remove();gEdEl=null;gEditorOpen=false;};

  /* Bar click = add stop */
  var bc=document.getElementById('gbar-canvas');
  bc.addEventListener('click',function(e){
    var rect=bc.getBoundingClientRect();
    var p=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
    var c=interpColor(p);
    var hex='#'+[c[0],c[1],c[2]].map(function(v){return v.toString(16).padStart(2,'0');}).join('');
    gStops.push({pos:p,color:hex,opacity:c[3]});
    gSelStop=gStops.length-1;
    refreshEditor();renderPanelPreview();
  });

  /* Stop colour */
  document.getElementById('gstop-col').addEventListener('input',function(e){gStops[gSelStop].color=e.target.value;refreshEditor();renderPanelPreview();if(gActive)reapplyGradient();});
  /* Stop opacity */
  document.getElementById('gstop-op').addEventListener('input',function(e){gStops[gSelStop].opacity=parseInt(e.target.value)/100;document.getElementById('gstop-op-v').textContent=e.target.value+'%';refreshEditor();renderPanelPreview();if(gActive)reapplyGradient();});
  /* Stop position */
  document.getElementById('gstop-pos').addEventListener('change',function(e){gStops[gSelStop].pos=Math.max(0,Math.min(1,parseInt(e.target.value)/100));refreshEditor();renderPanelPreview();if(gActive)reapplyGradient();});
  /* Del */
  document.getElementById('gstop-del').addEventListener('click',function(){if(gStops.length<=2)return;gStops.splice(gSelStop,1);gSelStop=Math.max(0,gSelStop-1);refreshEditor();renderPanelPreview();if(gActive)reapplyGradient();});
  /* Reverse */
  document.getElementById('ged-reverse').addEventListener('change',function(e){gReverse=e.target.checked;renderPanelPreview();if(gActive)reapplyGradient();});
  /* Opacity */
  document.getElementById('ged-opacity').addEventListener('input',function(e){gOpacity=parseInt(e.target.value)/100;document.getElementById('ged-opacity-v').textContent=e.target.value+'%';if(gActive)reapplyGradient();});
}

function refreshEditor(){
  if(!gEdEl)return;
  /* Re-render gradient bar */
  var bc=document.getElementById('gbar-canvas');
  if(bc){
    var ctx=bc.getContext('2d');var W=bc.width,H=bc.height;
    ctx.clearRect(0,0,W,H);
    for(var cy=0;cy<H;cy+=4)for(var cx=0;cx<W;cx+=4){
      ctx.fillStyle=((Math.floor(cx/4)+Math.floor(cy/4))%2)?'#aaa':'#777';ctx.fillRect(cx,cy,4,4);
    }
    var s=sortedStops();
    var grd=ctx.createLinearGradient(0,0,W,0);
    s.forEach(function(st){grd.addColorStop(Math.max(0,Math.min(1,st.pos)),'rgba('+_cr(st)+','+_cg(st)+','+_cb(st)+','+st.opacity+')');});
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  }
  /* Render stop markers */
  var markWrap=document.getElementById('gbar-markers');
  if(markWrap){
    markWrap.innerHTML='';
    gStops.forEach(function(st,i){
      var m=document.createElement('div');
      m.className='gstop-tri'+(i===gSelStop?' sel':'');
      m.style.left=(st.pos*100)+'%';
      m.style.backgroundColor=st.color;
      markWrap.appendChild(m);
      /* Click to select */
      m.addEventListener('mousedown',function(e){
        e.stopPropagation();gSelStop=i;updateStopCtrl();refreshEditor();if(typeof syncInlineStopControls==='function')syncInlineStopControls();
        /* Drag to move */
        var bc2=document.getElementById('gbar-canvas');
        if(!bc2)return;
        var rect=bc2.getBoundingClientRect();
        function mv(ev){var p=Math.max(0,Math.min(1,(ev.clientX-rect.left)/rect.width));gStops[i].pos=p;refreshEditor();renderPanelPreview();if(gActive)reapplyGradient();}
        function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);updateStopCtrl();}
        document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
      });
    });
  }
  updateStopCtrl();
}

function updateStopCtrl(){
  var st=gStops[gSelStop];if(!st)return;
  var cs=document.getElementById('gstop-col');if(cs)cs.value=st.color;
  var so=document.getElementById('gstop-op');if(so)so.value=Math.round(st.opacity*100);
  var sv=document.getElementById('gstop-op-v');if(sv)sv.textContent=Math.round(st.opacity*100)+'%';
  var sp=document.getElementById('gstop-pos');if(sp)sp.value=Math.round(st.pos*100);
}

/* ── Sync inline stop controls from currently selected stop ── */
function syncInlineStopControls(){
  var st=gStops[gSelStop];if(!st)return;
  var col=document.getElementById('gstop-col-inline');
  var colHex=document.getElementById('gstop-col-hex');
  var pos=document.getElementById('gstop-pos-inline');
  var posV=document.getElementById('gstop-pos-inline-v');
  var op2=document.getElementById('gstop-op-inline');
  var opV2=document.getElementById('gstop-op-inline-v');
  if(col)col.value=st.color;
  if(colHex)colHex.textContent=st.color;
  if(pos){pos.value=Math.round(st.pos*100);}
  if(posV)posV.textContent=Math.round(st.pos*100)+'%';
  if(op2)op2.value=Math.round(st.opacity*100);
  if(opV2)opV2.textContent=Math.round(st.opacity*100)+'%';
}

/* ── Wire panel controls ── */
function wirePanelControls(){
  /* Preview bar click → open editor */
  var prev=document.getElementById('grad-preview');
  if(prev){renderPanelPreview();prev.addEventListener('click',function(){openGradientEditor(prev);});}

  /* Type buttons */
  document.querySelectorAll('.grad-type-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      gType=btn.dataset.gt;
      document.querySelectorAll('.grad-type-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      renderPanelPreview();
      if(gActive)reapplyGradient();
    });
  });

  /* Inline stop colour */
  var inlineCol=document.getElementById('gstop-col-inline');
  var inlineColHex=document.getElementById('gstop-col-hex');
  if(inlineCol){
    inlineCol.addEventListener('input',function(){
      gStops[gSelStop].color=inlineCol.value;
      if(inlineColHex)inlineColHex.textContent=inlineCol.value;
      renderPanelPreview();
      if(gActive)reapplyGradient();
      /* Sync editor if open */
      if(typeof refreshEditor==='function')refreshEditor();
    });
  }

  /* Inline stop position */
  var inlinePos=document.getElementById('gstop-pos-inline');
  var inlinePosV=document.getElementById('gstop-pos-inline-v');
  if(inlinePos){
    inlinePos.addEventListener('input',function(){
      gStops[gSelStop].pos=parseInt(inlinePos.value)/100;
      if(inlinePosV)inlinePosV.textContent=inlinePos.value+'%';
      renderPanelPreview();
      if(gActive)reapplyGradient();
    });
  }

  /* Inline stop opacity */
  var inlineOp=document.getElementById('gstop-op-inline');
  var inlineOpV=document.getElementById('gstop-op-inline-v');
  if(inlineOp){
    inlineOp.addEventListener('input',function(){
      gStops[gSelStop].opacity=parseInt(inlineOp.value)/100;
      if(inlineOpV)inlineOpV.textContent=inlineOp.value+'%';
      renderPanelPreview();
      if(gActive)reapplyGradient();
    });
  }

  /* Add stop */
  var addBtn=document.getElementById('gstop-add-btn');
  if(addBtn){
    addBtn.addEventListener('click',function(){
      var newPos=(gSelStop<gStops.length-1)?(gStops[gSelStop].pos+gStops[gSelStop+1].pos)/2:Math.min(1,gStops[gSelStop].pos+0.1);
      var c=interpColor(newPos);
      var hex='#'+[c[0],c[1],c[2]].map(function(v){return v.toString(16).padStart(2,'0');}).join('');
      gStops.push({pos:newPos,color:hex,opacity:c[3]});
      gSelStop=gStops.length-1;
      syncInlineStopControls();
      renderPanelPreview();
      if(gActive)reapplyGradient();
      if(typeof refreshEditor==='function')refreshEditor();
    });
  }

  /* Delete stop */
  var delBtn=document.getElementById('gstop-del-btn');
  if(delBtn){
    delBtn.addEventListener('click',function(){
      if(gStops.length<=2)return;
      gStops.splice(gSelStop,1);
      gSelStop=Math.max(0,gSelStop-1);
      syncInlineStopControls();
      renderPanelPreview();
      if(gActive)reapplyGradient();
      if(typeof refreshEditor==='function')refreshEditor();
    });
  }

  /* Prev/Next stop navigation */
  var prevBtn=document.getElementById('gstop-prev-btn');
  var nextBtn=document.getElementById('gstop-next-btn');
  if(prevBtn){prevBtn.addEventListener('click',function(){gSelStop=Math.max(0,gSelStop-1);syncInlineStopControls();});}
  if(nextBtn){nextBtn.addEventListener('click',function(){gSelStop=Math.min(gStops.length-1,gSelStop+1);syncInlineStopControls();});}

  /* Reverse */
  var rev=document.getElementById('grad-reverse');
  if(rev)rev.addEventListener('change',function(){gReverse=rev.checked;renderPanelPreview();if(gActive)reapplyGradient();});

  /* Overall opacity */
  var op=document.getElementById('grad-op');
  var opv=document.getElementById('grad-op-v');
  if(op)op.addEventListener('input',function(){gOpacity=parseInt(op.value)/100;if(opv)opv.textContent=op.value+'%';renderPanelPreview();if(gActive)reapplyGradient();});

  /* Initial sync */
  syncInlineStopControls();
}

/* ── sz() resize: update overlay positions ── */
var _origSz2=typeof sz==='function'?sz:null;
window.addEventListener('resize',function(){
  setTimeout(function(){if(gActive&&gOverlaySVG)updateOverlayPositions();},50);
});

/* ── Gradient Picker Floating Panel (Photoshop-style) ── */
var gPickerEl=null, gPickerOpen=false;

var NAMED_PRESETS=[
  {name:'Foreground → Background',stops:[{pos:0,color:'#000000',opacity:1},{pos:1,color:'#ffffff',opacity:1}]},
  {name:'Foreground → Transparent',stops:[{pos:0,color:'#ffffff',opacity:1},{pos:1,color:'#ffffff',opacity:0}]},
  {name:'Black → Transparent',stops:[{pos:0,color:'#000000',opacity:1},{pos:1,color:'#000000',opacity:0}]},
  {name:'Sunset Blaze',stops:[{pos:0,color:'#ff0000',opacity:1},{pos:.5,color:'#ff8800',opacity:1},{pos:1,color:'#ffff00',opacity:1}]},
  {name:'Spectrum',stops:[{pos:0,color:'#ff0000',opacity:1},{pos:.17,color:'#ff8800',opacity:1},{pos:.33,color:'#ffff00',opacity:1},{pos:.5,color:'#00cc00',opacity:1},{pos:.67,color:'#0000ff',opacity:1},{pos:.83,color:'#8800cc',opacity:1},{pos:1,color:'#ff0000',opacity:1}]},
  {name:'Acid Flash',stops:[{pos:0,color:'#E8F50A',opacity:1},{pos:1,color:'#28E0D1',opacity:1}]},
  {name:'Purple Nebula',stops:[{pos:0,color:'#1a0533',opacity:1},{pos:.5,color:'#c060ff',opacity:1},{pos:1,color:'#1a0533',opacity:1}]},
  {name:'Lava Flow',stops:[{pos:0,color:'#ff2040',opacity:1},{pos:.5,color:'#ff8040',opacity:1},{pos:1,color:'#ffcc00',opacity:1}]},
  {name:'Midnight Sky',stops:[{pos:0,color:'#0a1830',opacity:1},{pos:1,color:'#40c0ff',opacity:1}]},
  {name:'Gold Bar',stops:[{pos:0,color:'#000000',opacity:1},{pos:.4,color:'#c0a060',opacity:1},{pos:1,color:'#000000',opacity:1}]},
  {name:'Ruby Pulse',stops:[{pos:0,color:'#1a0a0a',opacity:1},{pos:.5,color:'#ff4060',opacity:1},{pos:1,color:'#1a0a0a',opacity:1}]},
  {name:'Centre Glow',stops:[{pos:0,color:'#000000',opacity:0},{pos:.5,color:'#ffffff',opacity:1},{pos:1,color:'#000000',opacity:0}]},
  {name:'Synthwave',stops:[{pos:0,color:'#c060ff',opacity:1},{pos:.5,color:'#ff4080',opacity:1},{pos:1,color:'#ff8040',opacity:1}]},
  {name:'Deep Sea',stops:[{pos:0,color:'#002040',opacity:1},{pos:1,color:'#40ff80',opacity:1}]},
  {name:'Chrome',stops:[{pos:0,color:'#666666',opacity:1},{pos:.25,color:'#ffffff',opacity:1},{pos:.5,color:'#888888',opacity:1},{pos:.75,color:'#ffffff',opacity:1},{pos:1,color:'#666666',opacity:1}]},
  {name:'Copper Patina',stops:[{pos:0,color:'#442200',opacity:1},{pos:.5,color:'#22aa88',opacity:1},{pos:1,color:'#442200',opacity:1}]},
  {name:'Arctic Glow',stops:[{pos:0,color:'#001428',opacity:1},{pos:.4,color:'#00e8ff',opacity:1},{pos:.7,color:'#80ffcc',opacity:1},{pos:1,color:'#ffffff',opacity:1}]},
  {name:'Blood Moon',stops:[{pos:0,color:'#100000',opacity:1},{pos:.5,color:'#cc2200',opacity:1},{pos:.8,color:'#ff6600',opacity:1},{pos:1,color:'#ffcc44',opacity:1}]},
  {name:'Oceanic',stops:[{pos:0,color:'#001030',opacity:1},{pos:.33,color:'#0060aa',opacity:1},{pos:.66,color:'#00ccdd',opacity:1},{pos:1,color:'#aaffee',opacity:1}]},
  {name:'Forest Floor',stops:[{pos:0,color:'#0a1a04',opacity:1},{pos:.5,color:'#2a6020',opacity:1},{pos:1,color:'#c0e040',opacity:1}]},
  {name:'Infrared',stops:[{pos:0,color:'#000000',opacity:1},{pos:.25,color:'#220044',opacity:1},{pos:.5,color:'#cc0066',opacity:1},{pos:.75,color:'#ff4444',opacity:1},{pos:1,color:'#ffff00',opacity:1}]},
  {name:'Steel',stops:[{pos:0,color:'#1a1a22',opacity:1},{pos:.5,color:'#5a6070',opacity:1},{pos:1,color:'#c0c8d0',opacity:1}]},
  {name:'Pastel Dream',stops:[{pos:0,color:'#ffc0cb',opacity:1},{pos:.33,color:'#c0e0ff',opacity:1},{pos:.66,color:'#d0ffc0',opacity:1},{pos:1,color:'#fff0c0',opacity:1}]},
  {name:'Neon Stripe',stops:[{pos:0,color:'#ff00ff',opacity:1},{pos:.25,color:'#000000',opacity:1},{pos:.5,color:'#00ffff',opacity:1},{pos:.75,color:'#000000',opacity:1},{pos:1,color:'#ff00ff',opacity:1}]},
  {name:'Burnt Sienna',stops:[{pos:0,color:'#2a1008',opacity:1},{pos:.5,color:'#a04820',opacity:1},{pos:1,color:'#e8c080',opacity:1}]},
  {name:'Holographic',stops:[{pos:0,color:'#ff6080',opacity:1},{pos:.2,color:'#ff8040',opacity:1},{pos:.4,color:'#ffee00',opacity:1},{pos:.6,color:'#40ff80',opacity:1},{pos:.8,color:'#40c0ff',opacity:1},{pos:1,color:'#c040ff',opacity:1}]},
  {name:'Transparent Rainbow',stops:[{pos:0,color:'#ff0000',opacity:0},{pos:.25,color:'#ffff00',opacity:.6},{pos:.5,color:'#00ff00',opacity:1},{pos:.75,color:'#0000ff',opacity:.6},{pos:1,color:'#ff00ff',opacity:0}]},
  {name:'Duotone Pink',stops:[{pos:0,color:'#0a0018',opacity:1},{pos:1,color:'#ff6090',opacity:1}]},
];

function buildGradientPicker(){
  if(gPickerEl)return;

  /* ── CSS ── */
  var sty=document.createElement('style');
  sty.textContent=[
    '#grad-picker-panel{display:none;position:fixed;z-index:600;',
    '  width:310px;max-height:calc(100vh - 40px);',
    '  background:#2e2a1a;',
    '  border:1px solid rgba(255,255,255,0.2);border-radius:8px;',
    '  box-shadow:0 10px 50px rgba(0,0,0,0.85);',
    '  font-family:inherit;overflow:hidden;',
    '  flex-direction:column;}',
    '#grad-picker-panel.open{display:flex;}',
    /* Header */
    '#gp-head{display:flex;align-items:center;justify-content:space-between;',
    '  padding:10px 14px;',
    '  border-bottom:1px solid rgba(255,255,255,0.1);',
    '  background:rgba(0,0,0,0.15);flex-shrink:0;',
    '  cursor:grab;user-select:none;-webkit-user-select:none;',
    '  border-radius:8px 8px 0 0;}',
    '#gp-head::before{content:"⠿";color:rgba(255,255,255,0.15);',
    '  font-size:14px;margin-right:8px;line-height:1;}',
    '#gp-head-title{font-size:10px;letter-spacing:.2em;',
    '  color:#ffffff;text-transform:uppercase;font-weight:700;line-height:1.6;}',
    '#gp-head-sub{font-size:8px;color:#40c8a0;',
    '  margin-top:2px;line-height:1.5;letter-spacing:.06em;}',
    '#gp-close{background:none;border:1px solid rgba(255,255,255,0.2);',
    '  color:rgba(255,255,255,0.5);font-size:9px;letter-spacing:.08em;',
    '  padding:4px 10px;height:auto;width:auto;',
    '  cursor:pointer;border-radius:3px;line-height:1.4;',
    '  position:relative;z-index:2;flex-shrink:0;font-family:inherit;}',
    '#gp-close:hover{color:#fff;border-color:#E8F50A;background:rgba(232,245,10,0.08);}',
    /* Current preview */
    '#gp-current-wrap{padding:10px 14px 8px;flex-shrink:0;',
    '  border-bottom:1px solid rgba(255,255,255,0.06);}',
    '#gp-current-label{font-size:8px;letter-spacing:.14em;',
    '  color:rgba(255,255,255,0.4);text-transform:uppercase;',
    '  margin-bottom:6px;line-height:1.5;}',
    '#gp-current-bar{width:100%;height:22px;border:1px solid rgba(255,255,255,0.1);',
    '  border-radius:3px;cursor:pointer;display:block;}',
    /* Type row */
    '#gp-type-row{display:flex;gap:3px;padding:8px 14px;flex-shrink:0;',
    '  border-bottom:1px solid rgba(255,255,255,0.06);}',
    '.gp-type-btn{flex:1;padding:5px 2px;background:none;',
    '  border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.35);',
    '  font-size:9px;cursor:pointer;font-family:inherit;',
    '  border-radius:3px;transition:all .15s;line-height:1.4;text-align:center;}',
    '.gp-type-btn:hover{color:#fff;border-color:rgba(255,255,255,0.3);}',
    '.gp-type-btn.active{background:rgba(232,245,10,.1);',
    '  border-color:rgba(232,245,10,0.5);color:#E8F50A;}',
    /* Showcase grid */
    '#gp-showcase-wrap{flex:1;overflow-y:auto;padding:10px 14px 14px;',
    '  scrollbar-width:thin;scrollbar-color:rgba(232,245,10,0.2) transparent;}',
    '#gp-showcase-label{font-size:8px;letter-spacing:.14em;',
    '  color:rgba(255,255,255,0.4);text-transform:uppercase;',
    '  margin-bottom:8px;line-height:1.5;}',
    '#gp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}',
    '.gp-card{cursor:pointer;border:1px solid rgba(255,255,255,0.06);',
    '  border-radius:4px;overflow:hidden;transition:border-color .15s,transform .1s;',
    '  background:rgba(255,255,255,0.02);}',
    '.gp-card:hover{border-color:rgba(232,245,10,0.4);transform:scale(1.03);}',
    '.gp-card.sel{border-color:#E8F50A;box-shadow:0 0 8px rgba(232,245,10,0.2);}',
    '.gp-card canvas{display:block;width:100%;height:28px;}',
    '.gp-card-name{font-size:7px;color:rgba(255,255,255,0.45);',
    '  padding:3px 4px;line-height:1.4;letter-spacing:.04em;',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;}',
    /* Controls footer */
    '#gp-controls{padding:8px 14px 10px;flex-shrink:0;',
    '  border-top:1px solid rgba(255,255,255,0.06);',
    '  display:flex;gap:10px;align-items:center;flex-wrap:wrap;}',
    '.gp-ctrl-label{font-size:8px;color:rgba(255,255,255,0.4);',
    '  letter-spacing:.06em;line-height:1.5;}',
    '.gp-ctrl-val{font-size:8px;color:#97c3b0;min-width:30px;line-height:1.5;}',
    '#gp-op-slider{width:70px;height:2px;-webkit-appearance:none;appearance:none;',
    '  background:rgba(255,255,255,0.1);outline:none;cursor:pointer;border-radius:1px;}',
    '#gp-op-slider::-webkit-slider-thumb{-webkit-appearance:none;',
    '  width:10px;height:10px;border-radius:50%;background:#E8F50A;cursor:pointer;}',
  ].join('\n');
  document.head.appendChild(sty);

  /* ── Panel DOM ── */
  gPickerEl=document.createElement('div');
  gPickerEl.id='grad-picker-panel';
  gPickerEl.innerHTML=[
    /* Header */
    '<div id="gp-head">',
    '  <div>',
    '    <div id="gp-head-title">&#9638; Gradient Picker</div>',
    '    <div id="gp-head-sub">Click any swatch to apply</div>',
    '  </div>',
    '  <button id="gp-close">Close</button>',
    '</div>',

    /* Current gradient preview */
    '<div id="gp-current-wrap">',
    '  <div id="gp-current-label">Current Gradient</div>',
    '  <canvas id="gp-current-bar" width="280" height="22"></canvas>',
    '</div>',

    /* Type selector */
    '<div id="gp-type-row">',
    '  <button class="gp-type-btn active" data-gt="linear">&#10230; Linear</button>',
    '  <button class="gp-type-btn" data-gt="radial">&#9711; Radial</button>',
    '  <button class="gp-type-btn" data-gt="angle">&#8635; Angle</button>',
    '  <button class="gp-type-btn" data-gt="reflected">&#8596; Reflect</button>',
    '  <button class="gp-type-btn" data-gt="diamond">&#9671; Diamond</button>',
    '</div>',

    /* Showcase grid */
    '<div id="gp-showcase-wrap">',
    '  <div id="gp-showcase-label">Presets (' + NAMED_PRESETS.length + ')</div>',
    '  <div id="gp-grid"></div>',
    '</div>',

    /* Controls footer */
    '<div id="gp-controls">',
    '  <span class="gp-ctrl-label">Opacity</span>',
    '  <input type="range" id="gp-op-slider" min="1" max="100" value="100">',
    '  <span class="gp-ctrl-val" id="gp-op-val">100%</span>',
    '  <label style="font-size:8px;color:rgba(255,255,255,0.4);',
    '    display:flex;align-items:center;gap:4px;cursor:pointer;margin-left:auto;line-height:1.5;">',
    '    <input type="checkbox" id="gp-reverse"> Reverse</label>',
    '</div>',
    '<div id="gp-saverestore" style="padding:6px 12px 10px;">',
    '  <div style="display:flex;gap:6px;">',
    '    <button id="gp-save-btn" style="flex:1;padding:6px;background:rgba(64,200,160,0.12);border:1px solid rgba(64,200,160,0.4);color:#40c8a0;font-family:inherit;font-size:8px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-radius:3px;">&#9632; Save Settings</button>',
    '    <button id="gp-reset-btn" style="flex:1;padding:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);font-family:inherit;font-size:8px;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;font-weight:600;border-radius:3px;">↺ Reset</button>',
    '  </div>',
    '  <div id="gp-settings-status" style="font-size:7px;color:rgba(255,255,255,0.3);text-align:center;min-height:10px;line-height:1.5;margin-top:2px;"></div>',
    '</div>',
  ].join('\n');
  document.body.appendChild(gPickerEl);

  /* ── Build preset grid ── */
  var grid=document.getElementById('gp-grid');
  var selCard=null;
  NAMED_PRESETS.forEach(function(preset,idx){
    var card=document.createElement('div');
    card.className='gp-card';
    card.title=preset.name;

    /* Thumbnail canvas */
    var cv2=document.createElement('canvas');
    cv2.width=90;cv2.height=28;
    var pc=cv2.getContext('2d');
    /* Checkerboard for transparency */
    for(var cy2=0;cy2<28;cy2+=4)for(var cx2=0;cx2<90;cx2+=4){
      pc.fillStyle=((Math.floor(cx2/4)+Math.floor(cy2/4))%2)?'#444':'#333';
      pc.fillRect(cx2,cy2,4,4);
    }
    var pg=pc.createLinearGradient(0,0,90,0);
    preset.stops.forEach(function(st){
      var r=parseInt(st.color.slice(1,3),16);
      var g2=parseInt(st.color.slice(3,5),16);
      var b=parseInt(st.color.slice(5,7),16);
      pg.addColorStop(Math.max(0,Math.min(1,st.pos)),
        'rgba('+r+','+g2+','+b+','+st.opacity+')');
    });
    pc.fillStyle=pg;pc.fillRect(0,0,90,28);
    card.appendChild(cv2);

    /* Name label */
    var nameDiv=document.createElement('div');
    nameDiv.className='gp-card-name';
    nameDiv.textContent=preset.name;
    card.appendChild(nameDiv);

    /* ── Make card draggable ── */
    card.draggable=true;
    card.dataset.presetIdx=idx;
    card.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain','gp:'+idx);
      e.dataTransfer.effectAllowed='copy';
      card.style.opacity='0.5';
    });
    card.addEventListener('dragend',function(){card.style.opacity='1';});

    /* Click also applies directly */
    card.addEventListener('click',function(){
      _applyPresetGradient(preset,card);
    });

    grid.appendChild(card);
  });

  /* ── Shared: apply a preset gradient fresh (clear + draw) ── */
  function _applyPresetGradient(preset,cardEl){
    gStops=preset.stops.map(function(s){
      return{pos:s.pos,color:s.color,opacity:s.opacity};
    });
    gSelStop=0;
    if(typeof syncInlineStopControls==='function')syncInlineStopControls();
    if(typeof renderPanelPreview==='function')renderPanelPreview();
    if(typeof updatePickerPreview==='function')updatePickerPreview();

    /* Get drawing context */
    var _dvEl=document.getElementById('dv');
    var _dvCtx=_dvEl?_dvEl.getContext('2d'):null;
    var _lc=window._getActiveLayerCtx?window._getActiveLayerCtx():_dvCtx;
    if(!_lc&&_dvEl)_lc=_dvEl.getContext('2d');
    if(!_lc)return;

    var _W=_lc.canvas.width||750, _H=_lc.canvas.height||750;
    if(gX0===null||gX0===undefined){gX0=_W*0.15;gY0=_H*0.15;gX1=_W*0.85;gY1=_H*0.85;}

    /* Clear the layer canvas completely before drawing new gradient */
    _lc.clearRect(0,0,_lc.canvas.width,_lc.canvas.height);

    /* Draw fresh gradient */
    applyGradientToCtx(_lc,gX0,gY0,gX1,gY1);

    /* Composite layers to display canvas */
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();

    gActive=true;
    if(!document.getElementById('grad-overlay'))showGradientOverlay();

    if(gEdEl&&typeof refreshEditor==='function')refreshEditor();
    if(selCard)selCard.classList.remove('sel');
    if(cardEl){cardEl.classList.add('sel');selCard=cardEl;}
  }

  /* ── Drop target: canvas area ── */
  var cvWrap=document.getElementById('cvwrap')||document.getElementById('stage');
  if(cvWrap){
    cvWrap.addEventListener('dragover',function(e){
      if(e.dataTransfer.types.indexOf('text/plain')>=0){
        e.preventDefault();e.dataTransfer.dropEffect='copy';
        cvWrap.style.outline='2px dashed #40c8a0';cvWrap.style.outlineOffset='4px';
      }
    });
    cvWrap.addEventListener('dragleave',function(){
      cvWrap.style.outline='';cvWrap.style.outlineOffset='';
    });
    cvWrap.addEventListener('drop',function(e){
      e.preventDefault();
      cvWrap.style.outline='';cvWrap.style.outlineOffset='';
      var data=e.dataTransfer.getData('text/plain');
      if(data&&data.indexOf('gp:')===0){
        var pidx=parseInt(data.slice(3));
        if(!isNaN(pidx)&&NAMED_PRESETS[pidx]){
          var matchCard=grid.querySelectorAll('.gp-card')[pidx]||null;
          _applyPresetGradient(NAMED_PRESETS[pidx],matchCard);
        }
      }
    });
  }

  /* Expose for reset button */
  window._applyPresetGradient=_applyPresetGradient;

  /* ── Wire controls ── */
  document.getElementById('gp-close').addEventListener('click',function(e){
    e.stopPropagation();
    gUserClosed=true;
    closeGradientPicker();
  });

  /* Type buttons */
  gPickerEl.querySelectorAll('.gp-type-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      gType=btn.dataset.gt;
      gPickerEl.querySelectorAll('.gp-type-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      /* Sync sidebar type buttons too */
      document.querySelectorAll('.grad-type-btn').forEach(function(b){
        b.classList.toggle('active',b.dataset.gt===gType);
      });
      renderPanelPreview();
      if(gActive)reapplyGradient();
    });
  });

  /* Opacity slider */
  var opSl=document.getElementById('gp-op-slider');
  var opVal=document.getElementById('gp-op-val');
  opSl.addEventListener('input',function(){
    gOpacity=parseInt(opSl.value)/100;
    opVal.textContent=opSl.value+'%';
    /* Sync sidebar opacity */
    var sideOp=document.getElementById('grad-op');
    var sideOpV=document.getElementById('grad-op-v');
    if(sideOp)sideOp.value=opSl.value;
    if(sideOpV)sideOpV.textContent=opSl.value+'%';
    if(gActive)reapplyGradient();
  });

  /* Reverse checkbox */
  var revCb=document.getElementById('gp-reverse');
  revCb.addEventListener('change',function(){
    gReverse=revCb.checked;
    var sideRev=document.getElementById('grad-reverse');
    if(sideRev)sideRev.checked=gReverse;
    renderPanelPreview();updatePickerPreview();
    if(gActive)reapplyGradient();
  });

  /* Current bar click → open full editor */
  document.getElementById('gp-current-bar').addEventListener('click',function(){
    var prev=document.getElementById('grad-preview');
    if(prev)openGradientEditor(prev);
  });

  /* ── Save / Reset gradient settings ── */
  var _gpSaved=null;
  document.getElementById('gp-save-btn').addEventListener('click',function(){
    _gpSaved={
      stops:gStops.map(function(s){return{pos:s.pos,color:s.color,opacity:s.opacity};}),
      type:gType, opacity:gOpacity, reverse:gReverse
    };
    var st=document.getElementById('gp-settings-status');
    if(st){st.textContent='Settings saved';setTimeout(function(){st.textContent='';},2000);}
  });
  document.getElementById('gp-reset-btn').addEventListener('click',function(){
    /* Reset to Spectrum — use the clean apply function */
    gType='linear';gOpacity=1.0;gReverse=false;
    /* Update UI controls */
    var opSl3=document.getElementById('gp-op-slider');
    var opV3=document.getElementById('gp-op-val');
    if(opSl3){opSl3.value=100;}if(opV3){opV3.textContent='100%';}
    var rev3=document.getElementById('gp-reverse');
    if(rev3)rev3.checked=false;
    /* Sync sidebar */
    var sideOp2=document.getElementById('grad-op');
    var sideOpV2=document.getElementById('grad-op-v');
    if(sideOp2)sideOp2.value=100;if(sideOpV2)sideOpV2.textContent='100%';
    var sideRev2=document.getElementById('grad-reverse');
    if(sideRev2)sideRev2.checked=false;
    /* Update type buttons */
    gPickerEl.querySelectorAll('.gp-type-btn').forEach(function(b){b.classList.toggle('active',b.dataset.gt==='linear');});
    document.querySelectorAll('.grad-type-btn').forEach(function(b){b.classList.toggle('active',b.dataset.gt==='linear');});
    /* Find Spectrum preset and apply */
    var spectrumPreset=null;
    for(var pi=0;pi<NAMED_PRESETS.length;pi++){if(NAMED_PRESETS[pi].name==='Spectrum'){spectrumPreset=NAMED_PRESETS[pi];break;}}
    if(!spectrumPreset)spectrumPreset={name:'Spectrum',stops:[{pos:0,color:'#ff0000',opacity:1},{pos:.17,color:'#ff8800',opacity:1},{pos:.33,color:'#ffff00',opacity:1},{pos:.5,color:'#00cc00',opacity:1},{pos:.67,color:'#0000ff',opacity:1},{pos:.83,color:'#8800cc',opacity:1},{pos:1,color:'#ff0000',opacity:1}]};
    if(window._applyPresetGradient)window._applyPresetGradient(spectrumPreset,null);
    var st2=document.getElementById('gp-settings-status');
    if(st2){st2.textContent='Reset to Spectrum';setTimeout(function(){st2.textContent='';},2000);}
  });
  /* Expose restore for external use */
  window._gpRestoreSaved=function(){
    if(!_gpSaved)return;
    gStops=_gpSaved.stops.map(function(s){return{pos:s.pos,color:s.color,opacity:s.opacity};});
    gType=_gpSaved.type;gOpacity=_gpSaved.opacity;gReverse=_gpSaved.reverse;
    gSelStop=0;
    var opSl4=document.getElementById('gp-op-slider');
    var opV4=document.getElementById('gp-op-val');
    if(opSl4)opSl4.value=Math.round(gOpacity*100);if(opV4)opV4.textContent=Math.round(gOpacity*100)+'%';
    var rev4=document.getElementById('gp-reverse');if(rev4)rev4.checked=gReverse;
    gPickerEl.querySelectorAll('.gp-type-btn').forEach(function(b){b.classList.toggle('active',b.dataset.gt===gType);});
    if(typeof renderPanelPreview==='function')renderPanelPreview();
    if(typeof updatePickerPreview==='function')updatePickerPreview();
    if(typeof refreshEditor==='function')refreshEditor();
    if(typeof syncInlineStopControls==='function')syncInlineStopControls();
    if(gActive&&typeof reapplyGradient==='function')reapplyGradient();
  };
}

function updatePickerPreview(){
  var c=document.getElementById('gp-current-bar');
  if(!c)return;
  var ctx2=c.getContext('2d');
  var W=c.width,H=c.height;
  ctx2.clearRect(0,0,W,H);
  for(var cy2=0;cy2<H;cy2+=4)for(var cx2=0;cx2<W;cx2+=4){
    ctx2.fillStyle=((Math.floor(cx2/4)+Math.floor(cy2/4))%2)?'#555':'#3a3a3a';
    ctx2.fillRect(cx2,cy2,4,4);
  }
  var s=sortedStops();
  var grd=ctx2.createLinearGradient(0,0,W,0);
  s.forEach(function(st){
    grd.addColorStop(Math.max(0,Math.min(1,st.pos)),
      'rgba('+_cr(st)+','+_cg(st)+','+_cb(st)+','+st.opacity+')');
  });
  ctx2.fillStyle=grd;ctx2.fillRect(0,0,W,H);
}

/* ── Dragging state ── */
var gDragState=null, gUserPos=null, gUserClosed=false;

function initPickerDrag(){
  var head=document.getElementById('gp-head');
  if(!head||head._dragWired)return;
  head._dragWired=true;
  head.style.cursor='grab';
  head.style.userSelect='none';

  head.addEventListener('mousedown',function(e){
    /* Don't drag if clicking close button */
    if(e.target.id==='gp-close'||e.target.closest('#gp-close'))return;
    e.preventDefault();
    head.style.cursor='grabbing';
    var rect=gPickerEl.getBoundingClientRect();
    gDragState={
      startX:e.clientX, startY:e.clientY,
      origLeft:rect.left, origTop:rect.top
    };

    function onMove(ev){
      if(!gDragState)return;
      var dx=ev.clientX-gDragState.startX;
      var dy=ev.clientY-gDragState.startY;
      var newL=Math.max(0,Math.min(window.innerWidth-60, gDragState.origLeft+dx));
      var newT=Math.max(0,Math.min(window.innerHeight-40, gDragState.origTop+dy));
      gPickerEl.style.left=newL+'px';
      gPickerEl.style.top=newT+'px';
      gUserPos={left:newL,top:newT};
    }
    function onUp(){
      gDragState=null;
      head.style.cursor='grab';
      document.removeEventListener('mousemove',onMove);
      document.removeEventListener('mouseup',onUp);
    }
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
  });
}

function openGradientPicker(){
  buildGradientPicker();
  initPickerDrag();
  if(gPickerOpen)return;
  gPickerOpen=true;

  /* Position: use user's last drag position, otherwise default right of toolbar */
  if(gUserPos){
    gPickerEl.style.left=gUserPos.left+'px';
    gPickerEl.style.top=gUserPos.top+'px';
  } else {
    var tb=document.getElementById('tb');
    if(tb){
      var r=tb.getBoundingClientRect();
      gPickerEl.style.left=Math.max(4,r.left-318)+'px';
      gPickerEl.style.top='10px';
    } else {
      gPickerEl.style.left='50px';
      gPickerEl.style.top='40px';
    }
  }

  gPickerEl.classList.add('open');

  /* Sync type buttons state */
  gPickerEl.querySelectorAll('.gp-type-btn').forEach(function(b){
    b.classList.toggle('active',b.dataset.gt===gType);
  });
  /* Sync opacity */
  var opSl2=document.getElementById('gp-op-slider');
  var opVal2=document.getElementById('gp-op-val');
  if(opSl2)opSl2.value=Math.round(gOpacity*100);
  if(opVal2)opVal2.textContent=Math.round(gOpacity*100)+'%';
  /* Sync reverse */
  var revCb2=document.getElementById('gp-reverse');
  if(revCb2)revCb2.checked=gReverse;

  updatePickerPreview();
}

function closeGradientPicker(){
  gPickerOpen=false;
  if(gPickerEl)gPickerEl.classList.remove('open');
}

/* ── Hook into tool selection to auto-show/hide picker ── */
var _origSetToolPS=window.setTool_ps;
window.setTool_ps=function(t){
  if(_origSetToolPS)_origSetToolPS(t);
  if(t==='gradient'){
    /* Reset the user-closed flag when re-entering gradient tool */
    gUserClosed=false;
    openGradientPicker();
  } else {
    /* Switching away from gradient always closes + resets flag */
    gUserClosed=false;
    closeGradientPicker();
  }
};

/* Patch openGradientPicker to respect user-closed flag */
var _origOpenGP=openGradientPicker;
openGradientPicker=function(){
  if(gUserClosed)return;
  _origOpenGP();
};

/* Also update picker preview when panel preview updates */
var _origRenderPanelPreview=renderPanelPreview;
renderPanelPreview=function(){
  _origRenderPanelPreview();
  updatePickerPreview();
};

setTimeout(wirePanelControls,250);

})();
