/* ══════════════════════════════════════════════════════════
   TOPOLOGICAL 3D ENGINE — Mathematical topology shapes
   Renders Sphere, Torus, Möbius Band, Klein Bottle, and
   more using parametric 3D surface equations projected
   to 2D with lighting, wireframe, and palette integration.
   Includes built-in Object Mode for move/rotate/resize.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Shape definitions ── */
var SHAPES = [
  {id:'sphere',   name:'Sphere',       desc:'Simply connected surface — any loop can shrink to a point'},
  {id:'torus',    name:'Torus',        desc:'One-holed surface — topologically equivalent to a coffee mug'},
  {id:'mobius',   name:'Möbius Band',  desc:'Non-orientable, one-sided surface with a single edge'},
  {id:'klein',    name:'Klein Bottle', desc:'Non-orientable, no boundary — no inside or outside'},
  {id:'trefoil',  name:'Trefoil Knot', desc:'Simplest non-trivial knot — continuous closed curve in 3-space'},
  {id:'boy',      name:'Boy Surface',  desc:'Non-orientable surface immersed in 3D — related to the projective plane'},
  {id:'dini',     name:'Dini Surface', desc:'Twisted pseudospherical surface of constant negative curvature'},
  {id:'crosscap', name:'Cross-Cap',    desc:'Self-intersecting surface — projective plane immersed in 3D'}
];

/* ── State ── */
var T = {
  shapeIdx: 0,
  cycleIdx: -1,
  rotX: 0.4,
  rotY: 0.6,
  rotZ: 0.0
};

/* ══════════════════════════════════════════════════════════
   OBJECT MODE STATE
   ══════════════════════════════════════════════════════════ */
var OBJ = {
  active: false,      /* object mode toggle */
  img: null,          /* offscreen canvas with rendered shape */
  x: 0, y: 0,        /* position (top-left of bbox) */
  w: 0, h: 0,        /* dimensions */
  angle: 0,           /* rotation in radians */
  scaleF: 1,          /* cumulative scale */
  dragging: null,     /* null | 'move' | 'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w' | 'rot' */
  startX: 0, startY: 0,
  startOX: 0, startOY: 0,
  startW: 0, startH: 0,
  startAngle: 0,
  overlay: null,      /* overlay canvas element */
  octx: null          /* overlay 2d context */
};

var HSIZE = 6;  /* handle square half-size */
var ROT_DIST = 30; /* rotation handle distance above top */

/* ── Simple seeded PRNG ── */
function makePRNG(s){
  var v=s|0||1;
  return function(){v=v*1664525+1013904223|0;return(v>>>0)/4294967296;};
}

/* ── Hex to RGB ── */
function hRGB(hex){
  var h=hex.replace('#','');
  return [parseInt(h.substring(0,2),16),parseInt(h.substring(2,4),16),parseInt(h.substring(4,6),16)];
}

/* ── Get palette colors ── */
function palCols(){
  var p=typeof gpal==='function'?gpal():null;
  if(p&&p.c&&p.c.length) return p.c;
  return ['#ff6040','#ffb060','#40c8ff','#a080ff','#60ffa0'];
}

/* ── Slider value reader ── */
function sv(id){
  var el=document.getElementById(id);
  return el?parseFloat(el.value):50;
}

/* ── 3D math helpers ── */
function rotateX(p,a){var c=Math.cos(a),s=Math.sin(a);return[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c];}
function rotateY(p,a){var c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c];}
function rotateZ(p,a){var c=Math.cos(a),s=Math.sin(a);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2]];}
function normalize(v){var l=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);return l>0?[v[0]/l,v[1]/l,v[2]/l]:[0,0,1];}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot3(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}

/* ══════════════════════════════════════════════════════════
   PARAMETRIC SURFACE GENERATORS
   ══════════════════════════════════════════════════════════ */

function spherePoint(u,v,params){
  var r=params.scale||1;
  var def=params.deform||0;
  var rd=r+def*0.3*Math.sin(5*u)*Math.sin(3*v)+def*0.15*Math.sin(8*u+2*v);
  return[rd*Math.sin(u)*Math.cos(v),rd*Math.sin(u)*Math.sin(v),rd*Math.cos(u)];
}

function torusPoint(u,v,params){
  var R=params.scale||1,r=params.tube||0.4,twist=params.twist||0,vt=v+twist*u;
  return[(R+r*Math.cos(vt))*Math.cos(u),(R+r*Math.cos(vt))*Math.sin(u),r*Math.sin(vt)];
}

function mobiusPoint(u,v,params){
  var w=params.width||0.5,scale=params.scale||1;
  var twist=1+Math.floor((params.twist||0)*3);
  var t=v*w-w/2;
  return[scale*(1+t*Math.cos(twist*u/2))*Math.cos(u),scale*(1+t*Math.cos(twist*u/2))*Math.sin(u),scale*t*Math.sin(twist*u/2)];
}

function kleinPoint(u,v,params){
  var sc=params.scale||1,x,y,z;
  var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
  if(u<Math.PI){
    var R=4*(1-cu/2);
    x=6*cu*(1+su)+R*cu*cv;y=16*su+R*su*cv;z=R*sv;
  }else{
    var R=4*(1-cu/2);
    x=6*cu*(1+su)+R*Math.cos(v+Math.PI);y=16*su;z=R*sv;
  }
  var s=sc*0.06;
  return[x*s,y*s,z*s];
}

function trefoilPoint(u,v,params){
  var sc=params.scale||1,r=params.tube||0.3;
  var cu=Math.cos(u),su=Math.sin(u);
  var kx=su+2*Math.sin(2*u),ky=cu-2*Math.cos(2*u),kz=-Math.sin(3*u);
  var tx=Math.cos(u)+4*Math.cos(2*u),ty=-Math.sin(u)+4*Math.sin(2*u),tz=-3*Math.cos(3*u);
  var T2=normalize([tx,ty,tz]);
  var up=[0,0,1];
  var N=normalize(cross(T2,up));
  if(Math.abs(dot3(T2,up))>0.99) N=normalize(cross(T2,[1,0,0]));
  var B=cross(T2,N);
  return[sc*(kx+r*(N[0]*Math.cos(v)+B[0]*Math.sin(v))),sc*(ky+r*(N[1]*Math.cos(v)+B[1]*Math.sin(v))),sc*(kz+r*(N[2]*Math.cos(v)+B[2]*Math.sin(v)))];
}

function boyPoint(u,v,params){
  var sc=params.scale||1;
  var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
  var denom=2-Math.SQRT2*Math.sin(3*v)*Math.sin(2*u);
  var x=(Math.SQRT2*cu*cu*Math.cos(2*v)+cu*Math.sin(2*v))/(denom+0.001);
  var y=(Math.SQRT2*cu*cu*Math.sin(2*v)-cu*Math.cos(2*v))/(denom+0.001);
  var z=3*cu*cu/(denom+0.001);
  return[sc*x*0.6,sc*y*0.6,sc*(z-1.5)*0.6];
}

function diniPoint(u,v,params){
  var sc=params.scale||1,a=1,b=0.05+(params.twist||0.2)*0.4;
  var x=a*Math.cos(u)*Math.sin(v),y=a*Math.sin(u)*Math.sin(v);
  var z=a*(Math.cos(v)+Math.log(Math.tan(v/2+0.001)))+b*u;
  return[sc*x*0.5,sc*y*0.5,sc*z*0.08];
}

function crosscapPoint(u,v,params){
  var sc=params.scale||1;
  var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v),s2v=Math.sin(2*v);
  return[sc*0.7*(su*sv),sc*0.7*(su*s2v/2),sc*0.7*(cu*cu-cu*su*sv*sv)];
}

function getSurfacePoint(shape,u,v,params){
  switch(shape){
    case 'sphere':   return spherePoint(u,v,params);
    case 'torus':    return torusPoint(u,v,params);
    case 'mobius':   return mobiusPoint(u,v,params);
    case 'klein':    return kleinPoint(u,v,params);
    case 'trefoil':  return trefoilPoint(u,v,params);
    case 'boy':      return boyPoint(u,v,params);
    case 'dini':     return diniPoint(u,v,params);
    case 'crosscap': return crosscapPoint(u,v,params);
    default:         return spherePoint(u,v,params);
  }
}

function getUVRange(shape){
  var PI=Math.PI,TAU=PI*2;
  switch(shape){
    case 'sphere':   return {u0:0.05,u1:PI-0.05,v0:0,v1:TAU};
    case 'torus':    return {u0:0,u1:TAU,v0:0,v1:TAU};
    case 'mobius':   return {u0:0,u1:TAU,v0:0,v1:1};
    case 'klein':    return {u0:0,u1:TAU,v0:0,v1:TAU};
    case 'trefoil':  return {u0:0,u1:TAU,v0:0,v1:TAU};
    case 'boy':      return {u0:0,u1:PI,v0:0,v1:PI};
    case 'dini':     return {u0:0,u1:TAU*2,v0:0.15,v1:PI-0.15};
    case 'crosscap': return {u0:0,u1:TAU,v0:0,v1:PI};
    default:         return {u0:0,u1:TAU,v0:0,v1:TAU};
  }
}

/* ══════════════════════════════════════════════════════════
   CORE 3D RENDERER — renders to a target canvas context
   ══════════════════════════════════════════════════════════ */
function renderShape(tctx, W, H, clearBg){
  var cols=palCols();
  var shape=SHAPES[T.shapeIdx].id;

  var resolution = Math.round(sv('topo-resolution'));
  var zoom       = sv('topo-zoom')/50;
  var rotSpeed   = sv('topo-rotation')/100;
  var wireWeight = sv('topo-wireframe')/100;
  var deform     = sv('topo-deform')/100;
  var lighting   = sv('topo-lighting')/100;
  var twist      = sv('topo-twist')/100;
  var tube       = 0.15+sv('topo-tube')/200;

  T.rotX = 0.3+rotSpeed*1.2;
  T.rotY = 0.5+rotSpeed*0.8;
  T.rotZ = rotSpeed*0.3;

  var params = {scale:zoom, deform:deform, twist:twist, tube:tube, width:0.5+deform*0.3};
  var range = getUVRange(shape);
  var nu = resolution, nv = resolution;
  var points=[], normals=[], eps=0.001;

  for(var i=0;i<=nu;i++){
    points[i]=[];normals[i]=[];
    for(var j=0;j<=nv;j++){
      var u=range.u0+(range.u1-range.u0)*i/nu;
      var v=range.v0+(range.v1-range.v0)*j/nv;
      var pt=getSurfacePoint(shape,u,v,params);
      var pu=getSurfacePoint(shape,u+eps,v,params);
      var pv2=getSurfacePoint(shape,u,v+eps,params);
      var n=normalize(cross(sub(pu,pt),sub(pv2,pt)));
      pt=rotateX(pt,T.rotX);pt=rotateY(pt,T.rotY);pt=rotateZ(pt,T.rotZ);
      n=rotateX(n,T.rotX);n=rotateY(n,T.rotY);n=rotateZ(n,T.rotZ);
      points[i][j]=pt;normals[i][j]=n;
    }
  }

  tctx.save();
  if(clearBg){
    tctx.clearRect(0,0,W,H);
    var bgGrad=tctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
    var bgCol=hRGB(cols[cols.length-1]);
    bgGrad.addColorStop(0,'rgba('+Math.round(bgCol[0]*0.15)+','+Math.round(bgCol[1]*0.15)+','+Math.round(bgCol[2]*0.15)+',1)');
    bgGrad.addColorStop(1,'rgba(0,0,0,1)');
    tctx.fillStyle=bgGrad;
    tctx.fillRect(0,0,W,H);
  }else{
    tctx.clearRect(0,0,W,H);
  }

  var scale=Math.min(W,H)*0.3*zoom;
  var cx=W/2, cy=H/2, fov=3.5;
  function project(p){var z=p[2]+fov;var ps=scale*(fov/(z>0.1?z:0.1));return[cx+p[0]*ps,cy-p[1]*ps,z];}

  var lightDir=normalize([0.5,0.8,1.0]);
  var lightDir2=normalize([-0.7,-0.3,0.5]);
  var halfVec=normalize([lightDir[0],lightDir[1],lightDir[2]+1]);

  var quads=[];
  for(var i=0;i<nu;i++){
    for(var j=0;j<nv;j++){
      var p00=points[i][j],p10=points[i+1][j],p11=points[i+1][j+1],p01=points[i][j+1];
      var n00=normals[i][j];
      var avgZ=(p00[2]+p10[2]+p11[2]+p01[2])/4;
      var s00=project(p00),s10=project(p10),s11=project(p11),s01=project(p01);
      var diff1=Math.max(0,dot3(n00,lightDir));
      var diff2=Math.max(0,dot3(n00,lightDir2))*0.4;
      var spec=Math.pow(Math.max(0,dot3(n00,halfVec)),32);
      var lum=0.08+(diff1*0.6+diff2*0.25+spec*0.3)*lighting+(1-lighting)*0.5;
      quads.push({s:[s00,s10,s11,s01],z:avgZ,lum:lum,spec:spec*lighting,ui:i/nu,vi:j/nv});
    }
  }
  quads.sort(function(a,b){return a.z-b.z;});

  for(var qi=0;qi<quads.length;qi++){
    var q=quads[qi],s=q.s;
    var colIdx=Math.floor((q.ui*3+q.vi*2)*cols.length)%cols.length;
    var col2Idx=(colIdx+1)%cols.length;
    var mix=((q.ui*3+q.vi*2)*cols.length)%1;
    var c1=hRGB(cols[colIdx]),c2=hRGB(cols[col2Idx]);
    var r=Math.round((c1[0]*(1-mix)+c2[0]*mix)*q.lum);
    var g=Math.round((c1[1]*(1-mix)+c2[1]*mix)*q.lum);
    var b=Math.round((c1[2]*(1-mix)+c2[2]*mix)*q.lum);
    if(q.spec>0.1){var sp=q.spec*200;r=Math.min(255,r+Math.round(sp));g=Math.min(255,g+Math.round(sp));b=Math.min(255,b+Math.round(sp));}
    var alpha=1-wireWeight*0.7;
    tctx.fillStyle='rgba('+r+','+g+','+b+','+alpha+')';
    tctx.beginPath();tctx.moveTo(s[0][0],s[0][1]);tctx.lineTo(s[1][0],s[1][1]);tctx.lineTo(s[2][0],s[2][1]);tctx.lineTo(s[3][0],s[3][1]);tctx.closePath();tctx.fill();
    if(wireWeight>0.02){
      var wr=Math.min(255,Math.round(r*0.5+128*wireWeight)),wg=Math.min(255,Math.round(g*0.5+128*wireWeight)),wb=Math.min(255,Math.round(b*0.5+128*wireWeight));
      tctx.strokeStyle='rgba('+wr+','+wg+','+wb+','+Math.min(1,wireWeight*1.5)+')';
      tctx.lineWidth=0.3+wireWeight*0.7;tctx.stroke();
    }
  }

  /* Ambient glow */
  var glowCol=hRGB(cols[0]);
  var glow=tctx.createRadialGradient(cx,cy,scale*0.3,cx,cy,scale*1.5);
  glow.addColorStop(0,'rgba('+glowCol[0]+','+glowCol[1]+','+glowCol[2]+',0.04)');
  glow.addColorStop(1,'rgba('+glowCol[0]+','+glowCol[1]+','+glowCol[2]+',0)');
  tctx.fillStyle=glow;tctx.fillRect(0,0,W,H);

  /* Scan lines */
  tctx.globalAlpha=0.03;
  for(var y=0;y<H;y+=2){tctx.fillStyle='#000';tctx.fillRect(0,y,W,1);}
  tctx.globalAlpha=1;
  tctx.restore();

  return {resolution:resolution, faces:quads.length};
}

/* ══════════════════════════════════════════════════════════
   OBJECT MODE — Overlay & Transform Controls
   ══════════════════════════════════════════════════════════ */

function ensureOverlay(){
  if(OBJ.overlay) return;
  var wrap=document.getElementById('cvwrap');
  if(!wrap) return;
  var ov=document.createElement('canvas');
  ov.id='topo-obj-ov';
  ov.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;z-index:50;pointer-events:none;';
  wrap.appendChild(ov);
  OBJ.overlay=ov;
  OBJ.octx=ov.getContext('2d');
}

function syncOverlay(){
  if(!OBJ.overlay)return;
  var ref=dv||cv;
  if(OBJ.overlay.width!==ref.width) OBJ.overlay.width=ref.width;
  if(OBJ.overlay.height!==ref.height) OBJ.overlay.height=ref.height;
  OBJ.overlay.style.width=ref.style.width||'';
  OBJ.overlay.style.height=ref.style.height||'';
}

function removeOverlay(){
  if(OBJ.overlay&&OBJ.overlay.parentNode){OBJ.overlay.parentNode.removeChild(OBJ.overlay);}
  OBJ.overlay=null;OBJ.octx=null;
}

/* ── Get center of object ── */
function objCenter(){return[OBJ.x+OBJ.w/2, OBJ.y+OBJ.h/2];}

/* ── Rotate a 2D point around another ── */
function rot2d(px,py,cx,cy,a){
  var c=Math.cos(a),s=Math.sin(a),dx=px-cx,dy=py-cy;
  return[cx+dx*c-dy*s, cy+dx*s+dy*c];
}

/* ── Get handle positions (in canvas space) ── */
function getHandles(){
  var cc=objCenter(), cx=cc[0], cy=cc[1], a=OBJ.angle;
  var hw=OBJ.w/2, hh=OBJ.h/2;
  function rp(lx,ly){return rot2d(cx+lx,cy+ly,cx,cy,a);}
  return {
    nw:rp(-hw,-hh), n:rp(0,-hh), ne:rp(hw,-hh),
    w:rp(-hw,0),                  e:rp(hw,0),
    sw:rp(-hw,hh),  s:rp(0,hh),  se:rp(hw,hh),
    rot:rp(0,-hh-ROT_DIST)
  };
}

/* ── Hit test: which handle or body? ── */
function hitTest(mx,my){
  var h=getHandles(), tol=HSIZE+5;
  /* Rotation handle first */
  if(Math.abs(mx-h.rot[0])<tol&&Math.abs(my-h.rot[1])<tol) return 'rot';
  /* Corner & edge handles */
  var names=['nw','n','ne','w','e','sw','s','se'];
  for(var k=0;k<names.length;k++){
    var hp=h[names[k]];
    if(Math.abs(mx-hp[0])<tol&&Math.abs(my-hp[1])<tol) return names[k];
  }
  /* Body hit — inverse rotate mouse to object-local space */
  var cc=objCenter();
  var local=rot2d(mx,my,cc[0],cc[1],-OBJ.angle);
  if(local[0]>=OBJ.x&&local[0]<=OBJ.x+OBJ.w&&local[1]>=OBJ.y&&local[1]<=OBJ.y+OBJ.h) return 'move';
  return null;
}

/* ── Draw overlay (bounding box + handles) ── */
function drawOverlay(){
  if(!OBJ.octx||!OBJ.img)return;
  syncOverlay();
  var g=OBJ.octx;
  var W=OBJ.overlay.width, H=OBJ.overlay.height;
  g.clearRect(0,0,W,H);
  if(!OBJ.active)return;

  var cc=objCenter(), cx=cc[0], cy=cc[1];
  g.save();
  g.translate(cx,cy);
  g.rotate(OBJ.angle);

  /* Bounding box */
  g.strokeStyle='#40e8ff';
  g.lineWidth=1.5;
  g.setLineDash([5,4]);
  g.strokeRect(-OBJ.w/2,-OBJ.h/2,OBJ.w,OBJ.h);
  g.setLineDash([]);

  /* Resize handles */
  var hw=OBJ.w/2, hh=OBJ.h/2;
  var pts=[[-hw,-hh],[0,-hh],[hw,-hh],[-hw,0],[hw,0],[-hw,hh],[0,hh],[hw,hh]];
  g.fillStyle='#40e8ff';
  g.strokeStyle='#000';g.lineWidth=1;
  for(var i=0;i<pts.length;i++){
    g.fillRect(pts[i][0]-HSIZE,pts[i][1]-HSIZE,HSIZE*2,HSIZE*2);
    g.strokeRect(pts[i][0]-HSIZE,pts[i][1]-HSIZE,HSIZE*2,HSIZE*2);
  }

  /* Rotation handle — circle with line */
  g.beginPath();g.moveTo(0,-hh);g.lineTo(0,-hh-ROT_DIST);g.strokeStyle='#40e8ff';g.lineWidth=1;g.stroke();
  g.beginPath();g.arc(0,-hh-ROT_DIST,7,0,Math.PI*2);g.fillStyle='rgba(64,232,255,0.3)';g.fill();g.strokeStyle='#40e8ff';g.lineWidth=1.5;g.stroke();
  /* Arrow on rotation circle */
  g.beginPath();g.arc(0,-hh-ROT_DIST,5,-0.5,1.2);g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();
  var ax=5*Math.cos(1.2),ay=5*Math.sin(1.2);
  g.beginPath();g.moveTo(ax,-hh-ROT_DIST+ay);g.lineTo(ax+3,-hh-ROT_DIST+ay-3);g.lineTo(ax-1,-hh-ROT_DIST+ay-4);g.closePath();g.fillStyle='#fff';g.fill();

  /* Label */
  g.font='9px monospace';g.fillStyle='#40e8ff';g.textAlign='left';
  g.fillText(SHAPES[T.shapeIdx].name+' · '+Math.round(OBJ.angle*180/Math.PI)+'°', -hw, hh+14);

  g.restore();
}

/* ── Composite: draw offscreen image onto main layer with transform ── */
function compositeObject(){
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx||!OBJ.img)return;

  var W=lctx.canvas.width, H=lctx.canvas.height;
  lctx.clearRect(0,0,W,H);

  /* Draw background */
  var cols=palCols();
  var bgGrad=lctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
  var bgCol=hRGB(cols[cols.length-1]);
  bgGrad.addColorStop(0,'rgba('+Math.round(bgCol[0]*0.15)+','+Math.round(bgCol[1]*0.15)+','+Math.round(bgCol[2]*0.15)+',1)');
  bgGrad.addColorStop(1,'rgba(0,0,0,1)');
  lctx.fillStyle=bgGrad;
  lctx.fillRect(0,0,W,H);

  /* Draw the object with transforms */
  var cc=objCenter();
  lctx.save();
  lctx.translate(cc[0],cc[1]);
  lctx.rotate(OBJ.angle);
  lctx.drawImage(OBJ.img,-OBJ.w/2,-OBJ.h/2,OBJ.w,OBJ.h);
  lctx.restore();

  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();
}

/* ── Get mouse position on canvas ── */
function getCanvasPos(e){
  var ref=dv||cv;
  var r=ref.getBoundingClientRect();
  if(!r.width||!r.height)return[0,0];
  var sx=ref.width/r.width, sy=ref.height/r.height;
  var src=e.touches?e.touches[0]:e.changedTouches?e.changedTouches[0]:e;
  return[(src.clientX-r.left)*sx,(src.clientY-r.top)*sy];
}

/* ── Mouse/touch handlers for object mode ── */
function onPointerDown(e){
  if(!OBJ.active||!OBJ.img)return;
  var pos=getCanvasPos(e);
  var hit=hitTest(pos[0],pos[1]);
  if(!hit)return;
  e.preventDefault();e.stopPropagation();
  OBJ.dragging=hit;
  OBJ.startX=pos[0];OBJ.startY=pos[1];
  OBJ.startOX=OBJ.x;OBJ.startOY=OBJ.y;
  OBJ.startW=OBJ.w;OBJ.startH=OBJ.h;
  OBJ.startAngle=OBJ.angle;
}

function onPointerMove(e){
  if(!OBJ.active||!OBJ.dragging)return;
  var pos=getCanvasPos(e);
  var dx=pos[0]-OBJ.startX, dy=pos[1]-OBJ.startY;
  var cc=objCenter();

  if(OBJ.dragging==='move'){
    OBJ.x=OBJ.startOX+dx;
    OBJ.y=OBJ.startOY+dy;
  }else if(OBJ.dragging==='rot'){
    var a1=Math.atan2(OBJ.startY-cc[1],OBJ.startX-cc[0]);
    var a2=Math.atan2(pos[1]-cc[1],pos[0]-cc[0]);
    OBJ.angle=OBJ.startAngle+(a2-a1);
  }else{
    /* Resize — convert delta to object-local space */
    var ca=Math.cos(-OBJ.angle),sa=Math.sin(-OBJ.angle);
    var ldx=dx*ca-dy*sa, ldy=dx*sa+dy*ca;
    var nw=OBJ.startW, nh=OBJ.startH, nx=OBJ.startOX, ny=OBJ.startOY;
    var d=OBJ.dragging;
    if(d.indexOf('e')>=0){nw=Math.max(30,OBJ.startW+ldx);}
    if(d.indexOf('w')>=0){nw=Math.max(30,OBJ.startW-ldx);nx=OBJ.startOX+ldx*Math.cos(OBJ.angle);ny=OBJ.startOY+ldx*Math.sin(OBJ.angle);}
    if(d.indexOf('s')>=0){nh=Math.max(30,OBJ.startH+ldy);}
    if(d.indexOf('n')>=0){nh=Math.max(30,OBJ.startH-ldy);nx=OBJ.startOX-ldy*Math.sin(OBJ.angle);ny=OBJ.startOY+ldy*Math.cos(OBJ.angle);}
    /* For corner handles, maintain aspect ratio */
    if(d.length===2){
      var aspect=OBJ.startW/OBJ.startH;
      if(nw/nh>aspect) nh=nw/aspect;
      else nw=nh*aspect;
    }
    OBJ.w=nw;OBJ.h=nh;
    if(d.indexOf('w')>=0||d.indexOf('n')>=0){OBJ.x=nx;OBJ.y=ny;}
  }

  compositeObject();
  drawOverlay();
}

function onPointerUp(e){
  if(!OBJ.active)return;
  OBJ.dragging=null;
}

/* ── Wire event listeners (unified pointer events: mouse/touch/pen) ── */
var _eventsWired=false;
function wireObjEvents(){
  if(_eventsWired)return;
  _eventsWired=true;
  var target=document.getElementById('cvwrap');
  if(!target) target=document;
  /* Use capture phase to intercept before drawing tools */
  target.addEventListener('pointerdown',function(e){
    if(!OBJ.active||!OBJ.img)return;
    var pos=getCanvasPos(e);
    var hit=hitTest(pos[0],pos[1]);
    if(hit){
      try{target.setPointerCapture&&target.setPointerCapture(e.pointerId);}catch(_){}
      onPointerDown(e);
    }
  },true);
  target.addEventListener('pointermove',function(e){
    if(OBJ.dragging){e.preventDefault();}
    onPointerMove(e);
  },{capture:true,passive:false});
  target.addEventListener('pointerup',function(e){onPointerUp(e);},true);
  target.addEventListener('pointercancel',function(e){onPointerUp(e);},true);

  /* Update cursor on hover (mouse only — touch/pen have no hover state) */
  target.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse')return;
    if(!OBJ.active||!OBJ.img||OBJ.dragging)return;
    var pos=getCanvasPos(e);
    var hit=hitTest(pos[0],pos[1]);
    var ref=dv||cv;
    if(!hit){ref.style.cursor='';return;}
    var cursors={move:'move',rot:'grab',nw:'nw-resize',ne:'ne-resize',sw:'sw-resize',se:'se-resize',n:'n-resize',s:'s-resize',e:'e-resize',w:'w-resize'};
    ref.style.cursor=cursors[hit]||'default';
  });
}

/* ── Force-deactivate object mode (called by reset / undo / clear) ── */
function deactivateObjMode(){
  if(!OBJ.active) return;
  /* Clear overlay */
  if(OBJ.octx) OBJ.octx.clearRect(0,0,OBJ.overlay.width,OBJ.overlay.height);
  /* Remove overlay canvas from DOM */
  if(OBJ.overlay && OBJ.overlay.parentNode) OBJ.overlay.parentNode.removeChild(OBJ.overlay);
  /* Reset all object state */
  OBJ.active=false; OBJ.img=null; OBJ.w=0; OBJ.h=0; OBJ.angle=0; OBJ.scaleF=1;
  OBJ.dragging=null; OBJ.overlay=null; OBJ.octx=null;
  /* Reset cursor */
  var ref=dv||cv; if(ref) ref.style.cursor='';
  /* Reset button appearance */
  var btn=document.getElementById('topo-obj-btn');
  if(btn){
    btn.textContent='ENABLE OBJECT MODE';
    btn.style.borderColor='rgba(64,232,255,0.4)';
    btn.style.color='#40e8ff';
    btn.style.background='rgba(64,232,255,0.08)';
  }
}

/* ── Toggle object mode ── */
function toggleObjMode(){
  OBJ.active=!OBJ.active;
  var btn=document.getElementById('topo-obj-btn');
  if(btn){
    btn.textContent=OBJ.active?'DISABLE OBJECT MODE':'ENABLE OBJECT MODE';
    btn.style.borderColor=OBJ.active?'#40e8ff':'rgba(64,232,255,0.4)';
    btn.style.color=OBJ.active?'#ffffff':'#40e8ff';
    btn.style.background=OBJ.active?'rgba(64,232,255,0.25)':'rgba(64,232,255,0.08)';
  }
  if(OBJ.active){
    ensureOverlay();
    syncOverlay();
    wireObjEvents();
    if(OBJ.img) drawOverlay();
    if(typeof setI==='function')setI('Object mode ON — drag to move, corners to resize, circle to rotate');
  }else{
    /* Flatten: composite final position to layer, remove overlay */
    if(OBJ.img) compositeObject();
    if(OBJ.octx){OBJ.octx.clearRect(0,0,OBJ.overlay.width,OBJ.overlay.height);}
    OBJ.img=null;OBJ.w=0;OBJ.h=0;OBJ.angle=0;
    var ref=dv||cv;
    ref.style.cursor='';
    if(typeof setI==='function')setI('Object mode OFF — shape baked to canvas');
  }
}

/* ══════════════════════════════════════════════════════════
   MAIN RENDER ENTRY POINT
   ══════════════════════════════════════════════════════════ */
function doRender(){
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx)return;
  if(typeof genUndoPush==='function')genUndoPush();

  var W=lctx.canvas.width, H=lctx.canvas.height;

  if(OBJ.active){
    /* Render to offscreen canvas, then composite with transforms */
    var offscreen=document.createElement('canvas');
    offscreen.width=W;offscreen.height=H;
    var oCtx=offscreen.getContext('2d');
    var info=renderShape(oCtx, W, H, false);
    OBJ.img=offscreen;
    /* Reset position to center at 70% size if first render in object mode */
    if(OBJ.w===0){var s=0.7;OBJ.w=Math.round(W*s);OBJ.h=Math.round(H*s);OBJ.x=Math.round((W-OBJ.w)/2);OBJ.y=Math.round((H-OBJ.h)/2);OBJ.angle=0;}
    compositeObject();
    ensureOverlay();syncOverlay();
    drawOverlay();

    var statusEl=document.getElementById('topo-status');
    if(statusEl) statusEl.textContent=SHAPES[T.shapeIdx].name+' · '+info.resolution+'×'+info.resolution+' · '+info.faces+' faces · OBJECT MODE';
    if(typeof setI==='function') setI('Topology: '+SHAPES[T.shapeIdx].name+' (object mode)');
  }else{
    /* Direct render to layer canvas */
    var info=renderShape(lctx, W, H, true);

    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();

    var statusEl=document.getElementById('topo-status');
    if(statusEl) statusEl.textContent=SHAPES[T.shapeIdx].name+' · '+info.resolution+'×'+info.resolution+' mesh · '+info.faces+' faces';
    if(typeof setI==='function') setI('Topology: '+SHAPES[T.shapeIdx].name+' rendered');
  }
}

/* ── Build shape list ── */
function buildShapeList(){
  var list=document.getElementById('topo-shape-list');
  if(!list)return;
  list.innerHTML='';
  SHAPES.forEach(function(s,i){
    var row=document.createElement('div');
    row.style.cssText='padding:4px 8px;cursor:pointer;font-size:9px;letter-spacing:.06em;border:1px solid transparent;border-radius:3px;margin-bottom:2px;transition:all .15s;display:flex;justify-content:space-between;align-items:center;';
    row.innerHTML='<span style="color:'+(i===T.shapeIdx?'#40e8ff':'rgba(255,255,255,0.6)')+';">'+s.name+'</span><span style="font-size:7px;color:rgba(255,255,255,0.3);max-width:55%;text-align:right;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">'+s.desc+'</span>';
    if(i===T.shapeIdx){row.style.borderColor='rgba(64,232,255,0.3)';row.style.background='rgba(64,232,255,0.06)';}
    row.addEventListener('click',function(){T.shapeIdx=i;buildShapeList();updateDesc();doRender();});
    row.addEventListener('mouseenter',function(){if(i!==T.shapeIdx)row.style.background='rgba(255,255,255,0.04)';});
    row.addEventListener('mouseleave',function(){if(i!==T.shapeIdx)row.style.background='none';});
    list.appendChild(row);
  });
}

function updateDesc(){
  var descEl=document.getElementById('topo-desc');
  if(!descEl)return;
  descEl.style.display='block';
  descEl.innerHTML='<div style="font-size:8px;color:rgba(64,232,255,0.7);padding:4px 8px;margin-bottom:6px;border-left:2px solid rgba(64,232,255,0.3);line-height:1.5;font-style:italic;">'+SHAPES[T.shapeIdx].desc+'</div>';
}

/* ── Wire sliders ── */
function wireSliders(){
  var ids=['topo-resolution','topo-zoom','topo-rotation','topo-wireframe','topo-deform','topo-lighting','topo-twist','topo-tube'];
  var valIds=['topo-resolution-v','topo-zoom-v','topo-rotation-v','topo-wireframe-v','topo-deform-v','topo-lighting-v','topo-twist-v','topo-tube-v'];
  var fmts=[
    function(v){return Math.round(v);},
    function(v){return (v/50).toFixed(1)+'x';},
    function(v){return Math.round(v)+'%';},
    function(v){return Math.round(v)+'%';},
    function(v){return Math.round(v)+'%';},
    function(v){return Math.round(v)+'%';},
    function(v){return Math.round(v)+'%';},
    function(v){return Math.round(v)+'%';}
  ];
  var timer=null;
  ids.forEach(function(id,idx){
    var el=document.getElementById(id);
    var vel=document.getElementById(valIds[idx]);
    if(!el)return;
    el.addEventListener('input',function(){
      if(vel)vel.textContent=fmts[idx](parseFloat(el.value));
      clearTimeout(timer);
      timer=setTimeout(doRender,120);
    });
  });
}

/* ── Randomise ── */
function randomise(){
  T.shapeIdx=Math.floor(Math.random()*SHAPES.length);
  buildShapeList();updateDesc();
  function rset(id,min,max){var el=document.getElementById(id);if(el){var v=min+Math.random()*(max-min);el.value=v;}}
  rset('topo-resolution',40,200);
  rset('topo-zoom',30,80);
  rset('topo-rotation',10,90);
  rset('topo-wireframe',0,60);
  rset('topo-deform',0,70);
  rset('topo-lighting',40,100);
  rset('topo-twist',0,80);
  rset('topo-tube',20,80);
  ['topo-resolution','topo-zoom','topo-rotation','topo-wireframe','topo-deform','topo-lighting','topo-twist','topo-tube'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.dispatchEvent(new Event('input'));
  });
  doRender();
}

/* ── Cycle ── */
function cycle(){
  T.cycleIdx=(T.cycleIdx+1)%SHAPES.length;
  T.shapeIdx=T.cycleIdx;
  buildShapeList();updateDesc();
  var lbl=document.getElementById('topo-cycle-label');
  var nm=document.getElementById('topo-cycle-name');
  if(lbl)lbl.style.display='block';
  if(nm)nm.textContent=SHAPES[T.shapeIdx].name;
  doRender();
}

/* ── Palette change ── */
function onPaletteChange(){
  var body=document.getElementById('topo-body');
  if(body&&body.style.display!=='none') setTimeout(doRender,80);
}

/* ── Init ── */
buildShapeList();
updateDesc();
wireSliders();

/* ── Object mode button wire ── */
var objBtn=document.getElementById('topo-obj-btn');
if(objBtn) objBtn.addEventListener('click',toggleObjMode);

/* ── Select shape by index (0=Sphere,1=Torus,2=Möbius,3=Klein) ── */
function selectShape(idx){
  if(idx>=0 && idx<SHAPES.length){ T.shapeIdx=idx; buildShapeList(); updateDesc(); }
}

/* ── Public API ── */
window._TOPO={
  render:doRender,
  randomise:randomise,
  cycle:cycle,
  selectShape:selectShape,
  onPaletteChange:onPaletteChange,
  toggleObj:toggleObjMode,
  deactivateObj:deactivateObjMode,
  /** Render directly to an arbitrary context with preset slider values.
   *  shapeIdx: 0-4 (sphere, torus, klein, mobius, cross-cap)
   *  sliders: {resolution, zoom, lighting, wireframe, deform, twist, tube, rotation}
   */
  renderDirect:function(tctx, W, H, shapeIdx, sliders){
    var prev = T.shapeIdx;
    T.shapeIdx = shapeIdx;
    /* Set sliders to requested values */
    var ids = ['topo-resolution','topo-zoom','topo-lighting','topo-wireframe',
               'topo-deform','topo-twist','topo-tube','topo-rotation'];
    var keys = ['resolution','zoom','lighting','wireframe','deform','twist','tube','rotation'];
    for(var i=0;i<ids.length;i++){
      var el=document.getElementById(ids[i]);
      if(el && sliders && sliders[keys[i]]!==undefined) el.value=sliders[keys[i]];
    }
    renderShape(tctx, W, H, true);
    T.shapeIdx = prev;
  }
};

})();
