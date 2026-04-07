/* ══════════════════════════════════════════════════════════
   TOPOLOGICAL 3D ENGINE — Mathematical topology shapes
   Renders Sphere, Torus, Möbius Band, Klein Bottle, and
   more using parametric 3D surface equations projected
   to 2D with lighting, wireframe, and palette integration.
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
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}

/* ══════════════════════════════════════════════════════════
   PARAMETRIC SURFACE GENERATORS
   Each returns a point [x,y,z] for parameters u,v
   ══════════════════════════════════════════════════════════ */

function spherePoint(u,v,params){
  var r=params.scale||1;
  // Add organic deformation
  var def=params.deform||0;
  var rd=r+def*0.3*Math.sin(5*u)*Math.sin(3*v)+def*0.15*Math.sin(8*u+2*v);
  return[
    rd*Math.sin(u)*Math.cos(v),
    rd*Math.sin(u)*Math.sin(v),
    rd*Math.cos(u)
  ];
}

function torusPoint(u,v,params){
  var R=params.scale||1;
  var r=params.tube||0.4;
  var twist=params.twist||0;
  var vt=v+twist*u;
  return[
    (R+r*Math.cos(vt))*Math.cos(u),
    (R+r*Math.cos(vt))*Math.sin(u),
    r*Math.sin(vt)
  ];
}

function mobiusPoint(u,v,params){
  var w=params.width||0.5;
  var scale=params.scale||1;
  var twist=1+Math.floor((params.twist||0)*3); // 1 to 4 half-twists
  var t=v*w-w/2; // -w/2 to w/2
  return[
    scale*(1+t*Math.cos(twist*u/2))*Math.cos(u),
    scale*(1+t*Math.cos(twist*u/2))*Math.sin(u),
    scale*t*Math.sin(twist*u/2)
  ];
}

function kleinPoint(u,v,params){
  var sc=params.scale||1;
  var a=sc*2;
  var x,y,z;
  // Figure-8 Klein bottle immersion
  var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
  var r=params.tube||0.5;
  x=(a+r*cv*cu-r*sv*Math.sin(u/2))*Math.cos(u/2);
  /* Use the classic immersion */
  if(u<Math.PI){
    var R=4*(1-Math.cos(u)/2);
    x=6*Math.cos(u)*(1+Math.sin(u))+R*Math.cos(u)*cv;
    y=16*Math.sin(u)+R*Math.sin(u)*cv;
    z=R*sv;
  }else{
    var R=4*(1-Math.cos(u)/2);
    x=6*Math.cos(u)*(1+Math.sin(u))+R*Math.cos(v+Math.PI);
    y=16*Math.sin(u);
    z=R*sv;
  }
  var s=sc*0.06;
  return[x*s,y*s,z*s];
}

function trefoilPoint(u,v,params){
  var sc=params.scale||1;
  var r=params.tube||0.3;
  // Trefoil knot parametric curve
  var cu=Math.cos(u),su=Math.sin(u);
  // Knot centerline
  var kx=su+2*Math.sin(2*u);
  var ky=cu-2*Math.cos(2*u);
  var kz=-Math.sin(3*u);
  // Tangent (derivative)
  var tx=Math.cos(u)+4*Math.cos(2*u);
  var ty=-Math.sin(u)+4*Math.sin(2*u);
  var tz=-3*Math.cos(3*u);
  var T2=normalize([tx,ty,tz]);
  // Normal & binormal via Frenet frame
  var up=[0,0,1];
  var N=normalize(cross(T2,up));
  if(Math.abs(dot(T2,up))>0.99) N=normalize(cross(T2,[1,0,0]));
  var B=cross(T2,N);
  // Tube surface
  return[
    sc*(kx+r*(N[0]*Math.cos(v)+B[0]*Math.sin(v))),
    sc*(ky+r*(N[1]*Math.cos(v)+B[1]*Math.sin(v))),
    sc*(kz+r*(N[2]*Math.cos(v)+B[2]*Math.sin(v)))
  ];
}

function boyPoint(u,v,params){
  var sc=params.scale||1;
  // Boy's surface parametric (Bryant-Kusner)
  var cu=Math.cos(u),su=Math.sin(u);
  var cv=Math.cos(v),sv=Math.sin(v);
  var s2u=Math.sin(2*u),c2u=Math.cos(2*u);
  var denom=2-Math.SQRT2*Math.sin(3*v)*Math.sin(2*u);
  var x=(Math.SQRT2*cu*cu*Math.cos(2*v)+cu*Math.sin(2*v))/(denom+0.001);
  var y=(Math.SQRT2*cu*cu*Math.sin(2*v)-cu*Math.cos(2*v))/(denom+0.001);
  var z=3*cu*cu/(denom+0.001);
  return[sc*x*0.6,sc*y*0.6,sc*(z-1.5)*0.6];
}

function diniPoint(u,v,params){
  var sc=params.scale||1;
  var a=1, b=params.twist||0.2;
  b=0.05+b*0.4; // map 0-1 to 0.05-0.45
  var x=a*Math.cos(u)*Math.sin(v);
  var y=a*Math.sin(u)*Math.sin(v);
  var z=a*(Math.cos(v)+Math.log(Math.tan(v/2+0.001)))+b*u;
  return[sc*x*0.5,sc*y*0.5,sc*z*0.08];
}

function crosscapPoint(u,v,params){
  var sc=params.scale||1;
  var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
  var s2v=Math.sin(2*v);
  var x=sc*0.7*(su*sv);
  var y=sc*0.7*(su*s2v/2);
  var z=sc*0.7*(cu*cu-cu*su*sv*sv);
  return[x,y,z];
}

/* ── Surface point dispatcher ── */
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

/* ── U,V range for each shape ── */
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
   MAIN RENDERER
   ══════════════════════════════════════════════════════════ */
function doRender(){
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx)return;
  if(typeof genUndoPush==='function')genUndoPush();

  var W=lctx.canvas.width, H=lctx.canvas.height;
  var cols=palCols();
  var shape=SHAPES[T.shapeIdx].id;
  var rng=makePRNG(Date.now());

  /* Read slider values */
  var resolution = Math.round(sv('topo-resolution'));   // 20-120
  var zoom       = sv('topo-zoom')/50;                  // 0.2 - 4.0
  var rotSpeed   = sv('topo-rotation')/100;             // rotation influence
  var wireWeight = sv('topo-wireframe')/100;             // 0=solid, 1=wireframe
  var deform     = sv('topo-deform')/100;                // surface deformation
  var lighting   = sv('topo-lighting')/100;              // lighting intensity
  var twist      = sv('topo-twist')/100;                 // shape-specific twist
  var tube       = 0.15+sv('topo-tube')/200;             // tube radius for torus/trefoil

  /* Auto-rotate based on slider */
  T.rotX = 0.3+rotSpeed*1.2;
  T.rotY = 0.5+rotSpeed*0.8;
  T.rotZ = rotSpeed*0.3;

  var params = {
    scale: zoom,
    deform: deform,
    twist: twist,
    tube: tube,
    width: 0.5+deform*0.3
  };

  /* Get UV range */
  var range = getUVRange(shape);
  var nu = resolution, nv = resolution;

  /* Generate all surface points */
  var points = [];
  var normals = [];
  var uvs = [];
  var eps = 0.001;

  for(var i=0;i<=nu;i++){
    points[i]=[];normals[i]=[];uvs[i]=[];
    for(var j=0;j<=nv;j++){
      var u=range.u0+(range.u1-range.u0)*i/nu;
      var v=range.v0+(range.v1-range.v0)*j/nv;
      var pt=getSurfacePoint(shape,u,v,params);

      /* Compute normal via finite differences */
      var pu=getSurfacePoint(shape,u+eps,v,params);
      var pv2=getSurfacePoint(shape,u,v+eps,params);
      var du=sub(pu,pt), dv=sub(pv2,pt);
      var n=normalize(cross(du,dv));

      /* Apply rotation */
      pt=rotateX(pt,T.rotX);pt=rotateY(pt,T.rotY);pt=rotateZ(pt,T.rotZ);
      n=rotateX(n,T.rotX);n=rotateY(n,T.rotY);n=rotateZ(n,T.rotZ);

      points[i][j]=pt;
      normals[i][j]=n;
      uvs[i][j]=[i/nu,j/nv];
    }
  }

  /* ── Clear and set background ── */
  lctx.save();
  lctx.clearRect(0,0,W,H);

  /* Background gradient */
  var bgGrad=lctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
  var bgCol=hRGB(cols[cols.length-1]);
  bgGrad.addColorStop(0,'rgba('+Math.round(bgCol[0]*0.15)+','+Math.round(bgCol[1]*0.15)+','+Math.round(bgCol[2]*0.15)+',1)');
  bgGrad.addColorStop(1,'rgba(0,0,0,1)');
  lctx.fillStyle=bgGrad;
  lctx.fillRect(0,0,W,H);

  /* ── Projection settings ── */
  var scale=Math.min(W,H)*0.3*zoom;
  var cx=W/2, cy=H/2;
  var fov=3.5; // perspective factor

  function project(p){
    var z=p[2]+fov;
    var pscale=scale*(fov/(z>0.1?z:0.1));
    return[cx+p[0]*pscale, cy-p[1]*pscale, z];
  }

  /* ── Light direction ── */
  var lightDir=normalize([0.5,0.8,1.0]);
  var lightDir2=normalize([-0.7,-0.3,0.5]);

  /* ── Collect quads with depth for sorting ── */
  var quads=[];
  for(var i=0;i<nu;i++){
    for(var j=0;j<nv;j++){
      var p00=points[i][j],p10=points[i+1][j],p11=points[i+1][j+1],p01=points[i][j+1];
      var n00=normals[i][j];

      /* Average depth for painter's sort */
      var avgZ=(p00[2]+p10[2]+p11[2]+p01[2])/4;

      /* Project all 4 corners */
      var s00=project(p00),s10=project(p10),s11=project(p11),s01=project(p01);

      /* Lighting */
      var diff1=Math.max(0,dot(n00,lightDir));
      var diff2=Math.max(0,dot(n00,lightDir2))*0.4;
      var spec=Math.pow(Math.max(0,dot(n00,normalize([lightDir[0]+0,lightDir[1]+0,lightDir[2]+1]))),32);
      var lum=0.08+(diff1*0.6+diff2*0.25+spec*0.3)*lighting+(1-lighting)*0.5;

      quads.push({
        s:[s00,s10,s11,s01],
        z:avgZ,
        lum:lum,
        spec:spec*lighting,
        ui:i/nu,
        vi:j/nv,
        i:i,j:j
      });
    }
  }

  /* Painter's algorithm — sort back to front */
  quads.sort(function(a,b){return a.z-b.z;});

  /* ── Render quads ── */
  for(var qi=0;qi<quads.length;qi++){
    var q=quads[qi];
    var s=q.s;

    /* Color from palette based on UV position */
    var colIdx=Math.floor((q.ui*3+q.vi*2)*cols.length)%cols.length;
    var col2Idx=(colIdx+1)%cols.length;
    var mix=((q.ui*3+q.vi*2)*cols.length)%1;

    var c1=hRGB(cols[colIdx]);
    var c2=hRGB(cols[col2Idx]);
    var r=Math.round((c1[0]*(1-mix)+c2[0]*mix)*q.lum);
    var g=Math.round((c1[1]*(1-mix)+c2[1]*mix)*q.lum);
    var b=Math.round((c1[2]*(1-mix)+c2[2]*mix)*q.lum);

    /* Add specular highlight */
    if(q.spec>0.1){
      var sp=q.spec*200;
      r=Math.min(255,r+Math.round(sp));
      g=Math.min(255,g+Math.round(sp));
      b=Math.min(255,b+Math.round(sp));
    }

    /* Solid fill */
    var alpha=1-wireWeight*0.7;
    lctx.fillStyle='rgba('+r+','+g+','+b+','+alpha+')';
    lctx.beginPath();
    lctx.moveTo(s[0][0],s[0][1]);
    lctx.lineTo(s[1][0],s[1][1]);
    lctx.lineTo(s[2][0],s[2][1]);
    lctx.lineTo(s[3][0],s[3][1]);
    lctx.closePath();
    lctx.fill();

    /* Wireframe overlay */
    if(wireWeight>0.02){
      var wr=Math.round(r*0.5+128*wireWeight);
      var wg=Math.round(g*0.5+128*wireWeight);
      var wb=Math.round(b*0.5+128*wireWeight);
      lctx.strokeStyle='rgba('+Math.min(255,wr)+','+Math.min(255,wg)+','+Math.min(255,wb)+','+Math.min(1,wireWeight*1.5)+')';
      lctx.lineWidth=0.3+wireWeight*0.7;
      lctx.stroke();
    }
  }

  /* ── Ambient glow around shape ── */
  var glowCol=hRGB(cols[0]);
  var glow=lctx.createRadialGradient(cx,cy,scale*0.3,cx,cy,scale*1.5);
  glow.addColorStop(0,'rgba('+glowCol[0]+','+glowCol[1]+','+glowCol[2]+',0.04)');
  glow.addColorStop(1,'rgba('+glowCol[0]+','+glowCol[1]+','+glowCol[2]+',0)');
  lctx.fillStyle=glow;
  lctx.fillRect(0,0,W,H);

  /* ── Subtle scan lines for depth ── */
  lctx.globalAlpha=0.03;
  for(var y=0;y<H;y+=2){
    lctx.fillStyle='#000';
    lctx.fillRect(0,y,W,1);
  }
  lctx.globalAlpha=1;

  lctx.restore();

  /* Composite layers */
  if(window._layersCompositeFn)window._layersCompositeFn();
  if(window._layersUpdateThumbs)window._layersUpdateThumbs();

  /* Update status */
  var statusEl=document.getElementById('topo-status');
  if(statusEl) statusEl.textContent=SHAPES[T.shapeIdx].name+' · '+resolution+'×'+resolution+' mesh · '+quads.length+' faces';

  if(typeof setI==='function') setI('Topology: '+SHAPES[T.shapeIdx].name+' rendered');
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
    if(i===T.shapeIdx){
      row.style.borderColor='rgba(64,232,255,0.3)';
      row.style.background='rgba(64,232,255,0.06)';
    }
    row.addEventListener('click',function(){
      T.shapeIdx=i;
      buildShapeList();
      updateDesc();
      doRender();
    });
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
    function(v){return (v/50).toFixed(1)+'×';},
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
  buildShapeList();
  updateDesc();
  /* Randomise sliders */
  function rset(id,min,max){var el=document.getElementById(id);if(el){var v=min+Math.random()*(max-min);el.value=v;var ev=document.getElementById(id+'-v');if(ev)ev.textContent=v.toFixed?Math.round(v)+'':'';return v;}}
  rset('topo-resolution',30,90);
  rset('topo-zoom',30,80);
  rset('topo-rotation',10,90);
  rset('topo-wireframe',0,60);
  rset('topo-deform',0,70);
  rset('topo-lighting',40,100);
  rset('topo-twist',0,80);
  rset('topo-tube',20,80);
  /* Update displayed values */
  ['topo-resolution','topo-zoom','topo-rotation','topo-wireframe','topo-deform','topo-lighting','topo-twist','topo-tube'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.dispatchEvent(new Event('input'));
  });
  doRender();
}

/* ── Cycle ── */
function cycle(){
  T.cycleIdx=(T.cycleIdx+1)%SHAPES.length;
  T.shapeIdx=T.cycleIdx;
  buildShapeList();
  updateDesc();
  /* Update cycle label */
  var lbl=document.getElementById('topo-cycle-label');
  var nm=document.getElementById('topo-cycle-name');
  if(lbl)lbl.style.display='block';
  if(nm)nm.textContent=SHAPES[T.shapeIdx].name;
  doRender();
}

/* ── Palette change ── */
function onPaletteChange(){
  var body=document.getElementById('topo-body');
  if(body&&body.style.display!=='none'){
    setTimeout(doRender,80);
  }
}

/* ── Init ── */
buildShapeList();
updateDesc();
wireSliders();

/* ── Public API ── */
window._TOPO={
  render:doRender,
  randomise:randomise,
  cycle:cycle,
  onPaletteChange:onPaletteChange
};

})();
