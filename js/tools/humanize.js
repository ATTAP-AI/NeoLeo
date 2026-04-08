/* ══════════════════════════════════════════════════════════════
   HUMANIZE FILTER — Floating panel with real-time preview
   7-pass correlated imperfection filter
   ══════════════════════════════════════════════════════════════ */
(function(){

/* ── Simple Perlin-like value noise ── */
var _hPerm=[];
(function(){for(var i=0;i<512;i++)_hPerm[i]=Math.random()*2-1;})();
function _hNoise(x,y){
  var ix=Math.floor(x)&255,iy=Math.floor(y)&255;
  var fx=x-Math.floor(x),fy=y-Math.floor(y);
  var sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  var n00=_hPerm[(ix+iy*17)&511],n10=_hPerm[(ix+1+iy*17)&511];
  var n01=_hPerm[(ix+(iy+1)*17)&511],n11=_hPerm[(ix+1+(iy+1)*17)&511];
  return n00*(1-sx)*(1-sy)+n10*sx*(1-sy)+n01*(1-sx)*sy+n11*sx*sy;
}
function _hFbm(x,y,oct){
  var v=0,a=1,f=1,t=0;
  for(var i=0;i<oct;i++){v+=_hNoise(x*f,y*f)*a;t+=a;a*=0.5;f*=2;}
  return v/t;
}

/* ── Sobel edge detection ── */
function sobelEdges(imgData,W,H){
  var d=imgData.data,edges=new Float32Array(W*H);
  for(var y=1;y<H-1;y++){
    for(var x=1;x<W-1;x++){
      var idx=function(px,py){return((py*W+px)*4);};
      var lum=function(px,py){var j=idx(px,py);return 0.299*d[j]+0.587*d[j+1]+0.114*d[j+2];};
      var gx=-lum(x-1,y-1)-2*lum(x-1,y)-lum(x-1,y+1)+lum(x+1,y-1)+2*lum(x+1,y)+lum(x+1,y+1);
      var gy=-lum(x-1,y-1)-2*lum(x,y-1)-lum(x+1,y-1)+lum(x-1,y+1)+2*lum(x,y+1)+lum(x+1,y+1);
      edges[y*W+x]=Math.sqrt(gx*gx+gy*gy);
    }
  }
  return edges;
}

/* ── Apply Humanize (pure function, no undo push) ── */
function runHumanize(srcData,W,H,params){
  var sd=srcData.data;
  var dst=new ImageData(W,H);
  var dd=dst.data;
  for(var i=0;i<sd.length;i++)dd[i]=sd[i];

  var master=params.amount/100;
  var edges=sobelEdges(srcData,W,H);
  var noiseScale=0.015;

  /* Pass 1: Wobble — 3x stronger displacement */
  var wobStr=master*(params.wobble/100)*18;
  if(wobStr>0.1){
    var wSrc=new Uint8ClampedArray(dd);
    for(var y=0;y<H;y++){for(var x=0;x<W;x++){
      var nx=_hFbm(x*noiseScale,y*noiseScale,3)*wobStr;
      var ny=_hFbm(x*noiseScale+100,y*noiseScale+100,3)*wobStr;
      var sx=Math.max(0,Math.min(W-1,Math.round(x+nx)));
      var sy=Math.max(0,Math.min(H-1,Math.round(y+ny)));
      var di=(y*W+x)*4,si2=(sy*W+sx)*4;
      dd[di]=wSrc[si2];dd[di+1]=wSrc[si2+1];dd[di+2]=wSrc[si2+2];dd[di+3]=wSrc[si2+3];
    }}
  }

  /* Pass 2: Pressure Variation — 4x stronger, lower threshold */
  var preStr=master*(params.pressure/100)*1.5;
  if(preStr>0.01){
    for(var y2=0;y2<H;y2++){for(var x2=0;x2<W;x2++){
      var e=edges[y2*W+x2]/255;if(e<0.02)continue;
      var pv=_hFbm(x2*0.008,y2*0.008+50,2)*preStr;
      var di2=(y2*W+x2)*4;var f2=1+pv*e;
      dd[di2]=Math.max(0,Math.min(255,dd[di2]*f2));
      dd[di2+1]=Math.max(0,Math.min(255,dd[di2+1]*f2));
      dd[di2+2]=Math.max(0,Math.min(255,dd[di2+2]*f2));
    }}
  }

  /* Pass 3: Edge Roughening — 2.7x stronger, lower threshold */
  var edgStr=master*(params.edgeRough/100)*80;
  if(edgStr>0.5){
    for(var y3=1;y3<H-1;y3++){for(var x3=1;x3<W-1;x3++){
      var e3=edges[y3*W+x3]/255;if(e3<0.08)continue;
      var rn=(Math.random()-0.5)*edgStr*e3;
      var di3=(y3*W+x3)*4;
      dd[di3]=Math.max(0,Math.min(255,dd[di3]+rn));
      dd[di3+1]=Math.max(0,Math.min(255,dd[di3+1]+rn*0.9));
      dd[di3+2]=Math.max(0,Math.min(255,dd[di3+2]+rn*0.8));
    }}
  }

  /* Pass 4: Ink Pooling — 3x stronger, lower threshold */
  var inkStr=master*(params.inkPool/100)*0.8;
  if(inkStr>0.01){
    for(var y4=2;y4<H-2;y4++){for(var x4=2;x4<W-2;x4++){
      var eDensity=0;
      for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++)eDensity+=edges[(y4+dy)*W+(x4+dx)]/255;
      eDensity/=25;
      if(eDensity>0.1){var pool=eDensity*inkStr;var di4=(y4*W+x4)*4;
        dd[di4]=Math.max(0,dd[di4]*(1-pool));dd[di4+1]=Math.max(0,dd[di4+1]*(1-pool));dd[di4+2]=Math.max(0,dd[di4+2]*(1-pool));}
    }}
  }

  /* Pass 5: Colour Drift — 3x stronger hue + sat shift */
  var driStr=master*(params.colourDrift/100)*40;
  if(driStr>0.3){
    for(var y5=0;y5<H;y5++){for(var x5=0;x5<W;x5++){
      var di5=(y5*W+x5)*4;
      var hShift=_hFbm(x5*0.003,y5*0.003+200,2)*driStr;
      var sShift=_hFbm(x5*0.004+300,y5*0.004,2)*driStr*0.8;
      var r5=dd[di5],g5=dd[di5+1],b5=dd[di5+2];
      var cosH=Math.cos(hShift*Math.PI/180),sinH=Math.sin(hShift*Math.PI/180);
      dd[di5]=Math.max(0,Math.min(255,r5*(.7+.3*cosH)+g5*(-.6*sinH)+b5*(.3-.3*cosH)));
      dd[di5+1]=Math.max(0,Math.min(255,r5*(.6*sinH)+g5*(.7+.3*cosH)+b5*(-.6*sinH)));
      dd[di5+2]=Math.max(0,Math.min(255,r5*(.3-.3*cosH)+g5*(.6*sinH)+b5*(.7+.3*cosH)));
      var gray=(dd[di5]*0.299+dd[di5+1]*0.587+dd[di5+2]*0.114);var sFac=1+sShift*0.04;
      dd[di5]=Math.max(0,Math.min(255,gray+(dd[di5]-gray)*sFac));
      dd[di5+1]=Math.max(0,Math.min(255,gray+(dd[di5+1]-gray)*sFac));
      dd[di5+2]=Math.max(0,Math.min(255,gray+(dd[di5+2]-gray)*sFac));
    }}
  }

  /* Pass 6: Paper Texture — 3.5x stronger */
  var papStr=master*(params.paper/100)*1.2;
  if(papStr>0.01){
    for(var y6=0;y6<H;y6++){for(var x6=0;x6<W;x6++){
      var di6=(y6*W+x6)*4;
      var grain=_hFbm(x6*0.05,y6*0.05+400,3);
      var fine=(Math.random()-0.5)*0.5;
      var tex=(grain*0.7+fine*0.3)*papStr;
      dd[di6]=Math.max(0,Math.min(255,dd[di6]*(1+tex)));
      dd[di6+1]=Math.max(0,Math.min(255,dd[di6+1]*(1+tex)));
      dd[di6+2]=Math.max(0,Math.min(255,dd[di6+2]*(1+tex)));
    }}
  }

  return dst;
}

/* ── Panel state ── */
var hpEl=null,hpOpen=false,hpUserClosed=false,hpPos=null;
var _humSnap=null;       /* flattened composite for humanize source */
var _humFullSnap=null;   /* full multi-canvas state for revert */
var _humDebounce=null;

function sliderRow(id,label,val){
  return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
    +'<span style="font-size:8px;color:rgba(255,255,255,0.65);letter-spacing:.06em;text-transform:uppercase;min-width:60px;line-height:1.5;">'+label+'</span>'
    +'<input type="range" id="'+id+'" min="0" max="100" value="'+val+'" style="flex:1;height:3px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.15);outline:none;cursor:pointer;border-radius:2px;">'
    +'<span id="'+id+'-v" style="font-size:9px;color:rgba(255,255,255,0.7);min-width:30px;text-align:right;">'+val+'%</span>'
    +'</div>';
}

function buildHumPanel(){
  if(hpEl)return;

  var sty=document.createElement('style');
  sty.textContent=[
    '#hum-panel{display:none;position:fixed;z-index:610;',
    '  width:330px;max-height:calc(100vh - 40px);',
    '  background:#1a3322;',
    '  border:1px solid rgba(255,255,255,0.2);border-radius:8px;',
    '  box-shadow:0 10px 50px rgba(0,0,0,0.85);',
    '  font-family:inherit;overflow:hidden;',
    '  flex-direction:column;}',
    '#hum-panel.open{display:flex;}',
    '#hp-head{display:flex;align-items:center;justify-content:space-between;',
    '  padding:10px 14px;',
    '  border-bottom:1px solid rgba(255,255,255,0.1);',
    '  background:rgba(0,0,0,0.15);flex-shrink:0;',
    '  cursor:grab;user-select:none;-webkit-user-select:none;',
    '  border-radius:8px 8px 0 0;}',
    '#hp-head::before{content:"⠿";color:rgba(255,255,255,0.2);',
    '  font-size:14px;margin-right:8px;line-height:1;}',
    '#hum-panel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;',
    '  width:12px;height:12px;border-radius:50%;background:#ffffff;cursor:pointer;border:none;}',
  ].join('\n');
  document.head.appendChild(sty);

  hpEl=document.createElement('div');
  hpEl.id='hum-panel';
  hpEl.innerHTML=[
    '<div id="hp-head">',
    '  <div>',
    '    <div style="font-size:10px;letter-spacing:.2em;color:#ffffff;text-transform:uppercase;font-weight:700;line-height:1.6;">✋ Humanize</div>',
    '    <div style="font-size:8px;color:rgba(255,255,255,0.45);margin-top:2px;line-height:1.5;letter-spacing:.06em;">Drag sliders for real-time preview</div>',
    '  </div>',
    '  <button id="hp-close" style="background:none;border:1px solid rgba(255,255,255,0.2);color:#ff9742;font-size:9px;letter-spacing:.08em;padding:4px 10px;cursor:pointer;border-radius:3px;font-family:inherit;line-height:1.4;flex-shrink:0;">Close</button>',
    '</div>',

    '<div style="padding:14px 14px 10px;overflow-y:auto;flex:1;">',
    sliderRow('hum-amt','Amount',50),
    '<div style="height:1px;background:rgba(255,255,255,0.08);margin:4px 0 10px;"></div>',
    sliderRow('hum-wob','Wobble',50),
    sliderRow('hum-pre','Pressure',40),
    sliderRow('hum-edg','Edge Rough',45),
    sliderRow('hum-ink','Ink Pool',35),
    sliderRow('hum-dri','Colour Drift',30),
    sliderRow('hum-pap','Paper',25),

    /* Comparison thumbnails */
    '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">',
    '  <div style="display:flex;gap:8px;">',
    '    <div style="flex:1;text-align:center;">',
    '      <div style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;line-height:1.5;">Original</div>',
    '      <canvas id="hum-thumb-orig" width="140" height="105" style="width:100%;height:auto;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:#111;display:block;"></canvas>',
    '    </div>',
    '    <div style="flex:1;text-align:center;">',
    '      <div style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;line-height:1.5;">Preview</div>',
    '      <canvas id="hum-thumb-prev" width="140" height="105" style="width:100%;height:auto;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:#111;display:block;"></canvas>',
    '    </div>',
    '  </div>',
    '</div>',

    '<div style="display:flex;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);">',
    '  <button id="hum-apply-btn" style="flex:1;padding:7px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.35);color:#ffffff;font-family:inherit;font-size:10px;cursor:pointer;letter-spacing:.1em;text-transform:uppercase;font-weight:700;border-radius:4px;">✓ Apply</button>',
    '  <button id="hum-revert-btn" style="flex:0.6;padding:7px;background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);font-family:inherit;font-size:9px;cursor:pointer;letter-spacing:.06em;border-radius:4px;">Revert</button>',
    '  <button id="hum-reset-btn" style="flex:0.5;padding:7px;background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);font-family:inherit;font-size:9px;cursor:pointer;letter-spacing:.06em;border-radius:4px;">Reset</button>',
    '</div>',
    '</div>',
  ].join('\n');
  document.body.appendChild(hpEl);

  /* ── Drag header ── */
  var head=document.getElementById('hp-head');
  head.addEventListener('mousedown',function(e){
    if(e.target.id==='hp-close'||e.target.closest('#hp-close'))return;
    e.preventDefault();head.style.cursor='grabbing';
    var r=hpEl.getBoundingClientRect();
    var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
    function mv(ev){
      var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
      var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
      hpEl.style.left=nl+'px';hpEl.style.top=nt+'px';
      hpPos={left:nl,top:nt};
    }
    function up(){head.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });

  /* ── Close ── */
  document.getElementById('hp-close').addEventListener('click',function(e){
    e.stopPropagation();
    hpUserClosed=true;
    closeHumPanel();
  });

  /* ── Read params from sliders ── */
  function getParams(){
    return {
      amount:parseInt(document.getElementById('hum-amt').value)||50,
      wobble:parseInt(document.getElementById('hum-wob').value)||50,
      pressure:parseInt(document.getElementById('hum-pre').value)||40,
      edgeRough:parseInt(document.getElementById('hum-edg').value)||45,
      inkPool:parseInt(document.getElementById('hum-ink').value)||35,
      colourDrift:parseInt(document.getElementById('hum-dri').value)||30,
      paper:parseInt(document.getElementById('hum-pap').value)||25
    };
  }

  /* ── Update thumbnail canvases ── */
  function updateOrigThumb(){
    var tc=document.getElementById('hum-thumb-orig');
    if(!tc||!_humSnap)return;
    var c=tc.getContext('2d');
    c.clearRect(0,0,tc.width,tc.height);
    /* Draw from snapshot ImageData via temp canvas */
    var tmp=document.createElement('canvas');
    tmp.width=_humSnap.width;tmp.height=_humSnap.height;
    tmp.getContext('2d').putImageData(_humSnap,0,0);
    c.drawImage(tmp,0,0,tc.width,tc.height);
  }

  function updatePreviewThumb(resultData){
    var tc=document.getElementById('hum-thumb-prev');
    if(!tc||!resultData)return;
    var c=tc.getContext('2d');
    c.clearRect(0,0,tc.width,tc.height);
    var tmp=document.createElement('canvas');
    tmp.width=resultData.width;tmp.height=resultData.height;
    tmp.getContext('2d').putImageData(resultData,0,0);
    c.drawImage(tmp,0,0,tc.width,tc.height);
  }

  /* ── Flatten all canvases and capture snapshot ── */
  function flattenForHumanize(){
    var cvEl=document.getElementById('cv'),dvEl=document.getElementById('dv'),
        uvEl=document.getElementById('uv'),lvEl=document.getElementById('lv'),
        avEl=document.getElementById('av');
    if(!cvEl)return;
    var W=cvEl.width,H=cvEl.height;
    var cctx=cvEl.getContext('2d');

    /* If Naturalize has a live preview active, commit it first so we
       capture those effects in the flattened composite */
    if(window._natIsActive&&window._natIsActive()&&window._natClearSnap){
      window._natClearSnap(); /* clear snap so Naturalize treats cv as committed */
    }

    /* Save full state of ALL canvases for revert */
    _humFullSnap={
      cv:cctx.getImageData(0,0,W,H),
      dv:dvEl?dvEl.getContext('2d').getImageData(0,0,W,H):null,
      uv:uvEl?uvEl.getContext('2d').getImageData(0,0,W,H):null,
      lv:lvEl?lvEl.getContext('2d').getImageData(0,0,W,H):null,
      av:avEl?avEl.getContext('2d').getImageData(0,0,W,H):null,
      filter:document.getElementById('cvwrap')?document.getElementById('cvwrap').style.filter:'none',
      lvFilter:lvEl?lvEl.style.filter:''
    };

    /* Composite all layers onto cv */
    if(uvEl)cctx.drawImage(uvEl,0,0);
    /* cv already has engine content */
    if(lvEl){cctx.save();cctx.globalCompositeOperation='screen';cctx.drawImage(lvEl,0,0);cctx.restore();}
    if(dvEl)cctx.drawImage(dvEl,0,0);

    /* Apply CSS color grade if atmosphere is on */
    var wrap=document.getElementById('cvwrap');
    var cssFilter=wrap?wrap.style.filter:'none';
    if(cssFilter&&cssFilter!=='none'){
      var tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;
      var tc=tmp.getContext('2d');
      tc.filter=cssFilter;
      tc.drawImage(cvEl,0,0);
      cctx.clearRect(0,0,W,H);
      cctx.drawImage(tmp,0,0);
      wrap.style.filter='none';
    }

    if(avEl)cctx.drawImage(avEl,0,0);

    /* Clear all other canvases */
    if(dvEl)dvEl.getContext('2d').clearRect(0,0,W,H);
    if(uvEl)uvEl.getContext('2d').clearRect(0,0,W,H);
    if(lvEl){lvEl.getContext('2d').clearRect(0,0,W,H);lvEl.style.filter='';}
    if(avEl)avEl.getContext('2d').clearRect(0,0,W,H);

    /* Reset layers */
    if(window._layersReset)window._layersReset();

    /* Save flattened composite as humanize source */
    _humSnap=cctx.getImageData(0,0,W,H);
    updateOrigThumb();
  }

  /* ── Restore all canvases from full snapshot ── */
  function revertAll(){
    if(!_humFullSnap)return;
    var cvEl=document.getElementById('cv'),dvEl=document.getElementById('dv'),
        uvEl=document.getElementById('uv'),lvEl=document.getElementById('lv'),
        avEl=document.getElementById('av');
    if(cvEl&&_humFullSnap.cv)cvEl.getContext('2d').putImageData(_humFullSnap.cv,0,0);
    if(dvEl&&_humFullSnap.dv)dvEl.getContext('2d').putImageData(_humFullSnap.dv,0,0);
    if(uvEl&&_humFullSnap.uv)uvEl.getContext('2d').putImageData(_humFullSnap.uv,0,0);
    if(lvEl&&_humFullSnap.lv){lvEl.getContext('2d').putImageData(_humFullSnap.lv,0,0);lvEl.style.filter=_humFullSnap.lvFilter||'';}
    if(avEl&&_humFullSnap.av)avEl.getContext('2d').putImageData(_humFullSnap.av,0,0);
    var wrap=document.getElementById('cvwrap');
    if(wrap)wrap.style.filter=_humFullSnap.filter||'none';
    /* Re-composite layers */
    if(window._layersCompositeFn)window._layersCompositeFn();
    _humSnap=null;
    _humFullSnap=null;
  }

  /* ── Live preview: debounced re-render ── */
  function livePreview(){
    if(_humDebounce)clearTimeout(_humDebounce);
    _humDebounce=setTimeout(function(){
      var cvEl=document.getElementById('cv');
      if(!cvEl||!_humSnap)return;
      var tctx=cvEl.getContext('2d');
      var W=cvEl.width,H=cvEl.height;
      var params=getParams();
      if(params.amount===0){
        tctx.putImageData(_humSnap,0,0);
        updatePreviewThumb(_humSnap);
        return;
      }
      var result=runHumanize(_humSnap,W,H,params);
      tctx.putImageData(result,0,0);
      updatePreviewThumb(result);
      var si=document.getElementById('si');
      if(si)si.textContent='Humanize preview ('+params.amount+'%)';
    },60);
  }

  /* ── Wire all sliders for live preview ── */
  ['hum-amt','hum-wob','hum-pre','hum-edg','hum-ink','hum-dri','hum-pap'].forEach(function(id){
    var el=document.getElementById(id);
    var vl=document.getElementById(id+'-v');
    if(el)el.addEventListener('input',function(){
      if(vl)vl.textContent=el.value+'%';
      /* Flatten and capture on first interaction */
      if(!_humSnap){
        flattenForHumanize();
      }
      livePreview();
    });
  });

  /* ── Apply: commit current preview, push undo ── */
  document.getElementById('hum-apply-btn').addEventListener('click',function(){
    if(!_humSnap){
      var si2=document.getElementById('si');if(si2)si2.textContent='Move a slider first';return;
    }
    if(window.genUndoPush)window.genUndoPush();
    _humSnap=null;
    _humFullSnap=null;
    /* Notify Naturalize to recapture from the committed humanized state */
    if(window._natClearSnap)window._natClearSnap();
    /* Mark thumbnails as committed */
    var to=document.getElementById('hum-thumb-orig');
    if(to){var tc2=to.getContext('2d');tc2.clearRect(0,0,to.width,to.height);
      tc2.fillStyle='rgba(255,255,255,0.06)';tc2.fillRect(0,0,to.width,to.height);
      tc2.fillStyle='rgba(255,255,255,0.3)';tc2.font='9px sans-serif';tc2.textAlign='center';
      tc2.fillText('Applied',to.width/2,to.height/2+3);}
    var si=document.getElementById('si');
    if(si)si.textContent='Humanize applied';
    if(window._onCvRender)window._onCvRender('Humanize');
    if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
  });

  /* ── Revert: restore all canvases to pre-humanize state ── */
  document.getElementById('hum-revert-btn').addEventListener('click',function(){
    revertAll();
    /* Clear thumbnails */
    var to=document.getElementById('hum-thumb-orig');if(to)to.getContext('2d').clearRect(0,0,to.width,to.height);
    var tp=document.getElementById('hum-thumb-prev');if(tp)tp.getContext('2d').clearRect(0,0,tp.width,tp.height);
    var si=document.getElementById('si');
    if(si)si.textContent='Humanize reverted';
  });

  /* ── Reset sliders to defaults ── */
  document.getElementById('hum-reset-btn').addEventListener('click',function(){
    var defs={amt:50,wob:50,pre:40,edg:45,ink:35,dri:30,pap:25};
    Object.keys(defs).forEach(function(k){
      var el=document.getElementById('hum-'+k);
      var vl=document.getElementById('hum-'+k+'-v');
      if(el)el.value=defs[k];
      if(vl)vl.textContent=defs[k]+'%';
    });
    if(_humSnap)livePreview();
  });
}

function openHumPanel(){
  buildHumPanel();
  if(hpOpen)return;
  hpOpen=true;
  if(hpPos){
    hpEl.style.left=hpPos.left+'px';hpEl.style.top=hpPos.top+'px';
  } else {
    var tb=document.getElementById('tb');
    if(tb){var r=tb.getBoundingClientRect();hpEl.style.left=Math.max(4,r.left-338)+'px';hpEl.style.top='10px';}
    else{hpEl.style.left='50px';hpEl.style.top='40px';}
  }
  hpEl.classList.add('open');
  /* Fresh state on open */
  _humSnap=null;_humFullSnap=null;
  var to2=document.getElementById('hum-thumb-orig');if(to2)to2.getContext('2d').clearRect(0,0,to2.width,to2.height);
  var tp2=document.getElementById('hum-thumb-prev');if(tp2)tp2.getContext('2d').clearRect(0,0,tp2.width,tp2.height);
}

function closeHumPanel(){
  hpOpen=false;
  if(hpEl)hpEl.classList.remove('open');
  /* If preview is active but not applied, revert ALL canvases */
  if(_humSnap&&_humFullSnap){
    var cvEl=document.getElementById('cv'),dvEl=document.getElementById('dv'),
        uvEl=document.getElementById('uv'),lvEl=document.getElementById('lv'),
        avEl=document.getElementById('av');
    if(cvEl&&_humFullSnap.cv)cvEl.getContext('2d').putImageData(_humFullSnap.cv,0,0);
    if(dvEl&&_humFullSnap.dv)dvEl.getContext('2d').putImageData(_humFullSnap.dv,0,0);
    if(uvEl&&_humFullSnap.uv)uvEl.getContext('2d').putImageData(_humFullSnap.uv,0,0);
    if(lvEl&&_humFullSnap.lv){lvEl.getContext('2d').putImageData(_humFullSnap.lv,0,0);lvEl.style.filter=_humFullSnap.lvFilter||'';}
    if(avEl&&_humFullSnap.av)avEl.getContext('2d').putImageData(_humFullSnap.av,0,0);
    var wrap=document.getElementById('cvwrap');
    if(wrap)wrap.style.filter=_humFullSnap.filter||'none';
    if(window._layersCompositeFn)window._layersCompositeFn();
    _humSnap=null;_humFullSnap=null;
  }
}

/* ── Hook into tool selection ── */
var _prevSetToolPS3=window.setTool_ps;
window.setTool_ps=function(t){
  if(_prevSetToolPS3)_prevSetToolPS3(t);
  if(t==='humanize'){
    hpUserClosed=false;
    openHumPanel();
  } else {
    closeHumPanel();
  }
};
var _origOpenHP=openHumPanel;
openHumPanel=function(){
  if(hpUserClosed)return;
  _origOpenHP();
};

})();
