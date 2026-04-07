/* ══════════════════════════════════════════════════════════
   TEMPORAL CANVASES — Time-First Composition
   Space is secondary to time. The canvas is a duration.
   Artworks defined by their becoming.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── State ── */
var tc = {
  playing: false,
  t: 0,           /* 0..1000 internal time */
  speed: 2,
  memory: 0.6,
  chaos: 0.5,
  mode: 'emergence',
  color: '#28E0D1',
  rafId: null,
  particles: [],
  fields: [],
  history: [],     /* ImageData snapshots for memory trails */
  seed: 42,
  initialized: false,
  looping: false,
};
window._tc = tc; /* expose for access from outer IIFE */

/* ── Helpers ── */
function si(m){var e=document.getElementById('si');if(e)e.textContent=m;}
function actx(){return window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);}
function hexRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}

/* ── Seeded RNG ── */
var _ts=1;
function tseed(v){_ts=(v^0x1337c0de)>>>0;}
function trng(){_ts=Math.imul(_ts^(_ts>>>16),0x45d9f3b);_ts^=(_ts>>>16);return(_ts>>>0)/0xffffffff;}

/* ── Wire controls ── */
/* ── Full regeneration: clear + accumulate to current t ── */
function regenFull(){
  var ax=actx();if(!ax||!tc.initialized)return;
  /* Clear */
  ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);
  if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
  if(typeof layers!=='undefined'&&layers&&layers.length)
    layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
  /* Reset history so no memory bleed from old image */
  tc.history=[];
  /* Re-init particles/fields with same seed so composition is preserved */
  var prevSeed=tc.seed;tseed(prevSeed);initTemporal();
  /* Accumulate frames from 0 to tc.t */
  var steps=Math.max(20,Math.round(tc.t/1000*40));
  for(var f=0;f<steps;f++) renderFrame(f/steps);
  renderFrame(tc.t/1000);
  if(window._layersCompositeFn)window._layersCompositeFn();
}

/* Palette-only regen — keeps particles, just repaints with new colours */
function regenPalette(){
  if(window.genUndoPush)window.genUndoPush();
  var ax=actx();if(!ax||!tc.initialized)return;
  ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);
  if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
  if(typeof layers!=='undefined'&&layers&&layers.length)
    layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
  tc.history=[];
  /* Re-seed to same position so same particles are used */
  tseed(tc.seed);
  /* Re-init keeps same seed → same positions */
  initTemporal();
  var steps=Math.max(20,Math.round(tc.t/1000*40));
  for(var f=0;f<steps;f++) renderFrame(f/steps);
  renderFrame(tc.t/1000);
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
}

/* Debounced version for slider input */
var _tcRegenTimer=null;
function debouncedRegen(){
  clearTimeout(_tcRegenTimer);
  _tcRegenTimer=setTimeout(regenFull,80);
}

function wireControls(){
  var timeSlider=document.getElementById('tc-time');
  var timeV=document.getElementById('tc-time-v');
  var playBtn=document.getElementById('tc-play-btn');
  var resetBtn=document.getElementById('tc-reset-btn');
  var speedSlider=document.getElementById('tc-speed');
  var speedV=document.getElementById('tc-speed-v');
  var memSlider=document.getElementById('tc-mem');
  var memV=document.getElementById('tc-mem-v');
  var chaosSlider=document.getElementById('tc-chaos');
  var chaosV=document.getElementById('tc-chaos-v');
  var modeSelect=document.getElementById('tc-mode');
  var colorPick=document.getElementById('tc-color');
  var captureBtn=document.getElementById('tc-capture-btn');
  var randBtn=document.getElementById('tc-rand-btn');

  if(!timeSlider)return;

  /* Time scrubber — primary navigation */
  timeSlider.addEventListener('input',function(){
    tc.t=parseInt(timeSlider.value);
    if(timeV)timeV.textContent=Math.round(tc.t/10)+'%';
    debouncedRegen();
  });

  /* Play — replays from t=0 for configured number of frames, no loop */
  if(playBtn)playBtn.addEventListener('click',function(){
    stopPlayback();
    tc.looping=false;
    _startSequence(false);
  });

  /* Loop — replays from t=0 continuously until Stop is clicked */
  var loopBtn=document.getElementById('tc-loop-btn');
  if(loopBtn)loopBtn.addEventListener('click',function(){
    if(tc.looping){
      /* If already looping, stop */
      stopPlayback();
    } else {
      stopPlayback();
      tc.looping=true;
      _startSequence(true);
    }
  });

  function _setPlayState(playing,looping){
    if(playBtn){
      playBtn.textContent=playing&&!looping?'⏸ Pause':'▶ Play';
      playBtn.style.color=playing&&!looping?'#E8F50A':'#28E0D1';
      playBtn.style.borderColor=playing&&!looping?'#E8F50A':'#28E0D1';
    }
    if(loopBtn){
      loopBtn.textContent=looping?'⏸ Loop':'↺ Loop';
      loopBtn.style.color=looping?'#E8F50A':'#20b090';
      loopBtn.style.borderColor=looping?'#E8F50A':'#0a3a2a';
    }
  }

  function _clearCanvas(){
    var ax=actx();
    if(ax)ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);
    if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
    if(typeof layers!=='undefined'&&layers&&layers.length)
      layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
    tc.history=[];
  }

  function _startSequence(loop){
    /* Read user-configured frame count */
    var framesEl=document.getElementById('tc-frames');
    var maxFrames=framesEl?Math.max(10,Math.min(9999,parseInt(framesEl.value)||1000)):1000;
    tc.t=0;
    var sl=document.getElementById('tc-time');
    var tv=document.getElementById('tc-time-v');
    if(sl)sl.value=0;if(tv)tv.textContent='0%';
    _clearCanvas();
    /* Re-init with same seed for consistent composition */
    tseed(tc.seed);initTemporal();
    tc.playing=true;tc.looping=loop;
    _setPlayState(true,loop);
    startPlayback(maxFrames,loop);
  }

  /* Stop / Reset */
  if(resetBtn)resetBtn.addEventListener('click',function(){
    stopPlayback();
    tc.looping=false;
    _setPlayState(false,false);
    si('Stopped');
  });

  /* Speed */
  if(speedSlider)speedSlider.addEventListener('input',function(){
    tc.speed=parseInt(speedSlider.value);
    if(speedV)speedV.textContent=tc.speed+'×';
    /* speed affects accumulation density — regen */
    debouncedRegen();
  });

  /* Memory */
  if(memSlider)memSlider.addEventListener('input',function(){
    tc.memory=parseInt(memSlider.value)/100;
    if(memV)memV.textContent=memSlider.value+'%';
    debouncedRegen();
  });

  /* Chaos */
  if(chaosSlider)chaosSlider.addEventListener('input',function(){
    tc.chaos=parseInt(chaosSlider.value)/100;
    if(chaosV)chaosV.textContent=chaosSlider.value+'%';
    debouncedRegen();
  });

  /* Mode */
  if(modeSelect)modeSelect.addEventListener('change',function(){
    tc.mode=modeSelect.value;
    tc.history=[];tc.t=0;
    if(timeSlider)timeSlider.value=0;
    if(timeV)timeV.textContent='0%';
    initTemporal();
    renderFrame(0);
  });

  /* Color */
  if(colorPick)colorPick.addEventListener('input',function(){
    tc.color=colorPick.value;
    debouncedRegen();
  });

  /* Capture frame */
  if(captureBtn)captureBtn.addEventListener('click',function(){
    var ax=actx();if(!ax)return;
    if(window._saveU)window._saveU();
    /* The current frame is already on actx — just composite */
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    si('Temporal frame captured at t='+Math.round(tc.t/10)+'%');
  });

  /* Undo — delegate to global undo */
  var undoBtn=document.getElementById('tc-undo-btn');
  if(undoBtn)undoBtn.addEventListener('click',function(){
    if(typeof globalUndo==='function')globalUndo();
    else if(typeof doUndo==='function')doUndo();
    si('Undo');
  });

  /* Redo — delegate to global redo */
  var redoBtn=document.getElementById('tc-redo-btn');
  if(redoBtn)redoBtn.addEventListener('click',function(){
    if(typeof globalRedo==='function')globalRedo();
    else if(typeof doRedo==='function')doRedo();
    si('Redo');
  });

  /* Clear — wipe drawing layer, reset temporal state */
  var clearBtn=document.getElementById('tc-clear-btn');
  if(clearBtn)clearBtn.addEventListener('click',function(){
    if(window._saveU)window._saveU();
    var ax=actx();
    if(ax)ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);
    var dc=window._dctx;
    if(dc&&window._dv)dc.clearRect(0,0,window._dv.width,window._dv.height);
    /* Also clear any layer canvases */
    if(typeof layers!=='undefined'&&layers&&layers.length){
      layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
    }
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    /* Reset temporal history so memory trails don't bleed from old content */
    tc.history=[];
    si('Temporal canvas cleared');
  });

  /* Randomize — all sliders to max, random mode, fills canvas immediately */
  if(randBtn)randBtn.addEventListener('click',function(){
    tc.seed=Date.now()&0xfffff;tseed(tc.seed);
    tc.history=[];

    /* Random mode */
    var modes=['emergence','dissolution','oscillation','remembrance','entropy'];
    tc.mode=modes[Math.floor(trng()*modes.length)];
    if(modeSelect)modeSelect.value=tc.mode;

    /* All sliders to MAX */
    tc.chaos=1.0;
    if(chaosSlider)chaosSlider.value=100;if(chaosV)chaosV.textContent='100%';
    tc.memory=1.0;
    if(memSlider)memSlider.value=100;if(memV)memV.textContent='100%';
    tc.speed=10;
    if(speedSlider)speedSlider.value=10;if(speedV)speedV.textContent='10×';

    /* Random vivid colour */
    var h=Math.round(trng()*360);
    function hsl2(hh,s,l){hh/=360;s/=100;l/=100;var a=s*Math.min(l,1-l);var f=function(n){var k=(n+hh/30*12)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1);};return'#'+[f(0),f(8),f(4)].map(function(v){return Math.round(v*255).toString(16).padStart(2,'0');}).join('');}
    tc.color=hsl2(h,80+trng()*20,50+trng()*20);
    if(colorPick)colorPick.value=tc.color;

    /* Set time to full */
    tc.t=1000;
    if(timeSlider)timeSlider.value=1000;if(timeV)timeV.textContent='100%';

    /* Save undo state, clear canvas, re-init, render at t=1 (full expression) */
    if(window._saveU)window._saveU();
    var ax=actx();
    if(ax){ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);}
    if(window._dctx&&window._dv){window._dctx.clearRect(0,0,window._dv.width,window._dv.height);}
    if(typeof layers!=='undefined'&&layers&&layers.length){
      layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
    }

    initTemporal();

    /* Render multiple accumulated frames for a rich full-canvas display */
    var steps=40;
    for(var f=0;f<steps;f++){
      renderFrame(f/steps);
    }
    renderFrame(1.0); /* final frame at full t */

    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    si('Temporal: '+tc.mode+' — all forces max · t=100%');
  });

  /* Header-level Rand button — always visible, same action */
  /* Cycle state for Temporal modes */
  var _tcModeIdx=-1;
  var TC_MODES=['emergence','dissolution','oscillation','remembrance','entropy'];
  var TC_COLORS=['#28E0D1','#ff4060','#c060ff','#40c0ff','#ffd040'];
  var TC_LABELS=['Emergence — calm → structure','Dissolution — order → chaos',
                 'Oscillation — wave memory','Remembrance — recalls itself','Entropy — all things forget'];

  function _tcCycleNext(){
    _tcModeIdx=(_tcModeIdx+1)%TC_MODES.length;
    var mode=TC_MODES[_tcModeIdx];
    var col=TC_COLORS[_tcModeIdx];

    /* Update mode select */
    var modeSelect=document.getElementById('tc-mode');
    if(modeSelect)modeSelect.value=mode;
    tc.mode=mode;

    /* All sliders to MAX */
    tc.chaos=1.0;tc.memory=1.0;tc.speed=10;
    var chaosSlider=document.getElementById('tc-chaos'),chaosV=document.getElementById('tc-chaos-v');
    var memSlider=document.getElementById('tc-mem'),memV=document.getElementById('tc-mem-v');
    var speedSlider=document.getElementById('tc-speed'),speedV=document.getElementById('tc-speed-v');
    if(chaosSlider)chaosSlider.value=100;if(chaosV)chaosV.textContent='100%';
    if(memSlider)memSlider.value=100;if(memV)memV.textContent='100%';
    if(speedSlider)speedSlider.value=10;if(speedV)speedV.textContent='10×';

    /* Set colour */
    tc.color=col;
    var colorPick=document.getElementById('tc-color');
    if(colorPick)colorPick.value=col;

    /* Set time to full */
    tc.t=1000;
    var timeSlider=document.getElementById('tc-time'),timeV2=document.getElementById('tc-time-v');
    if(timeSlider)timeSlider.value=1000;if(timeV2)timeV2.textContent='100%';

    /* Update cycle label */
    var cl=document.getElementById('tc-cycle-label'),cn=document.getElementById('tc-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(_tcModeIdx+1)+'/'+TC_MODES.length+') '+TC_LABELS[_tcModeIdx];

    /* Ensure temporal body is open */
    var tbody=document.getElementById('temporal-body');
    var ttog=document.getElementById('temporal-toggle');
    if(tbody&&tbody.style.display==='none'){
      tbody.style.display='block';
      if(ttog){ttog.style.background='rgba(40,224,209,0.08)';ttog.style.borderColor='#28E0D1';}
    }

    /* Clear, init, accumulate all frames, render */
    if(window._saveU)window._saveU();
    var ax=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
    if(ax){
      ax.clearRect(0,0,ax.canvas.width,ax.canvas.height);
      if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
      if(typeof layers!=='undefined'&&layers&&layers.length)
        layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
    }
    tc.history=[];
    tseed(tc.seed);initTemporal();
    var steps=40;
    for(var f=0;f<steps;f++) renderFrame(f/steps);
    renderFrame(1.0);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    var si2=document.getElementById('si');
    if(si2)si2.textContent='Temporal: '+mode+' ('+(_tcModeIdx+1)+'/'+TC_MODES.length+') — all max';
  }

  /* Wire both buttons to the cycler */
  var randHdrBtn=document.getElementById('tc-rand-hdr-btn');
  if(randHdrBtn)randHdrBtn.addEventListener('click',_tcCycleNext);
  if(randBtn)randBtn.addEventListener && (randBtn.onclick=_tcCycleNext);
}

/* ── Initialize temporal field for current mode ── */
function initTemporal(){
  tc.initialized=true;
  tseed(tc.seed);
  tc.particles=[];tc.fields=[];
  var ax=actx();if(!ax)return;
  var W=ax.canvas.width,H=ax.canvas.height;

  /* Spawn particles */
  var count={emergence:120,dissolution:200,oscillation:150,remembrance:100,entropy:180}[tc.mode]||150;
  for(var i=0;i<count;i++){
    tc.particles.push({
      x:trng()*W, y:trng()*H,
      vx:(trng()-0.5)*2, vy:(trng()-0.5)*2,
      life:trng(), phase:trng()*Math.PI*2,
      size:1+trng()*4,
      birth:trng(),   /* when in time this particle "emerges" */
      death:trng()*0.7+0.3, /* when it dissolves */
    });
  }

  /* Vector field for flow */
  var gw=12,gh=12;
  for(var gy=0;gy<gh;gy++)for(var gx=0;gx<gw;gx++){
    tc.fields.push({
      x:(gx/gw)*W+(W/gw)*0.5,
      y:(gy/gh)*H+(H/gh)*0.5,
      angle:trng()*Math.PI*2,
      freq:0.5+trng()*2,
      amp:trng(),
    });
  }
}

/* ── Core renderer — called on every time position change ── */
function renderFrame(t){
  /* t = 0..1 (normalized time) */
  var ax=actx();if(!ax||!tc.initialized)return;
  var W=ax.canvas.width,H=ax.canvas.height;
  var [R,G,B]=hexRgb(tc.color);
  /* Helper to get palette-cycled color for a given index */
  tc._colAt=function(i){
    if(!tc.palette||!tc.palette.length)return [R,G,B];
    var col=tc.palette[i%tc.palette.length];
    return hexRgb(col);
  };

  ax.save();

  /* ── Background: darkens/brightens with time ── */
  var bgAlpha=tc.mode==='dissolution'?0.05+t*0.15 : tc.mode==='emergence'?0.2-t*0.12 : 0.08;
  ax.fillStyle='rgba(3,3,6,'+bgAlpha+')';
  ax.fillRect(0,0,W,H);

  /* ── Memory trail: blend previous frame back in ── */
  if(tc.history.length>0&&tc.memory>0.01){
    var hi=tc.history[tc.history.length-1];
    try{ax.globalAlpha=tc.memory*0.4;ax.putImageData(hi,0,0);}catch(e){}
    ax.globalAlpha=1;
  }

  /* ── Mode-specific temporal logic ── */
  switch(tc.mode){
    case 'emergence':  renderEmergence(ax,t,W,H,R,G,B); break;
    case 'dissolution':renderDissolution(ax,t,W,H,R,G,B); break;
    case 'oscillation':renderOscillation(ax,t,W,H,R,G,B); break;
    case 'remembrance':renderRemembrance(ax,t,W,H,R,G,B); break;
    case 'entropy':    renderEntropy(ax,t,W,H,R,G,B); break;
  }

  ax.restore();

  /* Store frame in history for memory trails (limit to 3 frames) */
  try{
    var snap=ax.getImageData(0,0,W,H);
    tc.history.push(snap);
    if(tc.history.length>3)tc.history.shift();
  }catch(e){}

  /* Update display */
  if(window._layersCompositeFn)window._layersCompositeFn();
}

/* ── EMERGENCE: particles nucleate into structure as t grows ── */
function renderEmergence(ax,t,W,H,R,G,B){
  var chaosT=Math.max(0,(t-tc.chaos)/(1-tc.chaos+0.001));
  tc.particles.forEach(function(p){
    if(p.birth>t)return; /* not yet born */
    var age=(t-p.birth)/(1-p.birth+0.001);
    var order=1-chaosT;

    /* Calm: particle moves toward grid attractor */
    var gx=Math.round((p.x/W)*8)/8*W, gy=Math.round((p.y/H)*8)/8*H;
    p.x=p.x*(1-order*0.04)+gx*(order*0.04)+(trng()-0.5)*chaosT*8;
    p.y=p.y*(1-order*0.04)+gy*(order*0.04)+(trng()-0.5)*chaosT*8;

    var alpha=Math.min(1,age*3)*(1-chaosT*0.4);
    var sz=p.size*(0.5+order*1.5);
    var ec=tc._colAt?tc._colAt(tc.particles.indexOf(p)):([R,G,B]);
    ax.fillStyle='rgba('+ec[0]+','+ec[1]+','+ec[2]+','+alpha.toFixed(3)+')';
    ax.beginPath();ax.arc(p.x,p.y,sz,0,Math.PI*2);ax.fill();

    /* Structure lines appear in calm phase */
    if(order>0.3&&age>0.2){
      var nx=p.x+Math.cos(p.phase)*20*order, ny=p.y+Math.sin(p.phase)*20*order;
      ax.strokeStyle='rgba('+ec[0]+','+ec[1]+','+ec[2]+','+(alpha*order*0.3).toFixed(3)+')';
      ax.lineWidth=0.5;ax.beginPath();ax.moveTo(p.x,p.y);ax.lineTo(nx,ny);ax.stroke();
    }
  });
}

/* ── DISSOLUTION: ordered structure crumbles as t grows ── */
function renderDissolution(ax,t,W,H,R,G,B){
  var order=1-t;
  var cx=W/2,cy=H/2;
  tc.particles.forEach(function(p,i){
    /* Start in mandala-like formation */
    var ring=Math.floor(i/20),angle=(i%20)/20*Math.PI*2;
    var r0=(ring+1)*(Math.min(W,H)/10);
    var ox=cx+Math.cos(angle+p.phase*order)*r0*order;
    var oy=cy+Math.sin(angle+p.phase*order)*r0*order;
    /* Dissolve toward chaos */
    p.x=p.x*0.92+ox*0.08+(trng()-0.5)*t*20;
    p.y=p.y*0.92+oy*0.08+(trng()-0.5)*t*20;
    if(p.x<0)p.x+=W;if(p.x>W)p.x-=W;
    if(p.y<0)p.y+=H;if(p.y>H)p.y-=H;
    var alpha=(1-t*0.7)*(p.death>t?1:0.3);
    var dc=tc._colAt?tc._colAt(tc.particles.indexOf(p)):[R,G,B];
    ax.fillStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+alpha.toFixed(3)+')';
    ax.beginPath();ax.arc(p.x,p.y,p.size*(1+t),0,Math.PI*2);ax.fill();
  });
  /* Structural rings fade */
  for(var r=1;r<=5;r++){
    var rad=r*(Math.min(W,H)*0.09);
    ax.strokeStyle='rgba('+R+','+G+','+B+','+(order*0.3*order).toFixed(3)+')';
    ax.lineWidth=order*1.5;
    ax.beginPath();ax.arc(cx,cy,rad,0,Math.PI*2);ax.stroke();
  }
}

/* ── OSCILLATION: standing waves of possibility ── */
function renderOscillation(ax,t,W,H,R,G,B){
  var freq=2+tc.chaos*6;
  var wave=Math.sin(t*Math.PI*freq);
  /* Draw wave interference pattern evolving with t */
  for(var y=0;y<H;y+=4){
    for(var x=0;x<W;x+=4){
      var nx=x/W, ny=y/H;
      /* Two interfering waves */
      var w1=Math.sin(nx*freq*Math.PI*2+t*Math.PI*4);
      var w2=Math.sin(ny*freq*Math.PI*2+t*Math.PI*3+wave);
      var interference=(w1+w2)/2;
      var tMod=Math.sin(t*Math.PI*2+nx*4+ny*3);
      var alpha=Math.max(0,interference*tMod)*0.12;
      if(alpha<0.01)continue;
      ax.fillStyle='rgba('+R+','+G+','+B+','+alpha.toFixed(3)+')';
      ax.fillRect(x,y,4,4);
    }
  }
  /* Moving particles on wave crests */
  tc.particles.forEach(function(p){
    var w=Math.sin((p.x/W)*freq*Math.PI*2+t*Math.PI*4+(p.phase));
    var alpha=Math.max(0,w)*0.6;
    p.y+=Math.sin(t*Math.PI*6+p.phase)*0.5;
    p.x+=0.3*tc.speed;
    if(p.x>W)p.x-=W;
    ax.fillStyle='rgba('+R+','+G+','+B+','+alpha.toFixed(3)+')';
    ax.beginPath();ax.arc(p.x,p.y,p.size*(0.5+Math.abs(w)),0,Math.PI*2);ax.fill();
  });
}

/* ── REMEMBRANCE: image recalls itself from noise into clarity ── */
function renderRemembrance(ax,t,W,H,R,G,B){
  /* At t=0: pure noise. At t=1: clear geometric memory. */
  var clarity=Math.pow(t,1.5); /* slow start, faster clarity */
  var noiseAmt=1-clarity;
  /* Background noise */
  if(noiseAmt>0.05){
    for(var i=0;i<200*noiseAmt;i++){
      var nx=trng()*W,ny=trng()*H;
      ax.fillStyle='rgba('+R+','+G+','+B+','+(trng()*noiseAmt*0.15).toFixed(3)+')';
      ax.fillRect(nx,ny,2,2);
    }
  }
  /* Emerging structure: concentric shapes crystallizing */
  var phases=[0,Math.PI/4,Math.PI/2,3*Math.PI/4];
  phases.forEach(function(ph,i){
    var birth=i*0.2;
    if(t<birth)return;
    var localT=Math.min(1,(t-birth)/(1-birth+0.01));
    var sz=(0.1+i*0.15)*Math.min(W,H)*localT*clarity;
    ax.strokeStyle='rgba('+R+','+G+','+B+','+(clarity*0.6*(1-i*0.15)).toFixed(3)+')';
    ax.lineWidth=clarity*2;
    ax.beginPath();
    for(var s=0;s<6;s++){
      var a=ph+s/6*Math.PI*2;
      var px=W/2+Math.cos(a)*sz,py=H/2+Math.sin(a)*sz;
      s?ax.lineTo(px,py):ax.moveTo(px,py);
    }
    ax.closePath();ax.stroke();
  });
  /* Particle trails that "remember" their path */
  tc.particles.forEach(function(p){
    if(p.birth>t)return;
    var memStrength=clarity*tc.memory;
    p.x+=Math.cos(p.phase+t*Math.PI)*1.5*noiseAmt+Math.cos(p.phase)*0.5*clarity;
    p.y+=Math.sin(p.phase+t*Math.PI)*1.5*noiseAmt+Math.sin(p.phase*2)*0.5*clarity;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    var rc=tc._colAt?tc._colAt(tc.particles.indexOf(p)):[R,G,B];
    ax.fillStyle='rgba('+rc[0]+','+rc[1]+','+rc[2]+','+(0.05+clarity*0.4).toFixed(3)+')';
    ax.beginPath();ax.arc(p.x,p.y,p.size*clarity,0,Math.PI*2);ax.fill();
  });
}

/* ── ENTROPY: all structures forget themselves over time ── */
function renderEntropy(ax,t,W,H,R,G,B){
  /* At t=0: complex ordered lattice. As t grows: degrades into thermal noise. */
  var order=Math.pow(1-t,1.5);
  var entropy=1-order;
  /* Grid lattice with increasing disorder */
  var cellW=Math.max(4,Math.round(W/20*(1+entropy*3)));
  var cellH=Math.max(4,Math.round(H/20*(1+entropy*3)));
  for(var gy=0;gy<H;gy+=cellH){
    for(var gx=0;gx<W;gx+=cellW){
      var jx=gx+(trng()-0.5)*entropy*cellW*4;
      var jy=gy+(trng()-0.5)*entropy*cellH*4;
      var distort=entropy*tc.chaos;
      var phase=Math.sin(gx/W*Math.PI*4+t*Math.PI*3)*order+trng()*distort;
      var alpha=Math.max(0,Math.min(1,(phase*0.5+0.5)*(1-entropy*0.6)))*0.4;
      if(alpha<0.005)continue;
      ax.fillStyle='rgba('+R+','+G+','+B+','+alpha.toFixed(3)+')';
      ax.fillRect(jx,jy,cellW*order+2,cellH*order+2);
    }
  }
  /* Entropy particles wander randomly */
  tc.particles.forEach(function(p){
    p.vx+=(trng()-0.5)*entropy*2;p.vy+=(trng()-0.5)*entropy*2;
    p.vx*=0.95;p.vy*=0.95;
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    var ecc=tc._colAt?tc._colAt(tc.particles.indexOf(p)):[R,G,B];
    ax.fillStyle='rgba('+ecc[0]+','+ecc[1]+','+ecc[2]+','+(order*0.5).toFixed(3)+')';
    ax.beginPath();ax.arc(p.x,p.y,p.size*(0.5+order),0,Math.PI*2);ax.fill();
  });
  /* Entropy: letter-like fragments dissolving */
  if(order>0.1){
    var lines=8;
    for(var l=0;l<lines;l++){
      var ly=H*(l+0.5)/lines+(trng()-0.5)*entropy*30;
      ax.strokeStyle='rgba('+R+','+G+','+B+','+(order*0.2).toFixed(3)+')';
      ax.lineWidth=order;ax.setLineDash([5+entropy*20,3+entropy*30]);
      ax.beginPath();ax.moveTo(trng()*W*entropy,ly);ax.lineTo(W-trng()*W*entropy,ly);ax.stroke();
    }
    ax.setLineDash([]);
  }
}

/* ── Playback loop ── */
function startPlayback(maxFrames,doLoop){
  if(tc.rafId)cancelAnimationFrame(tc.rafId);
  var limit=maxFrames||1000;
  var tPerFrame=1000/limit;
  /* Cross-fade state for smooth looping */
  var fadingOut=false, fadeAlpha=1.0, fadeCanvas=null;
  var FADE_FRAMES=30; /* number of rAF frames for the crossfade */
  var fadeStep=0;

  function loop(){
    if(!tc.playing)return;

    /* ── Cross-fade transition ── */
    if(fadingOut){
      fadeStep++;
      var progress=fadeStep/FADE_FRAMES;
      var ax2=actx();
      if(ax2&&fadeCanvas){
        /* Blend: outgoing frame fades out, incoming (t=0) renders beneath */
        ax2.clearRect(0,0,ax2.canvas.width,ax2.canvas.height);
        /* Render fresh t=0 frame underneath */
        ax2.save();ax2.globalAlpha=progress;
        var sl2=document.getElementById('tc-time');
        var tv2=document.getElementById('tc-time-v');
        tc.t=progress*100; /* start of new cycle */
        if(sl2)sl2.value=Math.round(tc.t);
        if(tv2)tv2.textContent=Math.round(tc.t/10)+'%';
        renderFrame(tc.t/1000);
        ax2.restore();
        /* Overlay outgoing frame fading out */
        ax2.save();ax2.globalAlpha=Math.max(0,1-progress);
        ax2.drawImage(fadeCanvas,0,0);
        ax2.restore();
        if(window._layersCompositeFn)window._layersCompositeFn();
      }
      if(fadeStep>=FADE_FRAMES){
        fadingOut=false;fadeCanvas=null;fadeStep=0;
      }
      tc.rafId=requestAnimationFrame(loop);
      return;
    }

    tc.t=Math.min(1000,tc.t+tPerFrame*tc.speed);
    var sl=document.getElementById('tc-time');
    var tv=document.getElementById('tc-time-v');
    if(sl)sl.value=Math.round(tc.t);
    if(tv)tv.textContent=Math.round(tc.t/10)+'%';
    renderFrame(tc.t/1000);

    if(tc.t>=999.9){
      if(doLoop&&tc.looping){
        /* Capture current (end) frame for cross-fade */
        var ax=actx();
        if(ax){
          fadeCanvas=document.createElement('canvas');
          fadeCanvas.width=ax.canvas.width;fadeCanvas.height=ax.canvas.height;
          fadeCanvas.getContext('2d').drawImage(ax.canvas,0,0);
        }
        /* Reset and reinit for new cycle */
        tc.t=0;tc.history=[];
        if(sl)sl.value=0;if(tv)tv.textContent='0%';
        tseed(tc.seed);initTemporal();
        var ax3=actx();
        if(ax3)ax3.clearRect(0,0,ax3.canvas.width,ax3.canvas.height);
        if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
        if(typeof layers!=='undefined'&&layers&&layers.length)
          layers.forEach(function(l){try{l.ctx.clearRect(0,0,l.canvas.width,l.canvas.height);}catch(e){}});
        /* Begin fade transition */
        fadingOut=true;fadeStep=0;
        tc.rafId=requestAnimationFrame(loop);
        return;
      }
      tc.playing=false;tc.looping=false;
      var _sp=typeof _setPlayState==='function'?_setPlayState:null;
      if(_sp)_sp(false,false);
      si('Temporal sequence complete — '+limit+' frames');
      return;
    }
    tc.rafId=requestAnimationFrame(loop);
  }
  tc.rafId=requestAnimationFrame(loop);
}

function stopPlayback(){
  tc.playing=false;
  if(tc.rafId)cancelAnimationFrame(tc.rafId);
  tc.rafId=null;
}

/* ── Auto-init when exp-toggle opens (after intent sculpting section) ── */
/* Patch the runIntentDefault to also init temporal if mode changes */
var _origRunIntentDefault=window.runIntentDefault;
window.runIntentDefault=function(){
  if(_origRunIntentDefault)_origRunIntentDefault();
  /* Temporal Canvases inits lazily when its own toggle is clicked */
  setTimeout(function(){
    si('Experimental Tools — click a tool header to activate');
  },100);
};

/* Wire on DOM ready — don't auto-render, wait for user to toggle open */
setTimeout(function(){
  wireControls();
  /* initTemporal() called lazily when temporal-toggle is clicked */
}, 400);

})();
