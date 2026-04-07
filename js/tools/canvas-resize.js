/* ══════════════════════════════════════════════════════════════════
   CANVAS RESIZE HANDLES — 8 directional + Shift = proportional
   IMPORTANT: getRatioDims() treats _customW/_customH as a ratio and
   scales to fit the stage. So we NEVER pass commitW/commitH directly
   as pixel targets — we let sz() compute the real pixel size, then
   repaint at dv.width×dv.height (the actual result).
   ══════════════════════════════════════════════════════════════════ */
(function(){

/* ── CSS for 8 handles ── */
(function(){
  var s=document.createElement('style');
  s.textContent=
    '.cv-rh{position:absolute;width:12px;height:12px;background:#97c3b0;border:1px solid #b8d9cf;z-index:100;pointer-events:all;border-radius:2px;transition:background .12s;}position:absolute;width:12px;height:12px;background:#97c3b0;border:1px solid #b8d9cf;'+
    'z-index:100;pointer-events:all;border-radius:2px;transition:background .12s,box-shadow .12s;}'+
    '.cv-rh:hover{background:#E8F50A !important;box-shadow:0 0 0 4px rgba(232,245,10,0.4);}'+
    '#cv-drag-hint{position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);font-size:9px;'+
    'font-family:monospace;color:#97c3b0;letter-spacing:.08em;pointer-events:none;white-space:nowrap;display:none;z-index:10;}';
  document.head.appendChild(s);
})();

/* ── Inject 8 handles + hint into cvwrap ── */
setTimeout(function(){
  var wrap=document.getElementById('cvwrap');
  if(!wrap)return;

  var dirs=[
    {id:'nw',style:'top:-6px;left:-6px;cursor:nw-resize;'},
    {id:'n', style:'top:-6px;left:50%;transform:translateX(-50%);cursor:n-resize;'},
    {id:'ne',style:'top:-6px;right:-6px;cursor:ne-resize;'},
    {id:'e', style:'top:50%;right:-6px;transform:translateY(-50%);cursor:e-resize;'},
    {id:'se',style:'bottom:-6px;right:-6px;cursor:se-resize;'},
    {id:'s', style:'bottom:-6px;left:50%;transform:translateX(-50%);cursor:s-resize;'},
    {id:'sw',style:'bottom:-6px;left:-6px;cursor:sw-resize;'},
    {id:'w', style:'top:50%;left:-6px;transform:translateY(-50%);cursor:w-resize;'},
  ];

  dirs.forEach(function(d){
    var el=document.createElement('div');
    el.className='cv-rh';
    el.dataset.dir=d.id;
    el.style.cssText=d.style;
    wrap.appendChild(el);
  });

  var hint=document.createElement('div');
  hint.id='cv-drag-hint';
  wrap.appendChild(hint);

  wireHandles();
},400);

/* ── Snapshot store ── */
var _snaps={};
function saveSnaps(){
  ['uv','cv','lv','dv','av'].forEach(function(id){
    var c=document.getElementById(id);if(!c)return;
    var s=document.createElement('canvas');
    s.width=c.width;s.height=c.height;
    try{s.getContext('2d').drawImage(c,0,0);}catch(e){}
    _snaps[id]=s;
  });
}

/* ── Resize canvas pixel buffers + CSS display size (NO sz() call) ── */
function resizeDrag(newW,newH){
  /* Compute display size fitting into stage */
  var stage=document.getElementById('stage');
  var avW=(stage?stage.offsetWidth:window.innerWidth)-28;
  var avH=(stage?stage.offsetHeight:window.innerHeight)-28;
  var scl=Math.min(1,avW/newW,avH/newH);
  var dW=Math.round(newW*scl), dH=Math.round(newH*scl);

  ['uv','cv','lv','dv','av'].forEach(function(id){
    var c=document.getElementById(id);if(!c)return;
    var sn=_snaps[id];
    c.width=newW;c.height=newH;
    c.style.width=dW+'px';c.style.height=dH+'px';
    if(sn&&sn.width>0)c.getContext('2d').drawImage(sn,0,0,newW,newH);
  });

  var wrap=document.getElementById('cvwrap');
  if(wrap){wrap.style.width=dW+'px';wrap.style.height=dH+'px';}

  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._repositionBar)window._repositionBar();
}

/* ── Commit: call _setCanvasSize (sets ratio + runs sz()), repaint at ACTUAL result ── */
function commitResize(commitW,commitH){
  if(typeof window._setCanvasSize==='function'){
    window._setCanvasSize(commitW,commitH);
  }
  /* sz() has now set canvas pixel buffers to its stage-fit version.
     Read the ACTUAL resulting size from dv, repaint at that size. */
  var dv=document.getElementById('dv');
  var aW=dv?dv.width:commitW;
  var aH=dv?dv.height:commitH;

  ['uv','cv','lv','dv','av'].forEach(function(id){
    var c=document.getElementById(id);if(!c)return;
    var sn=_snaps[id];
    if(sn&&sn.width>0){
      var ctx2=c.getContext('2d');
      ctx2.clearRect(0,0,aW,aH);
      ctx2.drawImage(sn,0,0,aW,aH);
    }
  });

  /* Update panel inputs */
  var cw2=document.getElementById('res-cw'),ch2=document.getElementById('res-ch');
  if(cw2)cw2.value=aW;if(ch2)ch2.value=aH;
  var px=document.getElementById('res-px-label');if(px)px.textContent=aW+' × '+aH;
  var sel=document.getElementById('res-sel');if(sel)sel.value='custom';

  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
  if(window._repositionBar)window._repositionBar();

  var si2=document.getElementById('si');
  if(si2)si2.textContent='Canvas '+aW+'×'+aH+'px';
  return{w:aW,h:aH};
}

/* ── Wire all 8 handles ── */
function wireHandles(){
  document.querySelectorAll('.cv-rh').forEach(function(grip){
    grip.addEventListener('mousedown',function(e){
      e.preventDefault();e.stopPropagation();

      var dv=document.getElementById('dv');if(!dv)return;
      var dir=grip.dataset.dir;
      var startW=dv.width, startH=dv.height;
      var aspect=startW/startH;
      var startX=e.clientX, startY=e.clientY;

      /* Fixed pixel-per-display-pixel ratio captured at mousedown */
      var wrap=document.getElementById('cvwrap');
      var wR=wrap?wrap.getBoundingClientRect():{width:startW,height:startH};
      var ppX=startW/(wR.width||startW);
      var ppY=startH/(wR.height||startH);

      saveSnaps();
      grip.style.background='#E8F50A';
      var hint=document.getElementById('cv-drag-hint');
      if(hint)hint.style.display='block';

      /* finalW/H = last unconstrained; shiftW/H = last proportional */
      var finalW=startW,finalH=startH,shiftW=startW,shiftH=startH,shiftUsed=false;

      function mv(ev){
        var dx=ev.clientX-startX, dy=ev.clientY-startY;
        var nW=startW, nH=startH;

        if(dir==='e'||dir==='ne'||dir==='se') nW=Math.max(100,Math.min(4096,Math.round(startW+dx*ppX)));
        if(dir==='w'||dir==='nw'||dir==='sw') nW=Math.max(100,Math.min(4096,Math.round(startW-dx*ppX)));
        if(dir==='s'||dir==='sw'||dir==='se') nH=Math.max(100,Math.min(4096,Math.round(startH+dy*ppY)));
        if(dir==='n'||dir==='nw'||dir==='ne') nH=Math.max(100,Math.min(4096,Math.round(startH-dy*ppY)));

        if(ev.shiftKey){
          if(dir==='e'||dir==='w'){
            nH=Math.max(100,Math.min(4096,Math.round(nW/aspect)));
          } else if(dir==='n'||dir==='s'){
            nW=Math.max(100,Math.min(4096,Math.round(nH*aspect)));
          } else {
            if((nW/startW)>=(nH/startH)) nH=Math.max(100,Math.min(4096,Math.round(nW/aspect)));
            else                          nW=Math.max(100,Math.min(4096,Math.round(nH*aspect)));
          }
          shiftW=nW;shiftH=nH;shiftUsed=true;
          if(hint)hint.textContent=nW+'×'+nH+' ⇧';
        } else {
          if(hint)hint.textContent=nW+'×'+nH;
        }
        finalW=nW;finalH=nH;
        resizeDrag(nW,nH);
      }

      function up(){
        document.removeEventListener('mousemove',mv);
        document.removeEventListener('mouseup',up);
        grip.style.background='#97c3b0';
        if(hint)hint.style.display='none';
        /* Always commit the proportional size if shift was used,
           regardless of whether shift was still held at mouseup */
        var cW=shiftUsed?shiftW:finalW;
        var cH=shiftUsed?shiftH:finalH;
        commitResize(cW,cH);
      }

      document.addEventListener('mousemove',mv);
      document.addEventListener('mouseup',up);
    });
  });
}

window.addEventListener('resize',function(){
  setTimeout(function(){
    if(window._repositionBar)window._repositionBar();
  },80);
});

})();
