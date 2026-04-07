/* ══════════════════════════════════════════════════════════════════════
   MORPHOGENESIS — Natural & Organic Forms
   Five systems derived from physics, geometry, and mathematics.
   Zero images. Zero corpus. Pure first principles.
   ══════════════════════════════════════════════════════════════════════ */
(function(){

/* ── System definitions ── */
var SYSTEMS=[
  {id:'rd',     name:'Reaction-Diffusion',
   nature:'Coral polyps, leopard spots, zebra stripes, sea slug patterns, brain folds, vegetation bands, rust stains',
   desc:'Gray-Scott: two chemicals diffuse and react (∂A/∂t=Da∇²A−AB²+f(1−A)). Turing, 1952. Generates coral, spots, labyrinths, brain folds.',
   labels:['Feed rate f','Kill rate k','Diffusion Da','Diffusion Db','Iterations'],
   min:[0,0,0,0,10], max:[100,100,100,100,100],
   def:[37,60,20,5,60],
   fmt:[function(v){return (v/1000).toFixed(3);},function(v){return (v/1000).toFixed(3);},
        function(v){return (v/100).toFixed(2);},function(v){return (v/100).toFixed(2);},
        function(v){return Math.round(v);}]},
  {id:'phyl',   name:'Phyllotaxis',
   nature:'Sunflower seed heads, pinecone scales, romanesco broccoli, pineapple skin, nautilus chambers, rose petals, agave spirals',
   desc:'Golden angle (137.507°) seed placement — the mathematics of sunflower heads, pinecones, nautilus shells, romanesco broccoli.',
   labels:['Angle offset','Seed count','Seed radius','Radial scale','Compression'],
   min:[0,10,1,30,30], max:[100,300,10,200,200],
   def:[50,200,4,100,100],
   fmt:[function(v){return (137.5+v*0.1).toFixed(1)+'°';},function(v){return Math.round(v);},
        function(v){return Math.round(v)+'px';},function(v){return Math.round(v);},
        function(v){return (v/100).toFixed(2);}]},
  {id:'branch', name:'Vascular Branching',
   nature:'Trees, root systems, blood vessels, lungs, river deltas, lightning bolts, ice crystals, coral skeletons',
   desc:"Murray's Law r³_p = r³_c1 + r³_c2. The rule governing every tree, blood vessel, river delta, and lung.",
   labels:['Branch angle','Tree depth','Length decay','Noise','Root count'],
   min:[10,2,50,0,1], max:[60,7,95,80,5],
   def:[35,5,76,25,1],
   fmt:[function(v){return Math.round(v)+'°';},function(v){return Math.round(v);},
        function(v){return (v/100).toFixed(2);},function(v){return Math.round(v);},
        function(v){return Math.round(v);}]},
  {id:'chladni',name:'Chladni Resonance',
   nature:'Sand on vibrating plates, acoustic resonance (cymatics), volcanic lava flow patterns, frost crystal geometry',
   desc:'Standing waves on a rigid plate: sin(mπx/L)·sin(nπy/L)=0. Sand settles at nodal lines. Chladni, 1787.',
   labels:['Mode m','Mode n','Plate size','Grain density','Noise'],
   min:[1,1,80,20,0], max:[9,9,180,100,60],
   def:[2,3,130,60,15],
   fmt:[function(v){return Math.round(v);},function(v){return Math.round(v);},
        function(v){return Math.round(v)+'px';},function(v){return Math.round(v)+'k';},
        function(v){return Math.round(v);}]},
  {id:'voronoi',name:'Voronoi Cellular',
   nature:'Soap foam, giraffe skin, dragonfly wing veins, basalt columns, bone cross-section, insect compound eyes, leaf cell structure',
   desc:'Voronoi tessellation + Lloyd relaxation → equal-area cells. Models soap bubbles, giraffe skin, dragonfly wings, basalt columns.',
   labels:['Cell count','Relaxations','Organic noise','Colour range','Edge weight'],
   min:[8,0,0,0,1], max:[90,15,80,100,8],
   def:[35,6,25,60,2],
   fmt:[function(v){return Math.round(v);},function(v){return Math.round(v);},
        function(v){return Math.round(v);},function(v){return Math.round(v)+'%';},
        function(v){return (v/2).toFixed(1)+'px';}]},
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

/* ── Shared hex-to-RGB helper ── */
function hRGB(h){
  if(!h||h.length<7)return[64,192,96];
  return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
}

/* ── Get palette colours ── */
function palCols(){
  var p=typeof gpal==='function'?gpal():null;
  return p&&p.c&&p.c.length?p.c:['#40c060','#80e0a0','#20a040','#60d080','#97c3b0','#40a060'];
}

/* ── Param helpers ── */
function getSys(){return SYSTEMS[M.sysIdx];}
function pv(i){
  var el=document.getElementById('morph-p'+(i+1));
  return el?parseInt(el.value):getSys().def[i];
}

/* ── Slider wiring ── */
function wireSliders(){
  var sys=getSys();
  var _t=null;
  function schedRender(){clearTimeout(_t);_t=setTimeout(doRender,120);}
  for(var i=0;i<5;i++){
    (function(idx){
      var sl=document.getElementById('morph-p'+(idx+1));
      var lb=document.getElementById('morph-l'+(idx+1));
      var vl=document.getElementById('morph-v'+(idx+1));
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
  var desc=document.getElementById('morph-desc');
  if(desc)desc.textContent=sys.desc;
}

/* ════ RENDERERS ════ */

function renderRD(ctx,W,H,cols){
  var f=pv(0)/1000, k=pv(1)/1000, Da=pv(2)/100, Db=pv(3)/100, iters=pv(4)*4;
  var gw=100,gh=Math.round(100*H/W);
  var sz=gw*gh;
  var A=new Float32Array(sz).fill(1), B=new Float32Array(sz);
  var nA=new Float32Array(sz), nB=new Float32Array(sz);
  var rng=prng(0xA3F1D2);
  /* Seed patches — IS density-guided when active, else random */
  for(var q=0;q<gw*gh;q+=9){
    var sx2=Math.floor(rng()*gw),sy2=Math.floor(rng()*gh);
    var seedProb=window._IS&&window._IS.active?window._IS.getDens(sx2/gw,sy2/gh):0.5+rng()*0.5;
    if(rng()<seedProb*1.4){
      for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){
        var nx=(sx2+dx+gw)%gw,ny=(sy2+dy+gh)%gh;
        A[ny*gw+nx]=0.5+rng()*0.1; B[ny*gw+nx]=0.25+rng()*0.1;
      }
    }
  }
  /* Iterate */
  for(var it=0;it<iters;it++){
    for(var y=0;y<gh;y++)for(var x=0;x<gw;x++){
      var i=y*gw+x;
      var l2=y*gw+(x-1+gw)%gw, r2=y*gw+(x+1)%gw;
      var u=(((y-1+gh)%gh)*gw+x), d2=(((y+1)%gh)*gw+x);
      var lapA=A[l2]+A[r2]+A[u]+A[d2]-4*A[i];
      var lapB=B[l2]+B[r2]+B[u]+B[d2]-4*B[i];
      var ab2=A[i]*B[i]*B[i];
      nA[i]=Math.max(0,Math.min(1,A[i]+Da*lapA-ab2+f*(1-A[i])));
      nB[i]=Math.max(0,Math.min(1,B[i]+Db*lapB+ab2-(f+k)*B[i]));
    }
    A.set(nA); B.set(nB);
  }
  /* Render to canvas using palette */
  var img=ctx.createImageData(W,H);
  var sx=W/gw,sy2b=H/gh;
  /* Parse 2-3 palette colours for colour mapping */
  var ca=hRGB(cols[0]||'#40c060'), cb2=hRGB(cols[1]||'#20a040'), cc=hRGB(cols[2%cols.length]||'#97c3b0');
  for(var gy=0;gy<gh;gy++)for(var gx=0;gx<gw;gx++){
    var v=A[gy*gw+gx], t=v;
    var cr=Math.floor(ca[0]*(1-t)+cb2[0]*t), cg2=Math.floor(ca[1]*(1-t)+cb2[1]*t), cb3=Math.floor(ca[2]*(1-t)+cb2[2]*t);
    for(var py=0;py<sy2b;py++)for(var px=0;px<sx;px++){
      var pixx=Math.floor(gx*sx+px), pixy=Math.floor(gy*sy2b+py);
      if(pixx<W&&pixy<H){
        var idx4=(pixy*W+pixx)*4;
        img.data[idx4]=cr; img.data[idx4+1]=cg2; img.data[idx4+2]=cb3; img.data[idx4+3]=255;
      }
    }
  }
  ctx.putImageData(img,0,0);
}

function renderPhyl(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var angle=(137.5+pv(0)*0.1)*Math.PI/180;
  var n=pv(1), pr2=pv(2), scale=pv(3)/100, wind=pv(4)/100;
  var cx=W/2, cy=H/2;
  for(var i=0;i<n;i++){
    var r=Math.sqrt(i)*scale*Math.min(W,H)*0.018;
    var theta=i*angle*wind;
    var x=cx+Math.cos(theta)*r, y=cy+Math.sin(theta)*r;
    var t=i/n;
    var col=cols[Math.floor(t*cols.length)%cols.length];
    var c=hRGB(col);
    var _d=window._IS&&window._IS.active?window._IS.getDens(x/W,y/H):(0.4+0.6*(1-t));
    var sz2=pr2*(0.3+0.7*_d);
    ctx.beginPath();ctx.arc(x,y,sz2,0,Math.PI*2);
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.2+_d*0.8)+')';
    ctx.fill();
  }
}

function renderBranch(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var angDeg=pv(0), depth=pv(1), decay=pv(2)/100, noise=pv(3)/100, roots=pv(4);
  var rng=prng(0xBEEFCAFE);
  function branch2(x,y,angle,len,rad,d){
    if(d>depth||rad<0.6)return;
    var ex=x+Math.cos(angle)*len, ey=y+Math.sin(angle)*len;
    var t=1-d/depth;
    var col=cols[Math.min(d,cols.length-1)%cols.length];
    var c=hRGB(col);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);
    ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.4+t*0.6)+')';
    ctx.lineWidth=rad;ctx.lineCap='round';ctx.stroke();
    var split=2;
    var r3=Math.pow(Math.pow(rad,3)/split,1/3);
    var _isDir=window._IS&&window._IS.active?window._IS.getGradDir(ex/W,ey/H):[0,0];
    var _isBias=window._IS&&window._IS.active?Math.atan2(_isDir[1],_isDir[0])*window._IS.influence*0.35:0;
    for(var i=0;i<split;i++){
      var da=((i/(split-1))-.5)*2*(angDeg*Math.PI/180)*(1+(rng()-.5)*noise*2)+_isBias*(rng()-.5);
      branch2(ex,ey,angle+da,len*decay*(1+(rng()-.5)*noise*.3),r3,d+1);
    }
  }
  var initLen=Math.min(W,H)*0.22;
  for(var ri=0;ri<roots;ri++){
    var rx=W*(0.2+ri/(Math.max(roots-1,1))*0.6);
    branch2(rx,H-2,-Math.PI/2+( rng()-.5)*0.3,initLen,7,0);
  }
}

function renderChladni(ctx,W,H,cols){
  ctx.clearRect(0,0,W,H);
  var m2=pv(0), n2=pv(1), L=pv(2), density=pv(3)*150, noiseA=pv(4)/100;
  var ox=(W-L)/2, oy=(H-L)/2;
  var rng=prng(0xC1AD1A);
  var c=hRGB(cols[0]||'#40c060');
  for(var q=0;q<density;q++){
    var x=rng()*L, y=rng()*L;
    var nx=(rng()-.5)*L*noiseA*0.08, ny=(rng()-.5)*L*noiseA*0.08;
    var v=Math.sin(m2*Math.PI*(x+nx)/L)*Math.sin(n2*Math.PI*(y+ny)/L);
    if(Math.abs(v)<0.07){
      var t2=1-Math.abs(v)/0.07;
      ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.3+t2*0.7)*(window._IS&&window._IS.active?window._IS.getDens((ox+x)/W,(oy+y)/H):1)+')';
      ctx.fillRect(ox+x,oy+y,1.8,1.8);
    }
  }
}

function renderVoronoi(ctx,W,H,cols){
  var nc=pv(0), relaxSteps=pv(1), noiseA=pv(2), colRange=pv(3)/100, lw=pv(4)/2;
  var rng=prng(0xF0CEFE1D);
  /* Generate seeds — IS density-guided when active */
  var pts=[];
  if(window._IS&&window._IS.active){
    var att2=0;
    while(pts.length<nc&&att2<nc*20){
      att2++;var vx=rng()*W,vy=rng()*H;
      if(rng()<window._IS.getDens(vx/W,vy/H)+0.1)pts.push([vx,vy]);
    }
    while(pts.length<nc)pts.push([rng()*W,rng()*H]);
  } else {
    for(var i=0;i<nc;i++) pts.push([rng()*W,rng()*H]);
  }
  /* Lloyd relaxation on coarse grid */
  var gw2=120,gh2=Math.round(120*H/W);
  for(var rel=0;rel<relaxSteps;rel++){
    var sums=pts.map(function(){return[0,0,0];});
    for(var gy=0;gy<gh2;gy++)for(var gx=0;gx<gw2;gx++){
      var wx=gx/gw2*W,wy=gy/gh2*H;
      var best=0,bd=Infinity;
      for(var pi=0;pi<pts.length;pi++){
        var d2=(wx-pts[pi][0])*(wx-pts[pi][0])+(wy-pts[pi][1])*(wy-pts[pi][1]);
        if(d2<bd){bd=d2;best=pi;}
      }
      sums[best][0]+=wx;sums[best][1]+=wy;sums[best][2]++;
    }
    pts=sums.map(function(s,i2){return s[2]>0?[s[0]/s[2],s[1]/s[2]]:pts[i2];});
  }
  /* Assign colours to cells */
  var cellCols=pts.map(function(_,ci){
    var col=cols[ci%cols.length];
    var c=hRGB(col);
    var f=0.7+colRange*0.3;
    return[Math.floor(c[0]*f),Math.floor(c[1]*f),Math.floor(c[2]*f)];
  });
  /* Render */
  var img=ctx.createImageData(W,H);
  var rng2=prng(0xD1FF);
  for(var py=0;py<H;py++)for(var px=0;px<W;px++){
    var nx2=(rng2()-.5)*noiseA*0.12,ny2=(rng2()-.5)*noiseA*0.12;
    var best2=0,bd2=Infinity;
    for(var pi2=0;pi2<pts.length;pi2++){
      var dx=(px-pts[pi2][0]+nx2*30),dy=(py-pts[pi2][1]+ny2*30);
      var d=(dx*dx+dy*dy);
      if(d<bd2){bd2=d;best2=pi2;}
    }
    var idx2=(py*W+px)*4;
    img.data[idx2]=cellCols[best2][0]+5;
    img.data[idx2+1]=cellCols[best2][1]+8;
    img.data[idx2+2]=cellCols[best2][2]+3;
    img.data[idx2+3]=255;
  }
  ctx.putImageData(img,0,0);
  /* Draw edges */
  var edgeCol=cols[0]||'#40c060';
  var ec=hRGB(edgeCol);
  ctx.fillStyle='rgba('+ec[0]+','+ec[1]+','+ec[2]+',0.5)';
  for(var ey=1;ey<H-1;ey++)for(var ex=1;ex<W-1;ex++){
    var id2=img.data,off=(ey*W+ex)*4;
    if(id2[off]!==id2[off+4]||id2[off]!==id2[(ey-1)*W*4+ex*4]){
      ctx.fillRect(ex,ey,lw,lw);
    }
  }
}

/* ── Main render ── */
function doRender(){
  if(window.genUndoPush)window.genUndoPush();
  var dv=document.getElementById('dv');
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx||!dv)return;
  var W=dv.width,H=dv.height;
  var cols=palCols();
  /* Respect connect/disconnect */
  if(!window._ENG_CONNECT)lctx.clearRect(0,0,W,H);
  var sys=getSys();
  var st=document.getElementById('morph-status');
  if(st)st.textContent='Generating '+sys.name+'...';
  /* Use setTimeout so status message renders before heavy compute */
  setTimeout(function(){
    if(sys.id==='rd')      renderRD(lctx,W,H,cols);
    else if(sys.id==='phyl')   renderPhyl(lctx,W,H,cols);
    else if(sys.id==='branch') renderBranch(lctx,W,H,cols);
    else if(sys.id==='chladni')renderChladni(lctx,W,H,cols);
    else                       renderVoronoi(lctx,W,H,cols);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    if(st)st.textContent=sys.name+' — seed: 0x'+Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase().padStart(6,'0');
  },16);
}

/* ── Randomise sliders ── */
function randomise(){
  var sys=getSys();
  for(var i=0;i<5;i++){
    var sl=document.getElementById('morph-p'+(i+1));
    var vl=document.getElementById('morph-v'+(i+1));
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
    var sl=document.getElementById('morph-p'+(i+1));
    var vl=document.getElementById('morph-v'+(i+1));
    if(!sl)continue;
    sl.value=sys.max[i];
    if(vl)vl.textContent=sys.fmt[i](sys.max[i]);
  }
}

/* ── Public API ── */
window._MORPH={
  render:doRender,
  randomise:randomise,
  onSysChange:function(){
    var sel=document.getElementById('morph-sys');
    if(!sel)return;
    M.sysIdx=['rd','phyl','branch','chladni','voronoi'].indexOf(sel.value);
    if(M.sysIdx<0)M.sysIdx=0;
    wireSliders();
    if(typeof highlightSys==='function')highlightSys(M.sysIdx);
  },
  cycle:function(){
    M.cycleIdx=(M.cycleIdx+1)%SYSTEMS.length;
    var sys=SYSTEMS[M.cycleIdx];
    M.sysIdx=M.cycleIdx;
    /* Update selector */
    var sel=document.getElementById('morph-sys');
    if(sel)sel.value=sys.id;
    wireSliders();
    setMax();
    if(typeof highlightSys==='function')highlightSys(M.sysIdx);
    /* Update cycle label */
    var cl=document.getElementById('morph-cycle-label'),cn=document.getElementById('morph-cycle-name');
    if(cl)cl.style.display='block';
    if(cn)cn.textContent='('+(M.cycleIdx+1)+'/'+SYSTEMS.length+') '+sys.name;
    /* Open body if closed */
    var b=document.getElementById('morph-body'),t=document.getElementById('morph-toggle');
    if(b&&b.style.display==='none'){
      b.style.display='block';
      if(t){t.style.background='rgba(64,192,96,0.07)';t.style.borderColor='#40c060';}
      var chev=t?t.querySelector('.tc-chev'):null;if(chev)chev.style.transform='rotate(180deg)';
    }
    doRender();
  },
  onPaletteChange:function(){
    /* Re-render if panel is open */
    var b=document.getElementById('morph-body');
    if(b&&b.style.display!=='none')doRender();
  }
};

/* ── Wire palette change ── */
setTimeout(function(){
  buildSysList();
  wireSliders();
},500);

function buildSysList(){
  var list=document.getElementById('morph-sys-list');
  if(!list)return;
  list.innerHTML='';
  SYSTEMS.forEach(function(sys,i){
    var row=document.createElement('div');
    row.id='morph-sr-'+sys.id;
    row.style.cssText='cursor:pointer;padding:5px 8px;border:1px solid #0a2a0a;margin-bottom:3px;border-radius:2px;transition:border-color .1s,background .1s;';
    row.innerHTML=
      '<div style="font-size:9px;font-weight:600;color:#40c060;letter-spacing:.06em;">'+(i+1)+'. '+sys.name+'</div>'+
      '<div style="font-size:8px;color:#97c3b0;margin-top:2px;line-height:1.4;">'+sys.nature+'</div>';
    row.addEventListener('mouseenter',function(){if(M.sysIdx!==i)this.style.borderColor='rgba(64,192,96,0.3)';});
    row.addEventListener('mouseleave',function(){if(M.sysIdx!==i)this.style.borderColor='#0a2a0a';});
    row.addEventListener('click',function(){selectSystem(i);});
    list.appendChild(row);
  });
  highlightSys(M.sysIdx);
}

function highlightSys(idx){
  SYSTEMS.forEach(function(sys,i){
    var row=document.getElementById('morph-sr-'+sys.id);
    if(!row)return;
    if(i===idx){row.style.borderColor='#40c060';row.style.background='rgba(64,192,96,0.07)';}
    else{row.style.borderColor='#0a2a0a';row.style.background='';}
  });
}

function selectSystem(idx){
  M.sysIdx=idx;
  /* Update hidden select for compatibility */
  var sel=document.getElementById('morph-sys');
  if(sel)sel.value=SYSTEMS[idx].id;
  wireSliders();
  highlightSys(idx);
  doRender();
}

})();


/* ── Fullscreen canvas toggle ── */
window._toggleFS=(function(){
  var on=false;
  var _tb,_panel,_bar,_stage,_fsBtn;
  var _origStageStyle='';
  return function(){
    _tb    =document.getElementById('tb');
    _panel =document.getElementById('panel');
    _bar   =document.getElementById('bar');
    _stage =document.getElementById('stage');
    _fsBtn =document.getElementById('fs-btn');
    if(!on){
      /* Enter fullscreen */
      on=true;
      _origStageStyle=_stage.style.cssText||'';
      if(_tb)    _tb.style.display='none';
      if(_panel) _panel.style.display='none';
      if(_bar)   _bar.style.opacity='0';
      _stage.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;align-items:center;justify-content:center;';
      if(_fsBtn){_fsBtn.textContent='✕ EXIT';_fsBtn.style.color='rgba(255,255,255,0.7)';_fsBtn.style.borderColor='rgba(255,255,255,0.3)';}
      /* Resize canvas to fill screen */
      setTimeout(function(){
        if(window._setCanvasSize)window._setCanvasSize(window.innerWidth,window.innerHeight);
        else if(window._sz)window._sz();
      },50);
    } else {
      /* Exit fullscreen */
      on=false;
      if(_tb)    _tb.style.display='';
      if(_panel) _panel.style.display='';
      if(_bar)   _bar.style.opacity='';
      _stage.style.cssText=_origStageStyle;
      if(_fsBtn){_fsBtn.textContent='⊞ FULLSCREEN';_fsBtn.style.color='#97c3b0';_fsBtn.style.borderColor='rgba(255,255,255,0.3)';}
      setTimeout(function(){if(window._sz)window._sz();},50);
    }
  };
})();
/* Also allow Escape to exit fullscreen */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&document.getElementById('fs-btn')&&document.getElementById('fs-btn').textContent.indexOf('EXIT')>=0){
    window._toggleFS&&window._toggleFS();
  }
});
