/* ══════════════════════════════════════════════════════════════════════
   MEMORY-BASED DRAWING — Latent Emotional Architecture
   Constructs visuals from latent emotional structures.
   Zero derivation from existing artworks or corpora.
   ══════════════════════════════════════════════════════════════════════ */
(function(){

/* ── 8 Latent Memory Architectures ── */
var ARCHITECTURES=[
  {id:0,
   name:'Waiting, But Hopeful',
   phrase:'A place that felt like waiting but hopeful',
   warm:.72,weight:.28,time:.80,dis:.30,tex:.40,space:.75,res:.85},
  {id:1,
   name:'Childhood Afternoon',
   phrase:'The texture of a childhood afternoon that never existed',
   warm:.90,weight:.20,time:.90,dis:.55,tex:.70,space:.60,res:.70},
  {id:2,
   name:'The Colour of Almost',
   phrase:'The colour of a sound you almost remember',
   warm:.45,weight:.35,time:.75,dis:.70,tex:.50,space:.55,res:.90},
  {id:3,
   name:'Grief as Architecture',
   phrase:'A room where someone used to be',
   warm:.20,weight:.85,time:.60,dis:.40,tex:.65,space:.30,res:.75},
  {id:4,
   name:'Pre-Language',
   phrase:'A feeling before you had words for it',
   warm:.55,weight:.45,time:.95,dis:.80,tex:.30,space:.80,res:.60},
  {id:5,
   name:'Inherited Distance',
   phrase:'The longing your grandmother never spoke aloud',
   warm:.60,weight:.70,time:.85,dis:.50,tex:.55,space:.40,res:.80},
  {id:6,
   name:'Threshold Memory',
   phrase:'The moment between sleeping and knowing where you are',
   warm:.50,weight:.30,time:.90,dis:.75,tex:.45,space:.70,res:.95},
  {id:7,
   name:'Collective Forgetting',
   phrase:'A place everyone remembers differently',
   warm:.65,weight:.55,time:.70,dis:.60,tex:.80,space:.65,res:.50},
];

/* ── Emotional dimension state ── */
var M={
  warm:.60,weight:.40,time:.70,dis:.45,tex:.55,space:.50,res:.65,
  selArch:-1, cycleIdx:-1,
};

/* ── Seeded PRNG ── */
function prng(seed){
  var s=seed>>>0;
  return function(){s+=0x6D2B79F5;var t=s;t=(t^(t>>>15))*((t|1)>>>0);t^=t+(t^(t>>>7))*(t|61);return((t^(t>>>14))>>>0)/4294967296;};
}

/* ── Parse memory text into emotional dimensions ── */
function parseMemory(text){
  var t=text.toLowerCase();
  var d={warm:.60,weight:.40,time:.70,dis:.45,tex:.55,space:.50,res:.65};
  /* Warmth signals */
  var warmW=['warm','sun','gold','amber','soft','tender','embrace','light','glow','bloom','summer','morning','honey','gentle','love','comfort','safe'];
  var coldW=['cold','dark','grey','grey','steel','sharp','hard','absence','empty','void','shadow','winter','dusk','hollow','loss','alone'];
  warmW.forEach(function(w){if(t.indexOf(w)>=0)d.warm=Math.min(1,d.warm+.12);});
  coldW.forEach(function(w){if(t.indexOf(w)>=0)d.warm=Math.max(0,d.warm-.10);});
  /* Weight / gravity */
  var heavyW=['grief','weight','heavy','burden','stone','sinking','falling','deep','dense','thick','slow','dread','fear','loss'];
  var lightW=['float','drift','cloud','feather','airy','light','breath','hover','shimmer','haze','mist','vague'];
  heavyW.forEach(function(w){if(t.indexOf(w)>=0)d.weight=Math.min(1,d.weight+.13);});
  lightW.forEach(function(w){if(t.indexOf(w)>=0)d.weight=Math.max(0,d.weight-.10);});
  /* Temporal blur */
  var blurW=['remember','forgot','almost','blur','haze','fade','distant','ago','child','never','always','before','after','between','once'];
  blurW.forEach(function(w){if(t.indexOf(w)>=0)d.time=Math.min(1,d.time+.08);});
  /* Dissolution */
  var disW=['dissolve','fade','vanish','disappear','ghost','dream','unreal','barely','almost','perhaps','might','echo'];
  disW.forEach(function(w){if(t.indexOf(w)>=0)d.dis=Math.min(1,d.dis+.12);});
  /* Texture */
  var texW=['texture','rough','smooth','grain','skin','fabric','surface','wall','floor','touch','feel','sand','stone','wood','water'];
  texW.forEach(function(w){if(t.indexOf(w)>=0)d.tex=Math.min(1,d.tex+.10);});
  /* Space */
  var spaceW=['open','vast','wide','infinite','horizon','sky','expand','large','big','room','space','distance','far','beyond','ocean'];
  var closeW=['small','close','near','tight','narrow','corner','enclosed','inside','pocket','quiet','hidden'];
  spaceW.forEach(function(w){if(t.indexOf(w)>=0)d.space=Math.min(1,d.space+.12);});
  closeW.forEach(function(w){if(t.indexOf(w)>=0)d.space=Math.max(0,d.space-.10);});
  /* Resonance / emotional intensity */
  var resW=['feel','felt','emotion','longing','ache','yearning','love','grief','joy','wonder','awe','hope','fear','deep'];
  resW.forEach(function(w){if(t.indexOf(w)>=0)d.res=Math.min(1,d.res+.10);});
  return d;
}

/* ── Core visual renderer ── */
function renderMemory(ctx,W,H,dims,seed,palCols){
  var rng=prng(seed);
  palCols=palCols||['#b48cff','#d0b8ff','#7a5caa','#e8d5ff','#4a2a6a','#c090e0'];

  ctx.save();

  /* Layer 1: Atmospheric ground — warmth sets hue temperature */
  var gradType=dims.space>.6?'radial':'linear';
  var warm=dims.warm, weight=dims.weight;
  /* Build colours from palette + emotional tint */
  var c0=palCols[0], c1=palCols[Math.min(1,palCols.length-1)];
  var c2=palCols[Math.min(2,palCols.length-1)];

  /* Background wash — temporal blur drives opacity layering */
  var nLayers=Math.floor(3+dims.time*5);
  for(var l=0;l<nLayers;l++){
    var t=l/nLayers;
    var grd;
    if(gradType==='radial'){
      var cx=W*(0.3+rng()*0.4), cy=H*(0.3+rng()*0.4);
      var r=Math.max(W,H)*(0.4+dims.space*0.6);
      grd=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    } else {
      var ang=rng()*Math.PI*2;
      grd=ctx.createLinearGradient(W/2+Math.cos(ang)*W,H/2+Math.sin(ang)*H,W/2-Math.cos(ang)*W,H/2-Math.sin(ang)*H);
    }
    grd.addColorStop(0,hexAlpha(c0,0.12*dims.res*(1-t)));
    grd.addColorStop(0.5,hexAlpha(c1,0.08*dims.res));
    grd.addColorStop(1,hexAlpha(c2,0.05*dims.res*t));
    ctx.fillStyle=grd;
    ctx.fillRect(0,0,W,H);
  }

  /* Layer 2: Memory filaments — drifting curved paths */
  var nFilaments=Math.floor(8+dims.res*20);
  for(var f=0;f<nFilaments;f++){
    var x=rng()*W, y=rng()*H;
    var len=Math.floor(20+dims.space*60+rng()*40);
    var op=0.04+dims.res*0.18*(1-dims.dis*0.5);
    var col=palCols[Math.floor(rng()*palCols.length)];
    var sw=0.4+weight*2.5*(1-dims.dis*0.4);

    ctx.save();
    ctx.globalAlpha=op*(0.6+rng()*0.4);
    ctx.strokeStyle=col;
    ctx.lineWidth=sw*(0.5+rng()*1.5);
    ctx.lineCap='round';

    /* Dissolution: skip segments */
    var dissolveGap=dims.dis;
    ctx.beginPath();
    var started=false;
    for(var s=0;s<len;s++){
      var skip=rng()<dissolveGap*0.4;
      var px=x+Math.cos(s*0.18+rng()*dims.tex*2)*dims.space*W*0.08;
      var py=y+Math.sin(s*0.15+rng()*dims.tex*2)*dims.space*H*0.08;
      x+=( rng()-0.5)*dims.space*W*0.04;
      y+=( rng()-0.5)*dims.space*H*0.04+(weight-0.5)*2;
      x=Math.max(0,Math.min(W,x)); y=Math.max(0,Math.min(H,y));
      if(skip){ctx.beginPath();started=false;continue;}
      if(!started){ctx.moveTo(px,py);started=true;}
      else ctx.lineTo(px,py);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* Layer 3: Emotional nodes — weight creates dense anchor points */
  var nNodes=Math.floor(dims.weight*12+dims.res*8);
  for(var n=0;n<nNodes;n++){
    var nx=W*(0.1+rng()*0.8), ny=H*(0.1+rng()*0.8);
    var nr=4+dims.weight*30+rng()*20;
    var op2=0.03+dims.weight*0.12;
    var col2=palCols[Math.floor(rng()*palCols.length)];
    var grd2=ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
    grd2.addColorStop(0,hexAlpha(col2,op2*2));
    grd2.addColorStop(1,hexAlpha(col2,0));
    ctx.fillStyle=grd2;
    ctx.fillRect(nx-nr,ny-nr,nr*2,nr*2);
  }

  /* Layer 4: Temporal texture — fine grain driven by tex dimension */
  if(dims.tex>0.2){
    var nGrain=Math.floor(dims.tex*400+100);
    for(var g=0;g<nGrain;g++){
      var gx=rng()*W, gy=rng()*H;
      var gs=0.3+rng()*1.2*dims.tex;
      var gop=0.01+rng()*0.06*dims.tex;
      var gc=palCols[Math.floor(rng()*palCols.length)];
      ctx.globalAlpha=gop;
      ctx.fillStyle=gc;
      ctx.fillRect(gx,gy,gs,gs);
    }
  }

  /* Layer 5: Resonance bloom — emotional intensity creates luminous halos */
  if(dims.res>0.4){
    var nBloom=Math.floor(dims.res*6)+1;
    for(var b=0;b<nBloom;b++){
      var bx=W*(0.15+rng()*0.7), by=H*(0.15+rng()*0.7);
      var br=30+dims.space*100+rng()*80;
      var bop=0.02+dims.res*0.08;
      var bc=palCols[Math.floor(rng()*palCols.length)];
      var bGrd=ctx.createRadialGradient(bx,by,0,bx,by,br);
      bGrd.addColorStop(0,hexAlpha(bc,bop*3));
      bGrd.addColorStop(0.4,hexAlpha(bc,bop));
      bGrd.addColorStop(1,hexAlpha(bc,0));
      ctx.globalAlpha=1;
      ctx.fillStyle=bGrd;
      ctx.fillRect(bx-br,by-br,br*2,br*2);
    }
  }

  /* Layer 6: Warmth veil — overlay warm or cool cast */
  ctx.globalAlpha=0.06*dims.res;
  if(warm>0.5){
    var wg=ctx.createRadialGradient(W*.5,H*.7,0,W*.5,H*.7,W*.8);
    wg.addColorStop(0,'rgba(255,200,100,'+(warm*0.15)+')');
    wg.addColorStop(1,'rgba(255,180,80,0)');
    ctx.fillStyle=wg;
  } else {
    var cg=ctx.createRadialGradient(W*.5,H*.3,0,W*.5,H*.3,W*.8);
    cg.addColorStop(0,'rgba(100,140,220,'+((1-warm)*0.15)+')');
    cg.addColorStop(1,'rgba(80,120,200,0)');
    ctx.fillStyle=cg;
  }
  ctx.globalAlpha=1;
  ctx.fillRect(0,0,W,H);

  ctx.restore();
}

/* ── Hex to rgba helper ── */
function hexAlpha(hex,a){
  if(!hex||hex.length<7)return'rgba(180,140,255,'+a+')';
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return'rgba('+r+','+g+','+b+','+a+')';
}

/* ── Build architecture list ── */
function buildArchList(){
  var list=document.getElementById('mbd-arch-list');
  if(!list)return;
  list.innerHTML='';
  ARCHITECTURES.forEach(function(a){
    var row=document.createElement('div');
    row.id='mbd-ar-'+a.id;
    row.style.cssText='cursor:pointer;padding:4px 8px;border:1px solid #120a1e;margin-bottom:3px;border-radius:2px;transition:border-color .1s;';
    row.innerHTML='<div style="font-size:9px;font-weight:600;color:#b48cff;letter-spacing:.05em;">'+(a.id+1)+'. '+a.name+'</div>'+
      '<div style="font-size:8px;color:#97c3b0;margin-top:1px;font-style:italic;line-height:1.4;">"'+a.phrase+'"</div>';
    row.addEventListener('mouseenter',function(){if(M.selArch!==a.id)this.style.borderColor='rgba(180,140,255,0.3)';});
    row.addEventListener('mouseleave',function(){if(M.selArch!==a.id)this.style.borderColor='#120a1e';});
    row.addEventListener('click',function(){selectArch(a);});
    list.appendChild(row);
  });
}

function highlightArch(id){
  ARCHITECTURES.forEach(function(a){
    var row=document.getElementById('mbd-ar-'+a.id);
    if(!row)return;
    row.style.borderColor=a.id===id?'#b48cff':'#120a1e';
    row.style.background=a.id===id?'rgba(180,140,255,0.07)':'';
  });
}

function setDims(d){
  M.warm=d.warm;M.weight=d.weight;M.time=d.time;
  M.dis=d.dis;M.tex=d.tex;M.space=d.space;M.res=d.res;
  var setSl=function(id,v){var e=document.getElementById(id);if(e)e.value=Math.round(v*100);};
  var setV =function(id,v){var e=document.getElementById(id);if(e)e.textContent=Math.round(v*100)+'%';};
  setSl('mbd-warm',d.warm);setV('mbd-warm-v',d.warm);
  setSl('mbd-weight',d.weight);setV('mbd-weight-v',d.weight);
  setSl('mbd-time',d.time);setV('mbd-time-v',d.time);
  setSl('mbd-dis',d.dis);setV('mbd-dis-v',d.dis);
  setSl('mbd-tex',d.tex);setV('mbd-tex-v',d.tex);
  setSl('mbd-space',d.space);setV('mbd-space-v',d.space);
  setSl('mbd-res',d.res);setV('mbd-res-v',d.res);
}

function selectArch(a){
  M.selArch=a.id;
  var inp=document.getElementById('mbd-input');
  if(inp)inp.value=a.phrase;
  setDims(a);
  highlightArch(a.id);
  if(window.genUndoPush)window.genUndoPush();
  window._MBD.render();
  var cl=document.getElementById('mbd-cycle-label'),cn=document.getElementById('mbd-cycle-name');
  if(cl)cl.style.display='block';
  if(cn)cn.textContent='('+(a.id+1)+'/'+ARCHITECTURES.length+') '+a.name;
}

/* ── Wire sliders ── */
function wireSliders(){
  var regenTimer=null;
  function debounce(){clearTimeout(regenTimer);regenTimer=setTimeout(function(){window._MBD.render();},120);}
  function sl(id,valId,setter){
    var el=document.getElementById(id),vl=document.getElementById(valId);
    if(!el)return;
    el.addEventListener('input',function(){
      var v=parseInt(this.value)/100;setter(v);
      if(vl)vl.textContent=Math.round(v*100)+'%';
      debounce();
    });
  }
  sl('mbd-warm','mbd-warm-v',function(v){M.warm=v;});
  sl('mbd-weight','mbd-weight-v',function(v){M.weight=v;});
  sl('mbd-time','mbd-time-v',function(v){M.time=v;});
  sl('mbd-dis','mbd-dis-v',function(v){M.dis=v;});
  sl('mbd-tex','mbd-tex-v',function(v){M.tex=v;});
  sl('mbd-space','mbd-space-v',function(v){M.space=v;});
  sl('mbd-res','mbd-res-v',function(v){M.res=v;});
  /* Parse text input on change */
  var inp=document.getElementById('mbd-input');
  if(inp){
    inp.addEventListener('input',function(){
      if(!this.value.trim())return;
      var d=parseMemory(this.value);
      setDims(d);
    });
  }
}

/* ── Public API ── */
window._MBD={
  render:function(){
    if(window.genUndoPush)window.genUndoPush();
    var dv=document.getElementById('dv');
    var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
    if(!lctx||!dv)return;
    var W=dv.width,H=dv.height;
    /* Use current memory text OR arch phrase as seed source */
    var txt=document.getElementById('mbd-input');
    var phrase=txt&&txt.value.trim()?txt.value.trim():(M.selArch>=0?ARCHITECTURES[M.selArch].phrase:'memory');
    /* Seed from phrase hash */
    var seed=0;for(var i=0;i<phrase.length;i++)seed=(seed*31+phrase.charCodeAt(i))>>>0;
    /* Palette */
    var palObj=typeof gpal==='function'?gpal():null;
    var palCols=palObj&&palObj.c&&palObj.c.length?palObj.c:['#b48cff','#d0b8ff','#7a5caa','#e8d5ff','#4a2a6a','#c090e0'];
    /* Render — clear first (independent) unless engine-connected */
    if(window._ENG_CONNECT){
      /* connected: paint on top of engine */
    } else {
      lctx.clearRect(0,0,W,H);
    }
    /* Image Signal: blend image-extracted dims when active */
    var _renderDims=M;
    if(window._IS&&window._IS.active){
      var _isd=window._IS.getMBDDims();
      if(_isd)_renderDims=Object.assign({},M,{warm:M.warm*(1-window._IS.influence)+_isd.warm*window._IS.influence,weight:M.weight*(1-window._IS.influence)+_isd.weight*window._IS.influence,time:M.time*(1-window._IS.influence)+_isd.time*window._IS.influence,dis:M.dis*(1-window._IS.influence)+_isd.dis*window._IS.influence,tex:M.tex*(1-window._IS.influence)+_isd.tex*window._IS.influence});
    }
    renderMemory(lctx,W,H,_renderDims,seed,palCols);
    if(window._layersCompositeFn)window._layersCompositeFn();
    if(window._layersUpdateThumbs)window._layersUpdateThumbs();
    var st=document.getElementById('mbd-status');
    var arch=M.selArch>=0?ARCHITECTURES[M.selArch].name:'custom inscription';
    if(st)st.textContent='Inscribed: '+arch+' \u2014 seed 0x'+seed.toString(16).toUpperCase().padStart(8,'0');
  },
  clear:function(){
    var inp=document.getElementById('mbd-input');if(inp)inp.value='';
    M.selArch=-1;
    highlightArch(-1);
    var cl=document.getElementById('mbd-cycle-label');if(cl)cl.style.display='none';
  },
  cycle:function(){
    M.cycleIdx=(M.cycleIdx+1)%ARCHITECTURES.length;
    selectArch(ARCHITECTURES[M.cycleIdx]);
  },
  /* Palette reactivity */
  onPaletteChange:function(){window._MBD.render();}
};

/* ── Init ── */
setTimeout(function(){
  buildArchList();
  wireSliders();
},400);

})();
