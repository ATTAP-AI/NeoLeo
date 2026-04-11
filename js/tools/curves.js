/* ══════════════════════════════════════════════════════════════
   CURVES TOOL — Photoshop-style tonal adjustment
   Interactive spline curve editor with per-channel control,
   histogram display, draggable control points, real-time preview
   ══════════════════════════════════════════════════════════════ */
(function(){

var _cvPanel=null,_cvOpen=false,_cvPos=null,_cvUserClosed=false;
var _cvSnap=null; /* pre-curves canvas snapshot */
var _cvDebounce=null;
var GS=256; /* graph size in pixels */
var CHAN='rgb'; /* current channel: rgb, r, g, b */
var POINTS={rgb:[[0,0],[255,255]],r:[[0,0],[255,255]],g:[[0,0],[255,255]],b:[[0,0],[255,255]]};
var DRAG_PT=null;
var CHAN_COLORS={rgb:'#ffffff',r:'#ff4444',g:'#44ff44',b:'#6688ff'};
var _histogram=null;

/* ── Cubic spline interpolation ── */
function buildLUT(pts){
  pts.sort(function(a,b){return a[0]-b[0];});
  var n=pts.length;
  if(n<2){var lut=new Uint8Array(256);for(var i=0;i<256;i++)lut[i]=i;return lut;}
  /* Natural cubic spline */
  var xs=[],ys=[];
  for(var i=0;i<n;i++){xs.push(pts[i][0]);ys.push(pts[i][1]);}
  var h=[],a=[],l=[],mu=[],z=[];
  for(var i=0;i<n-1;i++)h.push(xs[i+1]-xs[i]);
  for(var i=1;i<n-1;i++)a.push(3*(ys[i+1]-ys[i])/h[i]-3*(ys[i]-ys[i-1])/h[i-1]);
  l.push(1);mu.push(0);z.push(0);
  for(var i=1;i<n-1;i++){
    l.push(2*(xs[i+1]-xs[i-1])-h[i-1]*mu[i-1]);
    mu.push(h[i]/l[i]);
    z.push((a[i-1]-h[i-1]*z[i-1])/l[i]);
  }
  l.push(1);z.push(0);
  var b2=new Array(n).fill(0),c2=new Array(n).fill(0),d2=new Array(n).fill(0);
  for(var j=n-2;j>=0;j--){
    c2[j]=z[j]-mu[j]*c2[j+1];
    b2[j]=(ys[j+1]-ys[j])/h[j]-h[j]*(c2[j+1]+2*c2[j])/3;
    d2[j]=(c2[j+1]-c2[j])/(3*h[j]);
  }
  var lut=new Uint8Array(256);
  for(var x=0;x<256;x++){
    var seg=0;
    for(var s=0;s<n-1;s++){if(x>=xs[s])seg=s;}
    var dx=x-xs[seg];
    var val=ys[seg]+b2[seg]*dx+c2[seg]*dx*dx+d2[seg]*dx*dx*dx;
    lut[x]=Math.max(0,Math.min(255,Math.round(val)));
  }
  return lut;
}

/* ── Compute histogram from image data ── */
function computeHistogram(imgData){
  var d=imgData.data,len=d.length;
  var hr=new Uint32Array(256),hg=new Uint32Array(256),hb=new Uint32Array(256),hl=new Uint32Array(256);
  for(var i=0;i<len;i+=4){
    hr[d[i]]++;hg[d[i+1]]++;hb[d[i+2]]++;
    hl[Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])]++;
  }
  return {r:hr,g:hg,b:hb,lum:hl};
}

/* ── Draw the curve graph ── */
function drawGraph(){
  var gc=document.getElementById('cv-graph');
  if(!gc)return;
  var c=gc.getContext('2d');
  var S=GS;
  c.clearRect(0,0,S,S);

  /* Background */
  c.fillStyle='#1a1a1a';c.fillRect(0,0,S,S);

  /* Histogram */
  if(_histogram){
    var hd=CHAN==='r'?_histogram.r:CHAN==='g'?_histogram.g:CHAN==='b'?_histogram.b:_histogram.lum;
    var maxH=0;for(var i=0;i<256;i++)if(hd[i]>maxH)maxH=hd[i];
    if(maxH>0){
      c.fillStyle='rgba(255,255,255,0.12)';
      for(var i=0;i<256;i++){
        var bh=(hd[i]/maxH)*S*0.85;
        c.fillRect(i*(S/256),S-bh,Math.ceil(S/256),bh);
      }
    }
  }

  /* Grid */
  c.strokeStyle='rgba(255,255,255,0.1)';c.lineWidth=0.5;
  for(var g=1;g<4;g++){
    var gp=g*S/4;
    c.beginPath();c.moveTo(gp,0);c.lineTo(gp,S);c.stroke();
    c.beginPath();c.moveTo(0,gp);c.lineTo(S,gp);c.stroke();
  }

  /* Baseline diagonal */
  c.strokeStyle='rgba(255,255,255,0.15)';c.lineWidth=0.8;
  c.setLineDash([3,3]);
  c.beginPath();c.moveTo(0,S);c.lineTo(S,0);c.stroke();
  c.setLineDash([]);

  /* Draw inactive channel curves first */
  ['r','g','b'].forEach(function(ch){
    if(CHAN!=='rgb'&&ch!==CHAN){
      drawCurve(c,POINTS[ch],CHAN_COLORS[ch],0.25,1);
    }
  });

  /* Draw active channel curve */
  var activePts=POINTS[CHAN];
  var activeCol=CHAN_COLORS[CHAN];
  drawCurve(c,activePts,activeCol,0.9,2);

  /* Draw control points */
  activePts.forEach(function(pt,idx){
    var px=pt[0]*(S/255),py=S-pt[1]*(S/255);
    c.beginPath();c.arc(px,py,5,0,Math.PI*2);
    c.fillStyle='#ffffff';c.fill();
    c.strokeStyle=activeCol;c.lineWidth=1.5;c.stroke();
  });
}

function drawCurve(c,pts,color,alpha,width){
  var S=GS;
  var lut=buildLUT(pts);
  c.save();
  c.globalAlpha=alpha;
  c.strokeStyle=color;c.lineWidth=width;
  c.beginPath();
  for(var x=0;x<256;x++){
    var px=x*(S/255),py=S-lut[x]*(S/255);
    x===0?c.moveTo(px,py):c.lineTo(px,py);
  }
  c.stroke();
  c.restore();
}

/* ── Apply curves to canvas (preview) ── */
function applyCurvesPreview(){
  if(_cvDebounce)clearTimeout(_cvDebounce);
  _cvDebounce=setTimeout(function(){
    var cvEl=document.getElementById('cv');
    if(!cvEl||!_cvSnap)return;
    var cctx=cvEl.getContext('2d');
    var W=cvEl.width,H=cvEl.height;

    var lutR=buildLUT(POINTS.r);
    var lutG=buildLUT(POINTS.g);
    var lutB=buildLUT(POINTS.b);
    var lutRGB=buildLUT(POINTS.rgb);

    /* Apply RGB master first, then per-channel */
    var src=_cvSnap;
    var dst=cctx.createImageData(W,H);
    var sd=src.data,dd=dst.data;
    for(var i=0;i<sd.length;i+=4){
      var r=lutRGB[sd[i]],g=lutRGB[sd[i+1]],b=lutRGB[sd[i+2]];
      dd[i]=lutR[r];dd[i+1]=lutG[g];dd[i+2]=lutB[b];dd[i+3]=sd[i+3];
    }
    cctx.putImageData(dst,0,0);

    /* Update I/O display */
    var ioEl=document.getElementById('cv-io');
    if(ioEl)ioEl.textContent='Preview active';
  },40);
}

/* ── Build panel ── */
function buildCurvesPanel(){
  if(_cvPanel)return;

  var sty=document.createElement('style');
  sty.textContent=[
    '#curves-panel{display:none;position:fixed;z-index:620;',
    '  width:320px;',
    '  background:#321a22;',
    '  border:1px solid rgba(255,255,255,0.2);border-radius:8px;',
    '  box-shadow:0 12px 60px rgba(0,0,0,0.9);',
    '  font-family:inherit;overflow:hidden;flex-direction:column;}',
    '#curves-panel.open{display:flex;}',
    '#cv-head{display:flex;align-items:center;justify-content:space-between;',
    '  padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.08);',
    '  background:rgba(255,255,255,0.03);flex-shrink:0;',
    '  cursor:grab;user-select:none;-webkit-user-select:none;',
    '  border-radius:8px 8px 0 0;}',
    '#cv-graph{cursor:crosshair;border:1px solid rgba(255,255,255,0.15);',
    '  border-radius:2px;display:block;margin:0 auto;}',
  ].join('\n');
  document.head.appendChild(sty);

  _cvPanel=document.createElement('div');
  _cvPanel.id='curves-panel';
  _cvPanel.innerHTML=[
    '<div id="cv-head">',
    '  <div style="font-size:10px;letter-spacing:.18em;color:#ffffff;text-transform:uppercase;font-weight:700;">Curves</div>',
    '  <button id="cv-close" style="background:none;border:1px solid rgba(255,255,255,0.15);color:#ff9742;font-size:9px;padding:3px 8px;cursor:pointer;border-radius:3px;font-family:inherit;">Close</button>',
    '</div>',
    '<div style="padding:10px 12px;">',

    /* Channel selector */
    '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">',
    '    <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.08em;text-transform:uppercase;">Channel</span>',
    '    <select id="cv-channel" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-family:inherit;font-size:10px;padding:4px 6px;cursor:pointer;border-radius:3px;">',
    '      <option value="rgb" selected>RGB</option>',
    '      <option value="r">Red</option>',
    '      <option value="g">Green</option>',
    '      <option value="b">Blue</option>',
    '    </select>',
    '  </div>',

    /* Graph canvas */
    '  <canvas id="cv-graph" width="'+GS+'" height="'+GS+'" style="width:100%;height:auto;"></canvas>',

    /* I/O display */
    '  <div style="display:flex;justify-content:space-between;margin-top:6px;margin-bottom:8px;">',
    '    <span id="cv-io" style="font-size:8px;color:rgba(255,255,255,0.4);">Click curve to add points</span>',
    '    <span id="cv-io-vals" style="font-size:8px;color:rgba(255,255,255,0.4);font-family:monospace;"></span>',
    '  </div>',

    /* Presets */
    '  <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;">',
    '    <button class="cv-preset" data-preset="contrast" style="flex:1;min-width:55px;padding:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:7px;cursor:pointer;border-radius:2px;font-family:inherit;letter-spacing:.04em;">S-Curve</button>',
    '    <button class="cv-preset" data-preset="brighten" style="flex:1;min-width:55px;padding:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:7px;cursor:pointer;border-radius:2px;font-family:inherit;letter-spacing:.04em;">Brighten</button>',
    '    <button class="cv-preset" data-preset="darken" style="flex:1;min-width:55px;padding:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:7px;cursor:pointer;border-radius:2px;font-family:inherit;letter-spacing:.04em;">Darken</button>',
    '    <button class="cv-preset" data-preset="invert" style="flex:1;min-width:55px;padding:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:7px;cursor:pointer;border-radius:2px;font-family:inherit;letter-spacing:.04em;">Invert</button>',
    '    <button class="cv-preset" data-preset="crossprocess" style="flex:1;min-width:55px;padding:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:7px;cursor:pointer;border-radius:2px;font-family:inherit;letter-spacing:.04em;">X-Process</button>',
    '  </div>',

    /* Buttons */
    '  <div style="display:flex;gap:6px;">',
    '    <button id="cv-apply" style="flex:1;padding:7px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;font-family:inherit;font-size:10px;cursor:pointer;letter-spacing:.1em;text-transform:uppercase;font-weight:700;border-radius:4px;">✓ Apply</button>',
    '    <button id="cv-revert" style="flex:0.5;padding:7px;background:none;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-family:inherit;font-size:9px;cursor:pointer;border-radius:4px;">Revert</button>',
    '    <button id="cv-reset" style="flex:0.5;padding:7px;background:none;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-family:inherit;font-size:9px;cursor:pointer;border-radius:4px;">Reset</button>',
    '  </div>',

    '</div>',
  ].join('\n');
  document.body.appendChild(_cvPanel);

  /* ── Drag header ── */
  var head=document.getElementById('cv-head');
  head.addEventListener('mousedown',function(e){
    if(e.target.id==='cv-close'||e.target.closest('#cv-close'))return;
    e.preventDefault();head.style.cursor='grabbing';
    var r=_cvPanel.getBoundingClientRect();
    var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
    function mv(ev){
      var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
      var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
      _cvPanel.style.left=nl+'px';_cvPanel.style.top=nt+'px';_cvPos={left:nl,top:nt};
    }
    function up(){head.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });

  /* ── Close ── */
  document.getElementById('cv-close').addEventListener('click',function(){
    _cvUserClosed=true;
    closeCurvesPanel();
  });

  /* ── Channel selector ── */
  document.getElementById('cv-channel').addEventListener('change',function(){
    CHAN=this.value;
    drawGraph();
  });

  /* ── Graph interaction: add/drag/remove points ── */
  var gc=document.getElementById('cv-graph');

  function graphXY(e){
    var r=gc.getBoundingClientRect();
    var scaleX=GS/r.width,scaleY=GS/r.height;
    var mx=(e.clientX-r.left)*scaleX;
    var my=(e.clientY-r.top)*scaleY;
    var vx=Math.max(0,Math.min(255,Math.round(mx*(255/GS))));
    var vy=Math.max(0,Math.min(255,Math.round((GS-my)*(255/GS))));
    return [vx,vy,mx,my];
  }

  function findNearPt(vx,vy){
    var pts=POINTS[CHAN];
    var best=-1,bestD=Infinity;
    for(var i=0;i<pts.length;i++){
      var dx=pts[i][0]-vx,dy=pts[i][1]-vy;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(d<bestD){bestD=d;best=i;}
    }
    return bestD<15?best:-1;
  }

  gc.addEventListener('mousedown',function(e){
    e.preventDefault();
    var pos=graphXY(e);
    var near=findNearPt(pos[0],pos[1]);
    if(near>=0){
      /* Don't allow dragging endpoints off the edge */
      DRAG_PT={chan:CHAN,idx:near,isEndpoint:(near===0||near===POINTS[CHAN].length-1)};
    } else {
      /* Add new point */
      POINTS[CHAN].push([pos[0],pos[1]]);
      POINTS[CHAN].sort(function(a,b){return a[0]-b[0];});
      /* Find the new point's index */
      for(var i=0;i<POINTS[CHAN].length;i++){
        if(POINTS[CHAN][i][0]===pos[0]&&POINTS[CHAN][i][1]===pos[1]){
          DRAG_PT={chan:CHAN,idx:i,isEndpoint:false};break;
        }
      }
      /* Capture snapshot on first interaction */
      if(!_cvSnap){
        var cvEl=document.getElementById('cv');
        if(cvEl){
          _cvSnap=cvEl.getContext('2d').getImageData(0,0,cvEl.width,cvEl.height);
          _histogram=computeHistogram(_cvSnap);
        }
      }
      drawGraph();
      applyCurvesPreview();
    }
    updateIO(pos[0],pos[1]);
  });

  gc.addEventListener('mousemove',function(e){
    var pos=graphXY(e);
    if(DRAG_PT&&DRAG_PT.chan===CHAN){
      var pt=POINTS[CHAN][DRAG_PT.idx];
      if(DRAG_PT.isEndpoint){
        /* Endpoints: only move Y */
        pt[1]=pos[1];
      } else {
        pt[0]=pos[0];pt[1]=pos[1];
      }
      /* Capture snapshot if needed */
      if(!_cvSnap){
        var cvEl=document.getElementById('cv');
        if(cvEl){
          _cvSnap=cvEl.getContext('2d').getImageData(0,0,cvEl.width,cvEl.height);
          _histogram=computeHistogram(_cvSnap);
        }
      }
      drawGraph();
      applyCurvesPreview();
    }
    updateIO(pos[0],pos[1]);
  });

  document.addEventListener('mouseup',function(){
    DRAG_PT=null;
  });

  /* Double-click to remove point (not endpoints) */
  gc.addEventListener('dblclick',function(e){
    var pos=graphXY(e);
    var near=findNearPt(pos[0],pos[1]);
    if(near>0&&near<POINTS[CHAN].length-1){
      POINTS[CHAN].splice(near,1);
      drawGraph();
      applyCurvesPreview();
    }
  });

  function updateIO(inVal,outVal){
    var el=document.getElementById('cv-io-vals');
    if(el)el.textContent='In:'+inVal+' Out:'+outVal;
  }

  /* ── Presets ── */
  document.querySelectorAll('.cv-preset').forEach(function(btn){
    btn.addEventListener('click',function(){
      var p=btn.dataset.preset;
      if(!_cvSnap){
        var cvEl=document.getElementById('cv');
        if(cvEl){
          _cvSnap=cvEl.getContext('2d').getImageData(0,0,cvEl.width,cvEl.height);
          _histogram=computeHistogram(_cvSnap);
        }
      }
      if(p==='contrast'){
        POINTS[CHAN]=[[0,0],[64,40],[192,215],[255,255]];
      } else if(p==='brighten'){
        POINTS[CHAN]=[[0,0],[128,170],[255,255]];
      } else if(p==='darken'){
        POINTS[CHAN]=[[0,0],[128,85],[255,255]];
      } else if(p==='invert'){
        POINTS[CHAN]=[[0,255],[255,0]];
      } else if(p==='crossprocess'){
        POINTS.r=[[0,0],[60,20],[128,160],[200,240],[255,255]];
        POINTS.g=[[0,10],[80,60],[180,210],[255,240]];
        POINTS.b=[[0,30],[100,80],[200,180],[255,220]];
        POINTS.rgb=[[0,0],[255,255]];
      }
      drawGraph();
      applyCurvesPreview();
    });
  });

  /* ── Apply ── */
  document.getElementById('cv-apply').addEventListener('click',function(){
    if(!_cvSnap)return;
    if(window.genUndoPush)window.genUndoPush();
    _cvSnap=null;_histogram=null;
    var ioEl=document.getElementById('cv-io');
    if(ioEl)ioEl.textContent='Curves applied';
    if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  });

  /* ── Revert ── */
  document.getElementById('cv-revert').addEventListener('click',function(){
    if(!_cvSnap)return;
    var cvEl=document.getElementById('cv');
    if(cvEl)cvEl.getContext('2d').putImageData(_cvSnap,0,0);
    _cvSnap=null;_histogram=null;
    var ioEl=document.getElementById('cv-io');
    if(ioEl)ioEl.textContent='Reverted';
  });

  /* ── Reset curve ── */
  document.getElementById('cv-reset').addEventListener('click',function(){
    POINTS={rgb:[[0,0],[255,255]],r:[[0,0],[255,255]],g:[[0,0],[255,255]],b:[[0,0],[255,255]]};
    drawGraph();
    if(_cvSnap)applyCurvesPreview();
  });

  drawGraph();
}

function openCurvesPanel(){
  buildCurvesPanel();
  if(_cvOpen)return;
  _cvOpen=true;
  if(_cvPos){_cvPanel.style.left=_cvPos.left+'px';_cvPanel.style.top=_cvPos.top+'px';}
  else{var tb=document.getElementById('tb');if(tb){var r=tb.getBoundingClientRect();_cvPanel.style.left=Math.max(4,r.left-328)+'px';_cvPanel.style.top='10px';}else{_cvPanel.style.left='50px';_cvPanel.style.top='40px';}}
  _cvPanel.classList.add('open');
  if(window.bringToFront) window.bringToFront('curves-panel');
  _cvSnap=null;_histogram=null;
  /* Reset curves to linear on open */
  POINTS={rgb:[[0,0],[255,255]],r:[[0,0],[255,255]],g:[[0,0],[255,255]],b:[[0,0],[255,255]]};
  drawGraph();
}

function closeCurvesPanel(){
  _cvOpen=false;
  if(_cvPanel)_cvPanel.classList.remove('open');
  if(_cvSnap){
    var cvEl=document.getElementById('cv');
    if(cvEl)cvEl.getContext('2d').putImageData(_cvSnap,0,0);
    _cvSnap=null;_histogram=null;
  }
}

/* ── Hook into tool selection ── */
var _prevSetToolPS4=window.setTool_ps;
window.setTool_ps=function(t){
  if(_prevSetToolPS4)_prevSetToolPS4(t);
  if(t==='curves'){
    _cvUserClosed=false;
    openCurvesPanel();
  } else {
    closeCurvesPanel();
  }
};
var _origOpenCV=openCurvesPanel;
openCurvesPanel=function(){
  if(_cvUserClosed)return;
  _origOpenCV();
};

})();
