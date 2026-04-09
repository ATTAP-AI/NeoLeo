/* ══════════════════════════════════════════════════════════════
   PS-TOOLS  --  Photoshop-style drawing tools
   Extracted from NeoLeo monolith (lines ~8395-9078)
   Tools: eraser, eyedropper, clone stamp, healing brush, dodge,
   burn, smudge, blur, sharpen, sponge, gradient, regular polygon
   Plus: toolbar buttons, strength slider, tool info popups
   Plain JS, window.* globals, NO ES modules
   ══════════════════════════════════════════════════════════════ */

/* ── State for new tools ── */
var cloneSrcX=null, cloneSrcY=null, cloneOffX=0, cloneOffY=0;
var cloneAligned=true;          // Photoshop "Aligned" checkbox
var cloneStrokeStarted=false;   // tracks first stamp of current stroke (for non-aligned mode reset)
var cloneAnchorX=null, cloneAnchorY=null; // remembered source anchor for non-aligned restart
var cloneSpaced=0;               // accumulated stroke distance since last stamp
var cloneSnap=null;              // canvas snapshot of full source composite at stroke start
var gradStartX=null, gradStartY=null;
var bgCol='#000000';
var toolStrength=0.5;
var spongeSaturate=true;
var gradientType='linear';

/* ── PS keyboard shortcuts ── */
/* Extend existing km object -- patch keydown listener */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const psKeys={'i':'eyedropper','n':'pencil','v':'','e':'eraser',
    's':'clone','j':'heal','m':'smudge','u':'blur','h':'sharpen',
    'o':'dodge','x':'burn','z':'sponge','g':'gradient','k':'fill','w':'texturemap','q':'humanize','v':'curves'};
  if(psKeys.hasOwnProperty(e.key)){setTool(psKeys[e.key]);}
  /* X = swap fg/bg */
  if(e.key==='X'){var tmp=drawCol;drawCol=bgCol;bgCol=tmp;
    var fg=document.getElementById('dcol');if(fg){fg.value=drawCol;document.getElementById('dcoltxt').textContent=drawCol;}
    var bgSw=document.getElementById('bg-swatch-fill');if(bgSw)bgSw.style.background=bgCol;}
},{capture:false});

/* ── Background color swatch (add to panel) ── */
(function(){
  var sw=document.getElementById('csw');
  if(!sw)return;
  /* Inject bg swatch next to fg swatch */
  var bgDiv=document.createElement('div');
  bgDiv.innerHTML='<div id="bg-swatch" style="position:relative;display:inline-block;margin-left:4px;vertical-align:middle;">'
    +'<div id="bg-swatch-fill" style="width:20px;height:20px;background:#000;border:1px solid #666;cursor:pointer;" title="Background colour"></div>'
    +'<input type="color" id="dcol-bg" value="#000000" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;">'
    +'</div><span style="font-size:8px;color:#97c3b0;margin-left:4px;" title="X key to swap">&#8644;</span>';
  sw.parentNode.insertBefore(bgDiv,sw.nextSibling);
  document.getElementById('dcol-bg').addEventListener('input',function(e){
    bgCol=e.target.value;
    document.getElementById('bg-swatch-fill').style.background=bgCol;
  });
})();

/* ── Eyedropper ── */
function pickColour(x,y){
  var tmp=document.createElement('canvas');
  tmp.width=cv.width;tmp.height=cv.height;
  var tc=tmp.getContext('2d');
  tc.drawImage(uv,0,0);tc.drawImage(cv,0,0);tc.drawImage(dv,0,0);
  var px=tc.getImageData(Math.round(x),Math.round(y),1,1).data;
  var hex='#'+[px[0],px[1],px[2]].map(function(v){return v.toString(16).padStart(2,'0');}).join('');
  drawCol=hex;window.drawCol=hex;
  var fg=document.getElementById('dcol');
  if(fg)fg.value=hex;
  var txt=document.getElementById('dcoltxt');if(txt)txt.textContent=hex;
  var cswEl=document.getElementById('csw');if(cswEl)cswEl.style.background=hex;
  setI('Sampled: '+hex);
}

/* ── Pixel operation helper -- dodge/burn/blur/sharpen/smudge/sponge ── */
function applyPixelOp(tool,x,y,sz,str){
  /* Operate on engine canvas (cv) where generated art lives, not empty dv */
  var tctx=window._getActiveLayerCtx?window._getActiveLayerCtx():ctx;
  var r=Math.max(2,Math.round(sz/2));
  var x0=Math.max(0,Math.round(x-r)), y0=Math.max(0,Math.round(y-r));
  var x1=Math.min(tctx.canvas.width-1,Math.round(x+r));
  var y1=Math.min(tctx.canvas.height-1,Math.round(y+r));
  var w=x1-x0+1, h=y1-y0+1;
  if(w<1||h<1)return;

  /* For smudge/heal pre-read composite image data (fast) */
  var srcData=null;
  if(tool==='smudge'||tool==='heal'){
    var tmp2=document.createElement('canvas');tmp2.width=cv.width;tmp2.height=cv.height;
    var tc2=tmp2.getContext('2d');tc2.drawImage(uv,0,0);tc2.drawImage(cv,0,0);tc2.drawImage(dv,0,0);
    srcData=tc2.getImageData(0,0,cv.width,cv.height).data;
  }

  var id=tctx.getImageData(x0,y0,w,h);
  var d=id.data;
  for(var py=0;py<h;py++){
    for(var px2=0;px2<w;px2++){
      var dx2=px2-(x-x0), dy2=py-(y-y0);
      var dist=Math.sqrt(dx2*dx2+dy2*dy2);
      if(dist>r)continue;
      var f=str*(1-dist/r); /* linear falloff */
      var i=(py*w+px2)*4;
      if(d[i+3]<1)continue;

      if(tool==='dodge'){
        d[i]  =Math.min(255,Math.round(d[i]  +(255-d[i]  )*f*0.6));
        d[i+1]=Math.min(255,Math.round(d[i+1]+(255-d[i+1])*f*0.6));
        d[i+2]=Math.min(255,Math.round(d[i+2]+(255-d[i+2])*f*0.6));
      } else if(tool==='burn'){
        d[i]  =Math.max(0,Math.round(d[i]  *(1-f*0.6)));
        d[i+1]=Math.max(0,Math.round(d[i+1]*(1-f*0.6)));
        d[i+2]=Math.max(0,Math.round(d[i+2]*(1-f*0.6)));
      } else if(tool==='blur'){
        var sr=0,sg=0,sb=0,cnt=0;
        for(var ny=-2;ny<=2;ny++)for(var nx=-2;nx<=2;nx++){
          var qi=((py+ny)*w+(px2+nx))*4;
          if(py+ny>=0&&py+ny<h&&px2+nx>=0&&px2+nx<w&&d[qi+3]>0){sr+=d[qi];sg+=d[qi+1];sb+=d[qi+2];cnt++;}
        }
        if(cnt){d[i]=Math.round(d[i]*(1-f)+(sr/cnt)*f);d[i+1]=Math.round(d[i+1]*(1-f)+(sg/cnt)*f);d[i+2]=Math.round(d[i+2]*(1-f)+(sb/cnt)*f);}
      } else if(tool==='sharpen'){
        d[i]  =Math.max(0,Math.min(255,Math.round(d[i]  +(d[i]  -128)*f*0.6)));
        d[i+1]=Math.max(0,Math.min(255,Math.round(d[i+1]+(d[i+1]-128)*f*0.6)));
        d[i+2]=Math.max(0,Math.min(255,Math.round(d[i+2]+(d[i+2]-128)*f*0.6)));
      } else if(tool==='smudge'){
        var ox=Math.max(0,Math.min(cv.width-1,Math.round(x0+px2+smudgeDX*0.4)));
        var oy=Math.max(0,Math.min(cv.height-1,Math.round(y0+py+smudgeDY*0.4)));
        var si2=(oy*cv.width+ox)*4;
        d[i]=Math.round(d[i]*(1-f)+srcData[si2]*f);
        d[i+1]=Math.round(d[i+1]*(1-f)+srcData[si2+1]*f);
        d[i+2]=Math.round(d[i+2]*(1-f)+srcData[si2+2]*f);
      } else if(tool==='sponge'){
        var grey=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
        if(spongeSaturate){d[i]=Math.round(d[i]+(d[i]-grey)*f*0.5);d[i+1]=Math.round(d[i+1]+(d[i+1]-grey)*f*0.5);d[i+2]=Math.round(d[i+2]+(d[i+2]-grey)*f*0.5);}
        else{d[i]=Math.round(d[i]*(1-f)+grey*f);d[i+1]=Math.round(d[i+1]*(1-f)+grey*f);d[i+2]=Math.round(d[i+2]*(1-f)+grey*f);}
        d[i]=Math.max(0,Math.min(255,d[i]));d[i+1]=Math.max(0,Math.min(255,d[i+1]));d[i+2]=Math.max(0,Math.min(255,d[i+2]));
      } else if(tool==='heal'){
        var sr2=0,sg2=0,sb2=0,cnt2=0;
        for(var ny2=-4;ny2<=4;ny2++)for(var nx2=-4;nx2<=4;nx2++){
          var xi2=x0+px2+nx2, yi2=y0+py+ny2;
          if(xi2>=0&&xi2<cv.width&&yi2>=0&&yi2<cv.height){
            var si3=(yi2*cv.width+xi2)*4;
            sr2+=srcData[si3];sg2+=srcData[si3+1];sb2+=srcData[si3+2];cnt2++;
          }
        }
        if(cnt2){d[i]=Math.round(d[i]*(1-f)+(sr2/cnt2)*f);d[i+1]=Math.round(d[i+1]*(1-f)+(sg2/cnt2)*f);d[i+2]=Math.round(d[i+2]*(1-f)+(sb2/cnt2)*f);}
      }
    }
  }
  tctx.putImageData(id,x0,y0);
}

/* ── Clone stamp helpers ── */
/* Build a full-composite source snapshot of all currently visible art.
   Excludes the active draw layer to prevent feedback when painting onto it. */
function buildCloneSnapshot(){
  var snap=document.createElement('canvas');
  snap.width=cv.width;snap.height=cv.height;
  var sctx=snap.getContext('2d');
  /* Layer order matches what the user sees: upload → engine → draw */
  if(uv)sctx.drawImage(uv,0,0);
  if(cv)sctx.drawImage(cv,0,0);
  if(dv)sctx.drawImage(dv,0,0);
  return snap;
}

/* Build a soft-edge stamp brush of given size, hardness 0..1.
   Returns an offscreen canvas containing a white circular mask with
   the requested hardness falloff. The mask is then used as a clipping
   alpha for drawing the source patch. */
var _cloneBrushCache={};
function getCloneBrush(sz,hd){
  var key=sz+'_'+hd;
  if(_cloneBrushCache[key])return _cloneBrushCache[key];
  var b=document.createElement('canvas');b.width=sz;b.height=sz;
  var bc=b.getContext('2d');
  var r=sz/2;
  var hard=Math.max(0,Math.min(1,hd));
  var inner=r*hard;
  var g=bc.createRadialGradient(r,r,inner,r,r,r);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  bc.fillStyle=g;
  bc.fillRect(0,0,sz,sz);
  _cloneBrushCache[key]=b;
  /* Bound cache size */
  var keys=Object.keys(_cloneBrushCache);
  if(keys.length>32)delete _cloneBrushCache[keys[0]];
  return b;
}

/* Stamp a single soft clone dab at (x,y), sampling from cloneSnap with
   the current source offset. */
function paintCloneStamp(x,y,sz,hd,op){
  if(cloneSrcX===null||!cloneSnap)return;
  var tctx=window._getActiveLayerCtx?window._getActiveLayerCtx():ctx;
  var sx=x-cloneOffX, sy=y-cloneOffY;        // source position for this dab
  if(sx<-sz||sy<-sz||sx>cv.width+sz||sy>cv.height+sz)return;
  var r=sz/2;
  /* Build the dab in an offscreen buffer: source patch * soft brush mask */
  var dab=document.createElement('canvas');dab.width=sz;dab.height=sz;
  var dctx2=dab.getContext('2d');
  /* 1. paint the source patch */
  dctx2.drawImage(cloneSnap, sx-r, sy-r, sz, sz, 0, 0, sz, sz);
  /* 2. mask it with the soft brush using destination-in */
  dctx2.globalCompositeOperation='destination-in';
  dctx2.drawImage(getCloneBrush(sz,hd),0,0);
  /* 3. composite onto target */
  tctx.save();
  tctx.globalAlpha=op;
  tctx.globalCompositeOperation='source-over';
  tctx.drawImage(dab, x-r, y-r);
  tctx.restore();
}

/* Stamp a stroke segment from (x0,y0) to (x1,y1), interpolating dabs at
   spacing of ~25% brush size for a continuous painted line. */
function paintCloneSegment(x0,y0,x1,y1,sz,hd,op){
  var spacing=Math.max(1, sz*0.25);
  var dx=x1-x0, dy=y1-y0;
  var dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<0.01){paintCloneStamp(x1,y1,sz,hd,op);return;}
  var steps=Math.max(1, Math.ceil((dist+cloneSpaced)/spacing));
  var firstT=Math.max(0, (spacing-cloneSpaced)/dist);
  for(var i=0;i<steps;i++){
    var t=firstT + i*(spacing/dist);
    if(t>1)break;
    paintCloneStamp(x0+dx*t, y0+dy*t, sz, hd, op);
  }
  cloneSpaced=(cloneSpaced+dist)%spacing;
}

/* Source crosshair overlay drawn on av canvas */
function drawCloneSrcMarker(x,y,sz){
  if(!actx)return;
  actx.clearRect(0,0,av.width,av.height);
  if(x===null||y===null)return;
  actx.save();
  actx.lineWidth=1.5;
  actx.strokeStyle='rgba(64,200,160,0.95)';
  actx.beginPath();actx.arc(x,y,Math.max(6,sz/2),0,Math.PI*2);actx.stroke();
  /* crosshair */
  actx.strokeStyle='rgba(64,200,160,0.85)';
  actx.beginPath();
  actx.moveTo(x-7,y);actx.lineTo(x+7,y);
  actx.moveTo(x,y-7);actx.lineTo(x,y+7);
  actx.stroke();
  /* small filled center dot */
  actx.fillStyle='rgba(64,200,160,1)';
  actx.beginPath();actx.arc(x,y,1.5,0,Math.PI*2);actx.fill();
  actx.restore();
}
function clearCloneSrcMarker(){if(actx)actx.clearRect(0,0,av.width,av.height);}

/* Legacy entry retained for any external callers */
function paintClone(x,y,sz,op){
  if(cloneSrcX===null)return;
  paintCloneStamp(x,y,sz,(typeof brushHd==='number'?brushHd/100:0.7),op);
}

/* ── Smudge direction tracking ── */
var smudgeDX=0, smudgeDY=0;

/* ── Eraser -- operates on engine canvas where art lives ── */
function paintEraser(x,y,pts2,sz,hd,op){
  var tctx=window._getActiveLayerCtx?window._getActiveLayerCtx():ctx;
  tctx.save();
  tctx.globalCompositeOperation='destination-out';
  applyBrushStroke(tctx,pts2,'round_soft','#000000',sz,hd,op);
  tctx.restore();
}

/* ── Gradient ── */
function commitGradient(x0g,y0g,x1g,y1g){ if(window._ps_gradient_commit){window._ps_gradient_commit(x0g,y0g,x1g,y1g);}else{/* fallback */var ctx=window._getActiveLayerCtx?window._getActiveLayerCtx():dctx;ctx.save();var g=ctx.createLinearGradient(x0g,y0g,x1g,y1g);g.addColorStop(0,drawCol);g.addColorStop(1,bgCol||'#000');ctx.fillStyle=g;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();if(window._layersCompositeFn)window._layersCompositeFn();}}

/* ── Extend CLICK handler ── */
document.addEventListener('click',function(e){
  if(!curTool||!onCanvas(e))return;
  var pos=getCanvasPos(e);if(!pos)return;
  if(curTool==='eyedropper'){pickColour(pos[0],pos[1]);return;}
  if(curTool==='clone'&&e.altKey){
    cloneSrcX=pos[0];cloneSrcY=pos[1];cloneOffX=0;cloneOffY=0;
    setI('Clone source set: '+Math.round(pos[0])+', '+Math.round(pos[1]));return;
  }
},{capture:false});

/* ── Alt+click for clone source ── */
document.addEventListener('mousedown',function(e){
  if(curTool==='clone'&&e.altKey&&onCanvas(e)){
    e.preventDefault();e.stopPropagation();
    var pos=getCanvasPos(e);if(!pos)return;
    cloneSrcX=pos[0];cloneSrcY=pos[1];
    cloneAnchorX=pos[0];cloneAnchorY=pos[1];
    cloneOffX=0;cloneOffY=0;
    cloneStrokeStarted=false;
    drawCloneSrcMarker(pos[0],pos[1],brushSz);
    setI('Clone source: '+Math.round(pos[0])+', '+Math.round(pos[1])+(cloneAligned?'  (Aligned)':'  (Non-aligned)'));return;
  }
  /* Gradient start */
  if(curTool==='gradient'&&onCanvas(e)&&!e.altKey){
    e.preventDefault();
    var pos2=getCanvasPos(e);if(!pos2)return;
    saveU();saveSnap();
    isDown=true;lastX=pos2[0];lastY=pos2[1];pts=[[pos2[0],pos2[1]]];
    gradStartX=pos2[0];gradStartY=pos2[1];
    return;
  }
  /* Pixel tools -- start stroke */
  var pixTools=['eraser','dodge','burn','blur','sharpen','smudge','sponge','clone','heal','texturemap'];
  if(pixTools.indexOf(curTool)>=0&&onCanvas(e)&&!e.altKey){
    e.preventDefault();
    var pos3=getCanvasPos(e);if(!pos3)return;
    saveU();saveSnap();
    isDown=true;lastX=pos3[0];lastY=pos3[1];pts=[[pos3[0],pos3[1]]];
    smudgeDX=0;smudgeDY=0;
    if(curTool==='clone'&&cloneSrcX!==null){
      /* On stroke start: lock the source-to-cursor offset.
         Aligned mode keeps the offset persistent across strokes (Photoshop default).
         Non-aligned resets to the original anchor on every stroke. */
      if(!cloneAligned||!cloneStrokeStarted){
        cloneOffX = pos3[0] - (cloneAnchorX!=null?cloneAnchorX:cloneSrcX);
        cloneOffY = pos3[1] - (cloneAnchorY!=null?cloneAnchorY:cloneSrcY);
      }
      cloneStrokeStarted=true;
      cloneSpaced=0;
      cloneSnap=buildCloneSnapshot();
      /* First dab + initial source marker */
      var hd0=(typeof brushHd==='number'?brushHd/100:0.7);
      paintCloneStamp(pos3[0],pos3[1],brushSz,hd0,brushOp);
      drawCloneSrcMarker(pos3[0]-cloneOffX, pos3[1]-cloneOffY, brushSz);
      if(window._layersCompositeFn)window._layersCompositeFn();
    }
  }
},{capture:true,passive:false});

/* ── mousemove for new tools ── */
document.addEventListener('mousemove',function(e){
  if(!isDown)return;
  var pos=getCanvasPos(e);if(!pos)return;
  var x=pos[0],y=pos[1];
  smudgeDX=x-lastX;smudgeDY=y-lastY;

  var pixTools=['dodge','burn','blur','sharpen','smudge','sponge','heal'];
  if(pixTools.indexOf(curTool)>=0){
    applyPixelOp(curTool,x,y,brushSz,toolStrength);
    if(window._layersCompositeFn)window._layersCompositeFn();
    lastX=x;lastY=y;return;
  }
  if(curTool==='eraser'){
    pts.push([x,y]);
    restSnap();
    paintEraser(x,y,pts,brushSz,brushHd,brushOp);
    if(window._layersCompositeFn)window._layersCompositeFn();
    lastX=x;lastY=y;return;
  }
  if(curTool==='clone'){
    pts.push([x,y]);
    var hd1=(typeof brushHd==='number'?brushHd/100:0.7);
    paintCloneSegment(lastX,lastY,x,y,brushSz,hd1,brushOp);
    drawCloneSrcMarker(x-cloneOffX, y-cloneOffY, brushSz);
    if(window._layersCompositeFn)window._layersCompositeFn();
    lastX=x;lastY=y;return;
  }
  if(curTool==='texturemap'){
    pts.push([x,y]);
    restSnap();
    for(var ti=0;ti<pts.length;ti++){
      paintTextureStamp(pts[ti][0],pts[ti][1],brushSz,brushOp);
    }
    if(window._layersCompositeFn)window._layersCompositeFn();
    lastX=x;lastY=y;return;
  }
  if(curTool==='gradient'&&gradStartX!==null){
    restSnap();
    /* Shift = snap to 45deg increments */
    var gex=x,gey=y;
    if(e&&e.shiftKey){
      var gdx=x-gradStartX,gdy=y-gradStartY;
      var ga=Math.round(Math.atan2(gdy,gdx)/(Math.PI/4))*(Math.PI/4);
      var gl=Math.sqrt(gdx*gdx+gdy*gdy);
      gex=gradStartX+Math.cos(ga)*gl;gey=gradStartY+Math.sin(ga)*gl;
    }
    dctx.save();
    dctx.strokeStyle='rgba(255,255,255,0.75)';dctx.lineWidth=1.5;
    dctx.setLineDash([6,3]);
    dctx.beginPath();dctx.moveTo(gradStartX,gradStartY);dctx.lineTo(gex,gey);dctx.stroke();
    /* Start dot */
    dctx.setLineDash([]);
    dctx.beginPath();dctx.arc(gradStartX,gradStartY,5,0,Math.PI*2);
    dctx.strokeStyle='rgba(255,255,255,0.9)';dctx.lineWidth=1.5;dctx.stroke();
    /* End arrow */
    dctx.beginPath();dctx.arc(gex,gey,4,0,Math.PI*2);dctx.stroke();
    dctx.restore();
    lastX=gex;lastY=gey;return;
  }
},{capture:false,passive:true});

/* ── mouseup for new tools ── */
document.addEventListener('mouseup',function(e){
  if(!isDown)return;
  var pos=getCanvasPos(e);
  var x=pos?pos[0]:lastX, y=pos?pos[1]:lastY;

  var pixTools=['dodge','burn','blur','sharpen','smudge','sponge','heal'];
  if(pixTools.indexOf(curTool)>=0){
    isDown=false;pts=[];snap=null;
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();return;
  }
  if(curTool==='eraser'||curTool==='clone'||curTool==='texturemap'){
    isDown=false;pts=[];snap=null;
    if(curTool==='clone'){cloneSnap=null;clearCloneSrcMarker();}
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();return;
  }
  if(curTool==='gradient'&&gradStartX!==null){
    isDown=false;
    commitGradient(gradStartX,gradStartY,x,y);
    gradStartX=null;gradStartY=null;
    pts=[];snap=null;
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();return;
  }
},{capture:false});

/* ── Extend tool panel -- add Strength slider and Gradient/Eraser controls ── */
(function(){
  var dtBody=document.getElementById('dt-body');if(!dtBody)return;
  var extra=document.createElement('div');extra.innerHTML=
    '<div class="pm" id="strength-pm" style="display:none"><div class="pr"><span class="pn">Strength</span><span class="pv" id="strv">50%</span></div>'
    +'<input type="range" id="strr" min="1" max="100" value="50"></div>'
    +'<div class="pm" id="sponge-pm" style="display:none"><div class="pr"><span class="pn">Sponge</span></div>'
    +'<select id="sponge-sel"><option value="sat">Saturate</option><option value="desat">Desaturate</option></select></div>'
    +'<div id="grad-pm" style="display:none;padding:0;">'
    +'<div style="font-size:8px;letter-spacing:.12em;color:#E8F50A;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid var(--brd);padding-bottom:5px;">Gradient</div>'
    /* Live preview bar -- click to open editor */
    +'<canvas id="grad-preview" width="240" height="26" style="width:100%;height:26px;cursor:pointer;border:1px solid var(--brd);display:block;margin-bottom:6px;" title="Click to open Gradient Editor"></canvas>'
    /* Type buttons row */
    +'<div class="pm"><div class="pr"><span class="pn">Type</span></div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-bottom:7px;">'
    +'<button class="grad-type-btn active" data-gt="linear" title="Linear gradient -- drag direction">&#10230; Lin</button>'
    +'<button class="grad-type-btn" data-gt="radial" title="Radial gradient -- drag radius">&#9711; Rad</button>'
    +'<button class="grad-type-btn" data-gt="angle" title="Angle sweep -- drag sets start angle">&#8635; Ang</button>'
    +'<button class="grad-type-btn" data-gt="reflected" title="Reflected -- symmetric from drag start">&#8596; Ref</button>'
    +'<button class="grad-type-btn" data-gt="diamond" title="Diamond distance from drag start">&#9671; Dia</button>'
    +'</div>'
    /* Stop colour + position */
    +'<div class="pm"><div class="pr"><span class="pn">Stop colour</span><span class="pv" id="gstop-col-hex">#000000</span></div>'
    +'<div style="display:flex;gap:5px;align-items:center;margin-top:3px;">'
    +'<input type="color" id="gstop-col-inline" value="#000000" style="width:32px;height:22px;cursor:pointer;border:1px solid var(--brd);background:none;flex-shrink:0;">'
    +'<input type="range" id="gstop-pos-inline" min="0" max="100" value="0" style="flex:1;">'
    +'<span id="gstop-pos-inline-v" style="font-size:8px;color:var(--dim);min-width:28px;">0%</span>'
    +'</div></div>'
    /* Stop opacity */
    +'<div class="pm"><div class="pr"><span class="pn">Stop opacity</span><span class="pv" id="gstop-op-inline-v">100%</span></div>'
    +'<input type="range" id="gstop-op-inline" min="0" max="100" value="100"></div>'
    /* Add / delete stop */
    +'<div style="display:flex;gap:4px;margin-bottom:5px;">'
    +'<button id="gstop-add-btn" style="flex:1;padding:3px 0;background:none;border:1px solid var(--brd);color:var(--dim);font-size:8px;cursor:pointer;letter-spacing:.06em;">+ Add Stop</button>'
    +'<button id="gstop-del-btn" style="flex:1;padding:3px 0;background:none;border:1px solid #2a0a0a;color:#ff6060;font-size:8px;cursor:pointer;letter-spacing:.06em;">&#10005; Del Stop</button>'
    +'<button id="gstop-prev-btn" style="padding:3px 6px;background:none;border:1px solid var(--brd);color:var(--dim);font-size:9px;cursor:pointer;" title="Select previous stop">&#8592;</button>'
    +'<button id="gstop-next-btn" style="padding:3px 6px;background:none;border:1px solid var(--brd);color:var(--dim);font-size:9px;cursor:pointer;" title="Select next stop">&#8594;</button>'
    +'</div>'
    /* Reverse + Opacity */
    +'<div class="pm"><div class="pr"><span class="pn">Overall opacity</span><span class="pv" id="grad-op-v">100%</span></div>'
    +'<input type="range" id="grad-op" min="1" max="100" value="100"></div>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">'
    +'<label style="font-size:8px;color:var(--dim);display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="grad-reverse"> Reverse</label>'
    +'</div>'
    +'</div>'
    +'<div id="clone-info" style="display:none;padding:6px 0;border-top:1px solid var(--brd);margin-top:4px;">'
    +'<div style="font-size:8px;letter-spacing:.12em;color:#40c8a0;text-transform:uppercase;margin-bottom:5px;">Clone Stamp</div>'
    +'<div style="font-size:8px;color:var(--dim);line-height:1.6;margin-bottom:6px;">'
    +'<b style="color:#40c8a0;">Alt+click</b> to set source &middot; drag to paint<br>'
    +'Honors <b>Size</b>, <b>Hardness</b>, <b>Opacity</b>'
    +'</div>'
    +'<label style="font-size:8px;color:var(--dim);display:flex;align-items:center;gap:5px;cursor:pointer;">'
    +'<input type="checkbox" id="clone-aligned" checked> Aligned (locked source offset)</label>'
    +'</div>'
    +'<div id="tex-pm" style="display:none;padding:6px 0;">'
    +'<div style="font-size:8px;letter-spacing:.12em;color:#E8F50A;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid var(--brd);padding-bottom:5px;">Texture Map</div>'
    +'<div class="pm"><div class="pr"><span class="pn">Type</span></div>'
    +'<select id="tex-type">'
    +'<option value="noise">Noise / Grain</option>'
    +'<option value="crosshatch">Crosshatch</option>'
    +'<option value="weave">Weave</option>'
    +'<option value="hexgrid">Hex Grid</option>'
    +'<option value="dotmatrix">Dot Matrix</option>'
    +'<option value="woodgrain">Wood Grain</option>'
    +'<option value="brick">Brick</option>'
    +'<option value="wavelines">Wave Lines</option>'
    +'<option value="circuit">Circuit Board</option>'
    +'<option value="lace">Lace / Filigree</option>'
    +'</select></div>'
    +'<div class="pm"><div class="pr"><span class="pn">Scale</span><span class="pv" id="tex-scale-v">50%</span></div>'
    +'<input type="range" id="tex-scale" min="10" max="100" value="50"></div>'
    +'</div>';

  /* Insert before the button row */
  var btnRow=dtBody.querySelector('.br');
  if(btnRow)dtBody.insertBefore(extra,btnRow);
  else dtBody.appendChild(extra);

  /* Wire strength slider */
  var strr=document.getElementById('strr');
  var strv=document.getElementById('strv');
  if(strr)strr.addEventListener('input',function(){toolStrength=parseInt(strr.value)/100;if(strv)strv.textContent=strr.value+'%';});

  /* Wire clone Aligned checkbox */
  var caEl=document.getElementById('clone-aligned');
  if(caEl)caEl.addEventListener('change',function(){
    cloneAligned=caEl.checked;
    cloneStrokeStarted=false; // force re-anchor on next stroke
  });

  /* Wire sponge mode */
  var spSel=document.getElementById('sponge-sel');
  if(spSel)spSel.addEventListener('change',function(){spongeSaturate=spSel.value==='sat';});

  /* Wire gradient type */
  var grSel=document.getElementById('grad-sel');
  if(grSel)grSel.addEventListener('change',function(){gradientType=grSel.value;});

  /* Show/hide contextual controls based on active tool */
  var origSetTool=setTool;

  /* ── Tool info popup data ── */
  var TOOL_INFO={
    eraser:{
      name:'Eraser',icon:'\u2298',key:'E',
      desc:'Removes pixels from the canvas with a soft or hard brush edge. Works like painting with transparency.',
      usage:'Click and drag on the canvas to erase. Use Size, Opacity, and Hardness sliders to control the eraser.',
      controls:['Size \u2014 controls eraser diameter','Opacity \u2014 partial erase at lower values','Hardness \u2014 soft feathered edge (0%) to crisp edge (100%)']
    },
    eyedropper:{
      name:'Eyedropper',icon:'\u25C6',key:'I',
      desc:'Samples a colour from any visible pixel on the canvas and sets it as the active foreground colour.',
      usage:'Click anywhere on the canvas to pick up that pixel\'s colour. The foreground swatch updates instantly.',
      controls:['No additional controls \u2014 just click to sample']
    },
    clone:{
      name:'Clone Stamp',icon:'\u2299',key:'S',
      desc:'Copies pixels from a source area to a target area, letting you duplicate or repair regions of the image.',
      usage:'Hold Alt and click to set the source point. Then paint normally \u2014 pixels from the source offset are stamped at the brush.',
      controls:['Alt+Click \u2014 set clone source','Size \u2014 stamp diameter','Opacity \u2014 blend strength']
    },
    heal:{
      name:'Healing Brush',icon:'\u2295',key:'J',
      desc:'Blends surrounding pixel colours into the area under the brush, smoothing out blemishes and artefacts.',
      usage:'Click and drag over areas you want to smooth. The tool averages a 9x9 neighbourhood to blend seamlessly.',
      controls:['Strength \u2014 how aggressively to blend (use slider below)','Size \u2014 brush area']
    },
    dodge:{
      name:'Dodge',icon:'\u2600',key:'O',
      desc:'Lightens pixels under the brush, pushing colours toward white. Named after the darkroom technique of "dodging" light.',
      usage:'Click and drag over areas to lighten. Multiple passes increase the effect. Works best at lower strength.',
      controls:['Strength \u2014 lightening intensity (use slider below)','Size \u2014 brush area']
    },
    burn:{
      name:'Burn',icon:'\u25CF',key:'X',
      desc:'Darkens pixels under the brush, pushing colours toward black. The opposite of Dodge.',
      usage:'Click and drag over areas to darken. Build up effect with multiple passes.',
      controls:['Strength \u2014 darkening intensity (use slider below)','Size \u2014 brush area']
    },
    blur:{
      name:'Blur',icon:'\u25CC',key:'U',
      desc:'Softens detail by averaging nearby pixels with a 5x5 kernel. Reduces noise and hard edges.',
      usage:'Click and drag over areas to soften. Repeat passes for stronger blur.',
      controls:['Strength \u2014 blend amount per pass (use slider below)','Size \u2014 brush area']
    },
    sharpen:{
      name:'Sharpen',icon:'\u25C8',key:'H',
      desc:'Increases local contrast, making edges and details more pronounced. Pushes pixel values away from mid-grey.',
      usage:'Click and drag over areas to sharpen. Use sparingly \u2014 over-sharpening creates artefacts.',
      controls:['Strength \u2014 contrast boost intensity (use slider below)','Size \u2014 brush area']
    },
    smudge:{
      name:'Smudge',icon:'\u3030',key:'M',
      desc:'Pushes and smears pixels in the direction you drag, like dragging a finger through wet paint.',
      usage:'Click and drag \u2014 pixels flow in the direction of movement. Slow strokes smear more.',
      controls:['Strength \u2014 how far pixels smear (use slider below)','Size \u2014 brush area']
    },
    sponge:{
      name:'Sponge',icon:'\u25CE',key:'Z',
      desc:'Adjusts colour saturation under the brush. Saturate mode intensifies colour; Desaturate mode removes it toward grey.',
      usage:'Click and drag to adjust saturation. Toggle mode with the dropdown below.',
      controls:['Strength \u2014 saturation change amount (use slider below)','Sponge mode \u2014 Saturate or Desaturate (dropdown below)','Size \u2014 brush area']
    },
    texturemap:{
      name:'Texture Map',icon:'\u25A9',key:'W',
      desc:'Stamps procedural texture patterns onto the canvas through a soft-edged circular brush. Choose from 10 texture types.',
      usage:'Select a texture type from the dropdown, then click and drag on the canvas. Stamps accumulate along the stroke path.',
      controls:['Texture Type \u2014 select pattern (dropdown below)','Size \u2014 brush/stamp diameter','Opacity \u2014 stamp transparency']
    },
    humanize:{
      name:'Humanize',icon:'\u270B',key:'Q',
      desc:'Global filter that adds organic imperfections \u2014 wobble, pressure variation, edge roughening, ink pooling, colour drift \u2014 making generative art look hand-drawn.',
      usage:'Adjust the Amount slider or individual sub-sliders, then click Apply to bake the effect into the canvas. Fully undoable.',
      controls:['Amount \u2014 master intensity for all passes','Wobble \u2014 micro-displacement via Perlin noise','Pressure \u2014 edge opacity variation','Edge Rough \u2014 jaggedness at colour boundaries','Ink Pool \u2014 darkening at intersections','Colour Drift \u2014 hue/sat variation across canvas','Paper Texture \u2014 surface grain overlay']
    },
    curves:{
      name:'Curves',icon:'\u25E0',key:'V',
      desc:'Photoshop-style curves adjustment. Drag control points on the curve to remap tonal values per channel (RGB, Red, Green, Blue).',
      usage:'Click on the curve to add control points. Drag points to reshape the curve. Select channel from dropdown. Click Apply to commit.',
      controls:['Channel \u2014 RGB (all), Red, Green, Blue','Click curve to add points','Drag points to adjust','Double-click point to remove','Reset restores linear curve']
    }
  };

  /* ── Build info popup DOM ── */
  var tipPanel=document.createElement('div');
  tipPanel.id='ps-tool-info';
  tipPanel.style.cssText=[
    'display:none','position:fixed','z-index:610',
    'width:240px','background:rgba(8,8,18,0.96)',
    'border:1px solid rgba(151,195,176,0.3)','border-radius:6px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.7)',
    'font-family:inherit','overflow:hidden','pointer-events:auto'
  ].join(';')+';';
  tipPanel.innerHTML=[
    '<div id="pti-head" style="padding:10px 14px;border-bottom:1px solid rgba(151,195,176,0.1);',
    '  background:rgba(151,195,176,0.04);cursor:grab;user-select:none;display:flex;align-items:center;gap:8px;">',
    '  <span id="pti-icon" style="font-size:16px;color:#97c3b0;"></span>',
    '  <div style="flex:1;">',
    '    <div id="pti-name" style="font-size:10px;font-weight:700;color:#97c3b0;letter-spacing:.16em;text-transform:uppercase;line-height:1.5;"></div>',
    '    <div id="pti-key" style="font-size:8px;color:rgba(255,255,255,0.35);line-height:1.4;"></div>',
    '  </div>',
    '  <button id="pti-close" style="background:none;border:1px solid rgba(255,255,255,0.15);color:#888;font-size:9px;',
    '    padding:3px 8px;cursor:pointer;border-radius:3px;font-family:inherit;line-height:1.4;">Close</button>',
    '</div>',
    '<div id="pti-body" style="padding:12px 14px;">',
    '  <div id="pti-desc" style="font-size:9px;color:rgba(255,255,255,0.6);line-height:1.7;margin-bottom:10px;"></div>',
    '  <div style="font-size:8px;color:#97c3b0;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;line-height:1.5;">How to use</div>',
    '  <div id="pti-usage" style="font-size:9px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:10px;',
    '    padding:6px 8px;background:rgba(151,195,176,0.04);border-radius:3px;border:1px solid rgba(151,195,176,0.06);"></div>',
    '  <div style="font-size:8px;color:#97c3b0;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;line-height:1.5;">Controls</div>',
    '  <div id="pti-controls" style="font-size:9px;color:rgba(255,255,255,0.45);line-height:1.8;"></div>',
    '</div>'
  ].join('\n');
  document.body.appendChild(tipPanel);

  /* ── Drag the info popup ── */
  var _ptiDrag=null,_ptiPos=null,_ptiClosed={};
  var ptiHead=document.getElementById('pti-head');
  ptiHead.addEventListener('mousedown',function(e){
    if(e.target.id==='pti-close')return;
    e.preventDefault();ptiHead.style.cursor='grabbing';
    var r2=tipPanel.getBoundingClientRect();
    _ptiDrag={sx:e.clientX,sy:e.clientY,ol:r2.left,ot:r2.top};
    function mv(ev){
      if(!_ptiDrag)return;
      var nl=Math.max(0,_ptiDrag.ol+(ev.clientX-_ptiDrag.sx));
      var nt=Math.max(0,_ptiDrag.ot+(ev.clientY-_ptiDrag.sy));
      tipPanel.style.left=nl+'px';tipPanel.style.top=nt+'px';
      _ptiPos={left:nl,top:nt};
    }
    function up(){_ptiDrag=null;ptiHead.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });

  /* ── Close button ── */
  document.getElementById('pti-close').addEventListener('click',function(e){
    e.stopPropagation();
    tipPanel.style.display='none';
    if(curTool)_ptiClosed[curTool]=true;
  });

  /* ── Show/hide info popup on tool change ── */
  function showToolInfo(t){
    var info=TOOL_INFO[t];
    if(!info){tipPanel.style.display='none';return;}
    if(_ptiClosed[t]){tipPanel.style.display='none';return;}
    document.getElementById('pti-icon').textContent=info.icon;
    document.getElementById('pti-name').textContent=info.name;
    document.getElementById('pti-key').textContent='Shortcut: '+info.key;
    document.getElementById('pti-desc').textContent=info.desc;
    document.getElementById('pti-usage').textContent=info.usage;
    document.getElementById('pti-controls').innerHTML=info.controls.map(function(c){return '\u2022 '+c;}).join('<br>');
    /* Position */
    if(_ptiPos){
      tipPanel.style.left=_ptiPos.left+'px';tipPanel.style.top=_ptiPos.top+'px';
    } else {
      var tb2=document.getElementById('tb');
      if(tb2){var r3=tb2.getBoundingClientRect();
        tipPanel.style.left=(r3.right+8)+'px';
        tipPanel.style.top=Math.max(10,r3.top+r3.height/2-120)+'px';
      }
    }
    tipPanel.style.display='block';
  }

  setTool=function(t){
    origSetTool(t);
    var strengthTools=['dodge','burn','blur','sharpen','smudge','sponge','heal'];
    var el=document.getElementById('strength-pm');if(el)el.style.display=strengthTools.indexOf(t)>=0?'':'none';
    var sp=document.getElementById('sponge-pm');if(sp)sp.style.display=t==='sponge'?'':'none';
    var gr=document.getElementById('grad-pm');if(gr)gr.style.display=t==='gradient'?'':'none';
    var tx=document.getElementById('tex-pm');if(tx)tx.style.display=t==='texturemap'?'':'none';
    var ci=document.getElementById('clone-info');if(ci)ci.style.display=t==='clone'?'':'none';
    /* Show tool info popup */
    showToolInfo(t);
    /* Notify external IIFEs (gradient engine, etc.) of tool change */
    if(typeof window.setTool_ps==='function')window.setTool_ps(t);
  };

  /* Add new toolbar buttons after shape group */
  var tb=document.getElementById('tb');if(!tb)return;
  var sep=document.createElement('div');sep.className='tsep';
  var tools=[
    ['eraser','Eraser','E-key','Erase with soft brush edge'],
    ['eyedropper','Eyedropper','I','Click to sample any colour'],
    ['clone','Clone Stamp','S','Alt+click to set source, then paint'],
    ['heal','Healing Brush','J','Blend-corrects texture seamlessly'],
    ['dodge','Dodge','O','Lighten pixels under brush'],
    ['burn','Burn','X','Darken pixels under brush'],
    ['blur','Blur','U','Soften detail under brush'],
    ['sharpen','Sharpen','H','Increase local contrast'],
    ['smudge','Smudge','M','Push and smear pixels'],
    ['sponge','Sponge','Z','Saturate or desaturate colour'],
    ['gradient','Gradient','G','Drag to fill gradient'],
    ['texturemap','Texture Map','W','Stamp procedural textures with brush'],
    ['humanize','Humanize','Q','Make art look hand-drawn with organic imperfections'],
    ['curves','Curves','V','Photoshop-style curves adjustment'],
  ];
  /* Find shape button to insert after */
  var shapeBtns=tb.querySelectorAll('[data-t="shape"],[data-t="polygon"]');
  var insertAfter=shapeBtns.length?shapeBtns[shapeBtns.length-1]:null;
  if(!insertAfter)return;

  var beforeAI=tb.querySelector('.tsep.ai');

  var icons={'eraser':'\u2298','eyedropper':'\u25C6','clone':'\u2299','heal':'\u2295','dodge':'\u2600','burn':'\u25CF',
             'blur':'\u25CC','sharpen':'\u25C8','smudge':'\u3030','sponge':'\u25CE','gradient':'\u25A6','texturemap':'\u25A9','humanize':'\u270B','curves':'\u25E0'};

  /* Insert separator then new tool buttons before AI separator */
  var frag=document.createDocumentFragment();
  var sep2=document.createElement('div');sep2.className='tsep';frag.appendChild(sep2);
  tools.forEach(function(t){
    var btn=document.createElement('button');
    btn.className='tbtn';btn.dataset.t=t[0];
    btn.setAttribute('data-tip-name',t[1]);btn.setAttribute('data-tip-key',t[2]);btn.setAttribute('data-tip-desc',t[3]);
    if(t[0]==='gradient'){
      /* Spectrum gradient icon */
      var gIcon=document.createElement('span');
      gIcon.style.cssText='display:inline-block;width:16px;height:16px;border-radius:2px;border:1px solid rgba(255,255,255,0.2);background:linear-gradient(135deg,#ff0000,#ff8800 17%,#ffff00 33%,#00cc00 50%,#0088ff 67%,#8800cc 83%,#ff0088);';
      btn.appendChild(gIcon);
    } else if(t[0]==='texturemap'){
      /* Hex grid texture icon */
      var hIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');
      hIcon.setAttribute('viewBox','0 0 18 18');
      hIcon.setAttribute('width','16');hIcon.setAttribute('height','16');
      hIcon.style.cssText='display:inline-block;vertical-align:middle;';
      var hexPath='';
      var hr=3.2,hx,hy;
      var cols=[[3,3],[9,3],[15,3],[0,7.5],[6,7.5],[12,7.5],[18,7.5],[3,12],[9,12],[15,12],[0,16.5],[6,16.5],[12,16.5],[18,16.5]];
      cols.forEach(function(c){
        hx=c[0];hy=c[1];
        var hp='';
        for(var v=0;v<6;v++){
          var a=Math.PI/6+v*Math.PI/3;
          var px=(hx+Math.cos(a)*hr).toFixed(1);
          var py=(hy+Math.sin(a)*hr).toFixed(1);
          hp+=(v===0?'M':'L')+px+','+py;
        }
        hexPath+=hp+'Z ';
      });
      hIcon.innerHTML='<path d="'+hexPath+'" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.8"/>';
      btn.appendChild(hIcon);
    } else if(t[0]==='humanize'){
      /* Cave-painting hand print icon -- max size */
      var handSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      handSvg.setAttribute('viewBox','2.5 4.5 14 17');
      handSvg.setAttribute('width','28');handSvg.setAttribute('height','26');
      handSvg.style.cssText='display:block;position:absolute;inset:0;';
      handSvg.innerHTML='<path d="M7 21c-2.2-.5-3.5-2-3.8-4.2l-.4-3c-.1-.6.3-1 .8-.9.5.1.8.5.9 1l.5 2.2 .2-4c0-1 .2-2 .7-2.5.4-.3.9-.2 1.1.2.2.5.2 1.2.1 2l-.3 3.5.6-4.5c.2-1.2.5-2.5 1-3 .4-.4.9-.3 1.1.2.2.5.1 1.4-.1 2.5l-.7 4 1-4c.3-1 .6-2 1.1-2.5.4-.3.9-.2 1.1.2.2.5 0 1.3-.2 2.2l-1 3.8 1.5-2.8c.4-.7.9-1.3 1.4-1.4.5-.1.7.2.6.7-.1.6-.5 1.5-1 2.5l-2 3.5c-.7 1.2-1.5 2-2.5 2.5-1 .5-2.2.8-3.6.5z" fill="#f57c0a"/>';
      btn.appendChild(handSvg);
    } else if(t[0]==='curves'){
      /* Curves S-curve icon */
      var curveSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      curveSvg.setAttribute('viewBox','0 0 18 18');
      curveSvg.setAttribute('width','16');curveSvg.setAttribute('height','16');
      curveSvg.style.cssText='display:inline-block;vertical-align:middle;';
      curveSvg.innerHTML='<rect x="1" y="1" width="16" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.3"/>'
        +'<line x1="1" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="0.3" opacity="0.2"/>'
        +'<line x1="9" y1="1" x2="9" y2="17" stroke="currentColor" stroke-width="0.3" opacity="0.2"/>'
        +'<line x1="1" y1="17" x2="17" y2="1" stroke="currentColor" stroke-width="0.4" opacity="0.2" stroke-dasharray="1,1"/>'
        +'<path d="M2 16 Q5 15 7 10 Q9 5 12 3 Q15 1 16 1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
      btn.appendChild(curveSvg);
    } else {
      btn.textContent=icons[t[0]]||t[0][0].toUpperCase();
    }
    btn.onclick=function(){setTool(t[0]);};
    frag.appendChild(btn);
  });
  tb.insertBefore(frag,beforeAI||null);

  /* Wire tooltips for the newly injected buttons -- the global querySelectorAll
     ran at page load before these existed, so we wire them explicitly here */
  var tipEl=document.getElementById('tip-el');
  if(tipEl){
    tb.querySelectorAll('.tbtn[data-tip-name]').forEach(function(btn){
      if(btn._tipWired)return;
      btn._tipWired=true;
      btn.addEventListener('mouseenter',function(){
        var name=btn.dataset.tipName||'';
        var key=btn.dataset.tipKey||'';
        var desc=btn.dataset.tipDesc||'';
        var isFx=btn.classList.contains('fx');
        tipEl.className=isFx?'fx-tip':'';
        var nt=document.getElementById('tip-ntxt');if(nt)nt.textContent=name;
        var kt=document.getElementById('tip-key');if(kt)kt.textContent=key;
        var dt=document.getElementById('tip-desc');if(dt)dt.textContent=desc;
        tipEl.style.display='block';
        var br=btn.getBoundingClientRect();
        var tw=tipEl.offsetWidth;
        var th=tipEl.offsetHeight;
        tipEl.style.left=(br.left-tw-10)+'px';
        tipEl.style.top=Math.min(window.innerHeight-th-6,Math.max(6,br.top+br.height/2-th/2))+'px';
      });
      btn.addEventListener('mouseleave',function(){tipEl.style.display='none';});
    });
  }
})();
