/* ══════════════════════════════════════════════════════════════════════
   ORGANIC FORMS — Smooth, Sculptural, Blobby Shapes
   Five systems: metaballs, superformula, noise blobs, lava lamp, radiolaria.
   Zero images. Zero corpus. Pure first principles.
   ══════════════════════════════════════════════════════════════════════ */
(function(){

/* ── System definitions ── */
var SYSTEMS=[
  {id:'meta',  name:'Metaballs',
   nature:'Cell membranes, oil droplets, liquid mercury, soap bubbles merging, lava lamp blobs, amoeba fusion',
   desc:'Implicit surface from weighted point cloud: F(x,y) = Σ(rᵢ²/dᵢ²). Blobs seamlessly merge into smooth organic forms.',
   labels:['Blob count','Radius','Threshold','Turbulence','Edge width'],
   min:[2,20,30,0,1], max:[15,80,90,80,20],
   def:[6,45,55,20,5],
   fmt:[function(v){return Math.round(v);},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'%';},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'px';}]},
  {id:'super', name:'Superformula',
   nature:'Starfish, flowers, pollen grains, diatom shells, leaves, sea urchins, cell cross-sections, snowflakes',
   desc:'Gielis superformula: r(θ) = (|cos(mθ/4)/a|ⁿ² + |sin(mθ/4)/b|ⁿ³)^(−1/n₁). One equation, infinite organic shapes.',
   labels:['Symmetry m','Shape n1','Shape n2','Shape n3','Scale'],
   min:[1,1,1,1,20], max:[20,60,60,60,100],
   def:[5,10,15,15,60],
   fmt:[function(v){return Math.round(v);},function(v){return (v/10).toFixed(1);},
        function(v){return (v/10).toFixed(1);},function(v){return (v/10).toFixed(1);},
        function(v){return Math.round(v)+'%';}]},
  {id:'nblob', name:'Noise Blobs',
   nature:'Amoebas, clouds, smooth stones, puddles, ink drops, pebbles, sea glass, cells under a microscope',
   desc:'Closed shapes defined by displacing a circle\u2019s radius with layered Perlin noise. Smooth, organic silhouettes.',
   labels:['Base radius','Noise scale','Octaves','Smoothness','Count'],
   min:[20,5,1,10,1], max:[80,80,6,90,12],
   def:[50,35,3,50,4],
   fmt:[function(v){return Math.round(v)+'%';},function(v){return Math.round(v);},
        function(v){return Math.round(v);},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v);}]},
  {id:'lava',  name:'Lava Lamp',
   nature:'Lava lamp blobs, mitosis, lipid membranes, slime mold fusion, liquid metal, embryonic cells dividing',
   desc:'SDF smooth-union of noise-displaced circles via polynomial smooth minimum. Blobs flow together like warm wax.',
   labels:['Blob count','Merge softness','Deformation','Noise seed','Fill opacity'],
   min:[2,5,10,0,20], max:[10,80,90,100,100],
   def:[4,40,50,30,80],
   fmt:[function(v){return Math.round(v);},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'%';},function(v){return Math.round(v);},
        function(v){return Math.round(v)+'%';}]},
  {id:'radio', name:'Radiolaria',
   nature:'Radiolaria, diatoms, foraminifera, microscopic plankton, Ernst Haeckel illustrations, pollen structure',
   desc:'Procedural radial organisms: concentric shells, lattice structure, radiating spines. Inspired by Haeckel\u2019s Kunstformen der Natur.',
   labels:['Symmetry order','Spine count','Shell layers','Complexity','Ornamentation'],
   min:[3,0,1,10,0], max:[16,40,5,90,80],
   def:[6,12,3,50,40],
   fmt:[function(v){return Math.round(v)+'-fold';},function(v){return Math.round(v);},
        function(v){return Math.round(v);},function(v){return Math.round(v)+'%';},
        function(v){return Math.round(v)+'%';}]}
];

var M={sysIdx:0, cycleIdx:-1};

/* ── PRNG ── */
function prng(s){
  s=s>>>0;
  return function(){
    s+=0x6D2B79F5;var t=s;
    t=(t^(t>>>15))*((t|1)>>>0);
    t^=t+(t^(t>>>7))*(t|61);
    return((t^(t>>>14))>>>0)/4294967296;
  };
}

/* ── Hex to RGB ── */
function hRGB(h){
  if(!h||h.length<7)return[192,160,64];
  return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
}

/* ── Palette colours ── */
function palCols(){
  var p=typeof gpal==='function'?gpal():null;
  return p&&p.c&&p.c.length?p.c:['#c0a040','#e0c870','#a08030','#d0b050','#b09040','#e0d090'];
}

/* ── Param helpers ── */
function getSys(){return SYSTEMS[M.sysIdx];}
function pv(i){
  var el=document.getElementById('orgf-p'+(i+1));
  return el?parseInt(el.value):getSys().def[i];
}

/* ── Value noise (local copy to avoid dependency issues) ── */
function vn(x,y,sd){
  sd=sd||0;
  function h(a,b){var v=(Math.sin(a*12.9898+b*78.233+sd*43.1)*43758.5453123)%1;return v<0?v+1:v;}
  var ix=Math.floor(x),iy=Math.floor(y);
  var fx=x-ix,fy=y-iy;
  fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  var a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);
  return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;
}

/* ── FBM with configurable octaves ── */
function fbmN(x,y,sd,oct){
  var v=0,a=0.5,f=1,m=0;
  for(var i=0;i<oct;i++){v+=vn(x*f,y*f,sd+i*100)*a;m+=a;a*=0.5;f*=2;}
  return v/m;
}

/* ── Slider wiring ── */
function wireSliders(){
  var sys=getSys();
  var _t=null;
  function schedRender(){clearTimeout(_t);_t=setTimeout(doRender,120);}
  for(var i=0;i<5;i++){
    (function(idx){
      var sl=document.getElementById('orgf-p'+(idx+1));
      var lb=document.getElementById('orgf-l'+(idx+1));
      var vl=document.getElementById('orgf-v'+(idx+1));
      if(!sl)return;
      sl.min=sys.min[idx];sl.max=sys.max[idx];sl.value=sys.def[idx];
      if(lb)lb.textContent=sys.labels[idx];
      if(vl)vl.textContent=sys.fmt[idx](sys.def[idx]);
      sl.oninput=function(){
        var v=parseInt(this.value);
        if(vl)vl.textContent=sys.fmt[idx](v);
        schedRender();
      };
    })(i);
  }
  var desc=document.getElementById('orgf-desc');
  if(desc)desc.textContent=getSys().desc;
}

/* ════════════════════════════════════════════════════════════════════
   RENDERERS
   ════════════════════════════════════════════════════════════════════ */

/* ── 1. Metaballs (full-resolution per-pixel) ── */
function renderMeta(ctx,W,H,cols){
  var count=pv(0), radius=pv(1)/100, thresh=pv(2)/100, turb=pv(3)/100, edge=pv(4)/1000;
  var rng=prng(0xB10B1A);
  /* Generate blob centres */
  var blobs=[];
  for(var i=0;i<count;i++){
    var bx,by;
    if(window._IS&&window._IS.active){
      var att=0;
      do{bx=rng();by=rng();att++;}while(att<40&&rng()>window._IS.getDens(bx,by)+0.15);
    } else {
      bx=0.15+rng()*0.7; by=0.15+rng()*0.7;
    }
    var r=radius*(0.5+rng()*0.5);
    bx+=vn(i*7.1,0.3,42)*turb*0.3;
    by+=vn(0.3,i*7.1,42)*turb*0.3;
    blobs.push({x:bx,y:by,r:r});
  }
  /* Pre-parse palette colours for each blob */
  var blobCols=[];
  for(var i=0;i<blobs.length;i++) blobCols.push(hRGB(cols[i%cols.length]||'#c0a040'));
  var cc=hRGB(cols[2%cols.length]||'#a08030');
  /* Evaluate field per pixel for smooth antialiased output */
  var img=ctx.createImageData(W,H);
  var d=img.data;
  for(var py=0;py<H;py++){
    var ny=py/H;
    for(var px=0;px<W;px++){
      var nx=px/W;
      var field=0, bestI=0, bestC=0;
      for(var bi=0;bi<blobs.length;bi++){
        var dx=nx-blobs[bi].x, dy=ny-blobs[bi].y;
        var d2=dx*dx+dy*dy+0.0001;
        var contribution=blobs[bi].r*blobs[bi].r/d2;
        if(contribution>bestC){bestC=contribution;bestI=bi;}
        field+=contribution;
      }
      if(field>=thresh){
        var t=Math.min(1,(field-thresh)*3);
        var c=blobCols[bestI];
        var edgeFactor=Math.abs(field-thresh)<edge?0.7:1.0;
        var idx=(py*W+px)*4;
        d[idx  ]=Math.floor(c[0]*edgeFactor+cc[0]*(1-edgeFactor));
        d[idx+1]=Math.floor(c[1]*edgeFactor+cc[1]*(1-edgeFactor));
        d[idx+2]=Math.floor(c[2]*edgeFactor+cc[2]*(1-edgeFactor));
        d[idx+3]=Math.floor(200+t*55);
      }
    }
  }
  ctx.putImageData(img,0,0);
}

/* ── 2. Superformula (Gielis) ── */
function renderSuper(ctx,W,H,cols){
  var m=pv(0), n1=Math.max(0.1,pv(1)/10), n2=pv(2)/10, n3=pv(3)/10, scale=pv(4)/100;
  var cx=W/2, cy=H/2;
  var maxR=Math.min(W,H)*0.4*scale;
  /* IS offset */
  if(window._IS&&window._IS.active){
    var gd=window._IS.getGradDir(0.5,0.5);
    cx+=gd[0]*W*0.1*window._IS.influence;
    cy+=gd[1]*H*0.1*window._IS.influence;
  }
  var steps=500;
  /* Draw concentric layers for depth */
  var layers=[1.0, 0.7, 0.4];
  for(var li=layers.length-1;li>=0;li--){
    var s=layers[li];
    var col=cols[li%cols.length]||'#c0a040';
    var c=hRGB(col);
    var alpha=li===0?1.0:(0.3+li*0.15);
    ctx.beginPath();
    for(var i=0;i<=steps;i++){
      var theta=i/steps*Math.PI*2;
      var ct=Math.cos(m*theta/4), st2=Math.sin(m*theta/4);
      var term1=Math.pow(Math.abs(ct),n2);
      var term2=Math.pow(Math.abs(st2),n3);
      var r=Math.pow(term1+term2,-1/n1);
      r=Math.min(r,3)*maxR*s; /* Clamp to prevent infinity */
      var x=cx+r*Math.cos(theta);
      var y=cy+r*Math.sin(theta);
      if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha+')';
    ctx.fill();
    if(li===0){
      var sc=hRGB(cols[1%cols.length]||'#e0c870');
      ctx.strokeStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+',0.8)';
      ctx.lineWidth=1.5;
      ctx.stroke();
    }
  }
}

/* ── 3. Noise Blobs ── */
function renderNBlob(ctx,W,H,cols){
  var baseR=pv(0)/100, nScale=pv(1), octaves=pv(2), smooth=pv(3)/100, count=pv(4);
  var amplitude=(1-smooth)*0.8;
  var rng=prng(0xBB10B);

  for(var bi=0;bi<count;bi++){
    var bx,by;
    if(window._IS&&window._IS.active){
      var att=0;
      do{bx=0.15+rng()*0.7;by=0.15+rng()*0.7;att++;}while(att<30&&rng()>window._IS.getDens(bx,by)+0.2);
    } else {
      bx=0.2+rng()*0.6; by=0.2+rng()*0.6;
    }
    var cx=bx*W, cy=by*H;
    var br=baseR*Math.min(W,H)*0.5*(0.5+rng()*0.5);
    var seed=bi*137+42;
    var samples=200;

    /* Sample points around the blob */
    var pts=[];
    for(var i=0;i<samples;i++){
      var theta=i/samples*Math.PI*2;
      var nx=Math.cos(theta)*nScale*0.04;
      var ny=Math.sin(theta)*nScale*0.04;
      var n=fbmN(nx,ny,seed,octaves);
      var r=br*(1+n*amplitude);
      pts.push({x:cx+Math.cos(theta)*r, y:cy+Math.sin(theta)*r});
    }

    /* Draw smooth bezier curve through points (Catmull-Rom → Bezier) */
    var col=cols[bi%cols.length]||'#c0a040';
    var c=hRGB(col);
    ctx.beginPath();
    for(var i=0;i<pts.length;i++){
      var p0=pts[(i-1+pts.length)%pts.length];
      var p1=pts[i];
      var p2=pts[(i+1)%pts.length];
      var p3=pts[(i+2)%pts.length];
      if(i===0) ctx.moveTo(p1.x,p1.y);
      var cp1x=p1.x+(p2.x-p0.x)/6;
      var cp1y=p1.y+(p2.y-p0.y)/6;
      var cp2x=p2.x-(p3.x-p1.x)/6;
      var cp2y=p2.y-(p3.y-p1.y)/6;
      ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,p2.x,p2.y);
    }
    ctx.closePath();
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.7)';
    ctx.fill();
    var sc=hRGB(cols[(bi+1)%cols.length]||'#e0c870');
    ctx.strokeStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+',0.5)';
    ctx.lineWidth=1.2;
    ctx.stroke();
  }
}

/* ── 4. Lava Lamp (SDF smooth-union) ── */
function renderLava(ctx,W,H,cols){
  var count=pv(0), softness=pv(1)/100, deform=pv(2)/100, noiseSeed=pv(3), fillOp=pv(4)/100;
  var rng=prng(0x1A7A+noiseSeed*17);
  /* Generate blobs */
  var blobs=[];
  for(var i=0;i<count;i++){
    var bx=0.2+rng()*0.6, by=0.2+rng()*0.6;
    bx+=vn(i*7.3,0.5,noiseSeed)*deform*0.35;
    by+=vn(0.5,i*7.3,noiseSeed)*deform*0.35;
    var r=0.08+rng()*0.12;
    blobs.push({x:bx,y:by,r:r});
  }
  var k=softness*0.15+0.005; /* Merge kernel */
  /* Evaluate SDF per pixel for smooth antialiased output */
  var img=ctx.createImageData(W,H);
  var d=img.data;
  var ca=hRGB(cols[0]||'#c0a040'),cb=hRGB(cols[1%cols.length]||'#e0c870'),cc=hRGB(cols[2%cols.length]||'#a08030');
  var ar=W/H; /* Aspect ratio */

  function smin(a,b,k2){
    var h=Math.max(0,Math.min(1,0.5+0.5*(b-a)/k2));
    return b+(a-b)*h-k2*h*(1-h);
  }

  for(var py=0;py<H;py++){
    var ny=py/H;
    for(var px=0;px<W;px++){
      var nx=px/W;
      var combined=1e9;
      for(var bi=0;bi<blobs.length;bi++){
        var dx=nx-blobs[bi].x, dy=(ny-blobs[bi].y)*ar;
        var dist=Math.sqrt(dx*dx+dy*dy)-blobs[bi].r;
        combined=smin(combined,dist,k);
      }
      var idx=(py*W+px)*4;
      if(combined<0){
        var depth=Math.min(1,Math.abs(combined)*12);
        d[idx  ]=Math.floor(ca[0]*(1-depth)+cb[0]*depth);
        d[idx+1]=Math.floor(ca[1]*(1-depth)+cb[1]*depth);
        d[idx+2]=Math.floor(ca[2]*(1-depth)+cb[2]*depth);
        d[idx+3]=Math.floor(fillOp*255);
      } else if(combined<0.008){
        var ef=1-combined/0.008;
        d[idx]=cc[0]; d[idx+1]=cc[1]; d[idx+2]=cc[2]; d[idx+3]=Math.floor(ef*180);
      }
    }
  }
  ctx.putImageData(img,0,0);
}

/* ── 5. Radiolaria ── */
function renderRadio(ctx,W,H,cols){
  var sym=pv(0), spines=pv(1), shells=pv(2), complexity=pv(3)/100, ornament=pv(4)/100;
  var cx=W/2, cy=H/2;
  var baseR=Math.min(W,H)*0.35;
  var rng=prng(0xAAD10);

  /* IS offset */
  if(window._IS&&window._IS.active){
    var gd=window._IS.getGradDir(0.5,0.5);
    cx+=gd[0]*W*0.08*window._IS.influence;
    cy+=gd[1]*H*0.08*window._IS.influence;
    baseR*=(0.7+0.6*window._IS.getDens(0.5,0.5));
  }

  /* Draw shells back to front */
  for(var L=shells;L>=1;L--){
    var layerR=baseR*(L/shells)*(0.5+0.5*complexity);
    var nSamples=Math.max(120, sym*24); /* High sample count for smooth shells */
    var col=cols[(shells-L)%cols.length]||'#c0a040';
    var c=hRGB(col);
    var alpha=0.3+0.5*(L/shells);

    /* Build smooth shell path using Catmull-Rom → Bezier */
    var shellPts=[];
    for(var i=0;i<nSamples;i++){
      var theta=i/nSamples*Math.PI*2;
      var nr=layerR+vn(Math.cos(theta)*3,Math.sin(theta)*3,42+L*100)*layerR*0.15*complexity;
      nr+=Math.cos(theta*sym)*layerR*0.06*complexity;
      shellPts.push({x:cx+Math.cos(theta)*nr, y:cy+Math.sin(theta)*nr});
    }
    ctx.beginPath();
    for(var i=0;i<shellPts.length;i++){
      var p0=shellPts[(i-1+shellPts.length)%shellPts.length];
      var p1=shellPts[i];
      var p2=shellPts[(i+1)%shellPts.length];
      var p3=shellPts[(i+2)%shellPts.length];
      if(i===0) ctx.moveTo(p1.x,p1.y);
      var cp1x=p1.x+(p2.x-p0.x)/6, cp1y=p1.y+(p2.y-p0.y)/6;
      var cp2x=p2.x-(p3.x-p1.x)/6, cp2y=p2.y-(p3.y-p1.y)/6;
      ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,p2.x,p2.y);
    }
    ctx.closePath();
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+alpha+')';
    ctx.fill();
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.7)';
    ctx.lineWidth=0.8;
    ctx.stroke();
  }

  /* Lattice lines between shells */
  if(ornament>0.3&&shells>1){
    var nLines=sym*2;
    var lc=hRGB(cols[1%cols.length]||'#e0c870');
    ctx.strokeStyle='rgba('+lc[0]+','+lc[1]+','+lc[2]+','+(ornament*0.5)+')';
    ctx.lineWidth=0.5;
    for(var i=0;i<nLines;i++){
      var theta=i/nLines*Math.PI*2;
      var innerR=baseR*(1/shells)*(0.5+0.5*complexity);
      var outerR=baseR*(0.5+0.5*complexity);
      innerR+=vn(Math.cos(theta)*3,Math.sin(theta)*3,142)*innerR*0.15*complexity;
      outerR+=vn(Math.cos(theta)*3,Math.sin(theta)*3,242)*outerR*0.15*complexity;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(theta)*innerR, cy+Math.sin(theta)*innerR);
      ctx.lineTo(cx+Math.cos(theta)*outerR, cy+Math.sin(theta)*outerR);
      ctx.stroke();
    }
  }

  /* Spines */
  if(spines>0){
    var sc=hRGB(cols[0]||'#c0a040');
    for(var i=0;i<spines;i++){
      var theta=i/spines*Math.PI*2+(rng()-0.5)*0.1;
      var outerR2=baseR*(0.5+0.5*complexity);
      outerR2+=vn(Math.cos(theta)*3,Math.sin(theta)*3,242)*outerR2*0.15*complexity;
      var spineLen=outerR2*(1.0+0.3+ornament*0.7);
      var x1=cx+Math.cos(theta)*outerR2;
      var y1=cy+Math.sin(theta)*outerR2;
      var x2=cx+Math.cos(theta)*spineLen;
      var y2=cy+Math.sin(theta)*spineLen;
      /* Tapered spine */
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
      ctx.strokeStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+',0.8)';
      ctx.lineWidth=Math.max(0.5, 2-i*0.04);
      ctx.stroke();
      /* Barbs at 1/3 and 2/3 */
      if(ornament>0.5){
        for(var f=0.33;f<=0.67;f+=0.34){
          var bx=x1+(x2-x1)*f, by2=y1+(y2-y1)*f;
          var barbLen=3+ornament*8;
          var barbAngle=theta+Math.PI/2;
          ctx.beginPath();
          ctx.arc(bx,by2,barbLen*0.3,0,Math.PI*2);
          ctx.fillStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+',0.4)';
          ctx.fill();
        }
      }
    }
  }

  /* Central detail */
  var cdc=hRGB(cols[2%cols.length]||'#a08030');
  ctx.beginPath();ctx.arc(cx,cy,baseR*0.06,0,Math.PI*2);
  ctx.fillStyle='rgba('+cdc[0]+','+cdc[1]+','+cdc[2]+',0.9)';
  ctx.fill();
  /* Inner rosette */
  if(complexity>0.5){
    var rc=hRGB(cols[3%cols.length]||'#d0b050');
    ctx.strokeStyle='rgba('+rc[0]+','+rc[1]+','+rc[2]+',0.6)';
    ctx.lineWidth=0.6;
    for(var i=0;i<sym;i++){
      var theta=i/sym*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx+Math.cos(theta)*baseR*0.12,cy+Math.sin(theta)*baseR*0.12);
      ctx.stroke();
    }
  }
}

/* ═══════════════════════════════════════════════════
   MAIN RENDER PIPELINE
   ═══════════════════════════════════════════════════ */
function doRender(){
  if(window.genUndoPush)window.genUndoPush();
  var dv=document.getElementById('dv');
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx||!dv)return;
  var W=dv.width,H=dv.height;
  var cols=palCols();
  if(!window._ENG_CONNECT)lctx.clearRect(0,0,W,H);
  /* Enable antialiasing for smooth rendering */
  lctx.imageSmoothingEnabled=true;
  lctx.imageSmoothingQuality='high';
  var sys=getSys();
  var st=document.getElementById('orgf-status');
  if(st)st.textContent='Generating '+sys.name+'\u2026';
  setTimeout(function(){
    if(sys.id==='meta')       renderMeta(lctx,W,H,cols);
    else if(sys.id==='super') renderSuper(lctx,W,H,cols);
    else if(sys.id==='nblob') renderNBlob(lctx,W,H,cols);
    else if(sys.id==='lava')  renderLava(lctx,W,H,cols);
    else                      renderRadio(lctx,W,H,cols);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    if(st)st.textContent=sys.name+' \u2014 seed: 0x'+Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase().padStart(6,'0');
  },16);
}

/* ── Randomise sliders ── */
function randomise(){
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('orgf-p'+(i+1));
    var vl=document.getElementById('orgf-v'+(i+1));
    if(!sl)continue;
    var v=Math.floor(sys.min[i]+Math.random()*(sys.max[i]-sys.min[i]));
    sl.value=v;
    if(vl)vl.textContent=sys.fmt[i](v);
  }
  doRender();
}

/* ── Set all sliders to max ── */
function setMax(){
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('orgf-p'+(i+1));
    var vl=document.getElementById('orgf-v'+(i+1));
    if(!sl)continue;
    sl.value=sys.max[i];
    if(vl)vl.textContent=sys.fmt[i](sys.max[i]);
  }
}

/* ── System list ── */
function buildSysList(){
  var list=document.getElementById('orgf-sys-list');
  if(!list)return;
  list.innerHTML='';
  SYSTEMS.forEach(function(sys,i){
    var row=document.createElement('div');
    row.id='orgf-sr-'+sys.id;
    row.style.cssText='cursor:pointer;padding:5px 8px;border:1px solid #2a1a0a;margin-bottom:3px;border-radius:2px;transition:border-color .1s,background .1s;';
    row.innerHTML=
      '<div style="font-size:9px;font-weight:600;color:#c0a040;letter-spacing:.06em;">'+(i+1)+'. '+sys.name+'</div>'+
      '<div style="font-size:8px;color:#b09060;margin-top:2px;line-height:1.4;">'+sys.nature+'</div>';
    row.addEventListener('mouseenter',function(){if(M.sysIdx!==i)this.style.borderColor='rgba(192,160,64,0.3)';});
    row.addEventListener('mouseleave',function(){if(M.sysIdx!==i)this.style.borderColor='#2a1a0a';});
    row.addEventListener('click',function(){selectSystem(i);});
    list.appendChild(row);
  });
  highlightSys(M.sysIdx);
}

function highlightSys(idx){
  SYSTEMS.forEach(function(sys,i){
    var row=document.getElementById('orgf-sr-'+sys.id);
    if(!row)return;
    if(i===idx){row.style.borderColor='#c0a040';row.style.background='rgba(192,160,64,0.07)';}
    else{row.style.borderColor='#2a1a0a';row.style.background='';}
  });
}

function selectSystem(idx){
  M.sysIdx=idx;
  wireSliders();
  highlightSys(idx);
  doRender();
}

/* ── Public API ── */
window._ORGF={
  render:doRender,
  randomise:randomise,
  cycle:function(){
    M.cycleIdx=(M.cycleIdx+1)%SYSTEMS.length;
    var sys=SYSTEMS[M.cycleIdx];
    M.sysIdx=M.cycleIdx;
    wireSliders();
    setMax();
    highlightSys(M.sysIdx);
    var cl=document.getElementById('orgf-cycle-label'),cn=document.getElementById('orgf-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(M.cycleIdx+1)+'/'+SYSTEMS.length+') '+sys.name;
    /* Open body if closed */
    var b=document.getElementById('orgf-body'),t=document.getElementById('orgf-toggle');
    if(b&&b.style.display==='none'){
      b.style.display='block';
      if(t){t.style.background='rgba(192,160,64,0.07)';t.style.borderColor='#c0a040';}
      var chev=t?t.querySelector('.tc-chev'):null;if(chev)chev.style.transform='rotate(180deg)';
    }
    doRender();
  },
  onPaletteChange:function(){
    var b=document.getElementById('orgf-body');
    if(b&&b.style.display!=='none')doRender();
  }
};

/* ── Init ── */
setTimeout(function(){
  buildSysList();
  wireSliders();
},500);

})();
