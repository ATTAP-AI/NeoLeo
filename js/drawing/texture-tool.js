/* ══════════════════════════════════════════════════════════════
   TEXTURE-TOOL  --  Texture Map Tool + Picker Panel
   Extracted from NeoLeo monolith (lines ~9080-9646)
   10 procedural textures, texture stamp function, picker panel
   Plain JS, window.* globals, NO ES modules
   ══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   TEXTURE MAP TOOL -- 10 procedural texture types
   Stamps circular tiles clipped to soft-edged brush region
   ══════════════════════════════════════════════════════════════ */
(function(){

var texType='noise';
var texScale=50;

/* Wire selector and scale slider */
setTimeout(function(){
  var sel=document.getElementById('tex-type');
  if(sel)sel.addEventListener('change',function(){texType=sel.value;});
  var scl=document.getElementById('tex-scale');
  var sclv=document.getElementById('tex-scale-v');
  if(scl)scl.addEventListener('input',function(){texScale=parseInt(scl.value);if(sclv)sclv.textContent=scl.value+'%';});
},300);

/* ── Texture generators: each draws pattern into a temp canvas ── */
function genTexture(type,W,H,col,scale){
  var tc=document.createElement('canvas');tc.width=W;tc.height=H;
  var c=tc.getContext('2d');
  var r=parseInt(col.slice(1,3),16),g=parseInt(col.slice(3,5),16),b=parseInt(col.slice(5,7),16);
  var s=Math.max(2,Math.round(scale/10));
  c.clearRect(0,0,W,H);

  if(type==='noise'){
    var cnt=Math.round(W*H*0.08*(scale/50));
    for(var i=0;i<cnt;i++){
      var px=Math.random()*W|0,py=Math.random()*H|0;
      var a=(0.2+Math.random()*0.6);
      c.fillStyle='rgba('+r+','+g+','+b+','+a.toFixed(3)+')';
      c.fillRect(px,py,1+Math.random()*2|0,1+Math.random()*2|0);
    }
  }
  else if(type==='crosshatch'){
    var sp=Math.max(3,s);
    c.strokeStyle='rgba('+r+','+g+','+b+',0.5)';c.lineWidth=0.8;
    for(var y=0;y<H;y+=sp){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    for(var x=0;x<W;x+=sp){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
    c.strokeStyle='rgba('+r+','+g+','+b+',0.3)';c.lineWidth=0.5;
    for(var d=-Math.max(W,H);d<Math.max(W,H);d+=sp*1.4){
      c.beginPath();c.moveTo(d,0);c.lineTo(d+H,H);c.stroke();
    }
  }
  else if(type==='weave'){
    var ws=Math.max(4,s*1.2)|0;
    for(var wy=0;wy<H;wy+=ws){
      for(var wx=0;wx<W;wx+=ws){
        var isOver=((Math.floor(wx/ws)+Math.floor(wy/ws))%2===0);
        c.fillStyle='rgba('+r+','+g+','+b+','+(isOver?0.5:0.2)+')';
        if(isOver)c.fillRect(wx,wy,ws-1,ws*0.4);
        else c.fillRect(wx,wy+ws*0.3,ws*0.4,ws-1);
      }
    }
  }
  else if(type==='hexgrid'){
    var hr=Math.max(4,s*0.8);
    var hh=hr*Math.sqrt(3);
    c.strokeStyle='rgba('+r+','+g+','+b+',0.5)';c.lineWidth=0.8;
    for(var row=0;row*hh*0.75<H+hh;row++){
      for(var col2=0;col2*(hr*1.5)<W+hr*2;col2++){
        var cx=col2*hr*1.5;
        var cy=row*hh*0.75+(col2%2?hh*0.375:0);
        c.beginPath();
        for(var v=0;v<6;v++){
          var a2=Math.PI/6+v*Math.PI/3;
          var px2=cx+Math.cos(a2)*hr*0.5;
          var py2=cy+Math.sin(a2)*hr*0.5;
          v===0?c.moveTo(px2,py2):c.lineTo(px2,py2);
        }
        c.closePath();c.stroke();
      }
    }
  }
  else if(type==='dotmatrix'){
    var ds=Math.max(3,s);
    var dr=Math.max(1,ds*0.2);
    c.fillStyle='rgba('+r+','+g+','+b+',0.55)';
    for(var dy=ds/2;dy<H;dy+=ds){
      for(var dx=ds/2;dx<W;dx+=ds){
        c.beginPath();c.arc(dx,dy,dr,0,Math.PI*2);c.fill();
      }
    }
  }
  else if(type==='woodgrain'){
    var cx2=W/2+Math.random()*W*0.3-W*0.15;
    var cy2=H/2+Math.random()*H*0.3-H*0.15;
    var rings=Math.max(5,Math.round(scale*0.4));
    var maxR=Math.max(W,H)*0.8;
    c.strokeStyle='rgba('+r+','+g+','+b+',0.35)';c.lineWidth=0.8;
    for(var ri=1;ri<=rings;ri++){
      var rr=ri/rings*maxR;
      c.beginPath();
      c.ellipse(cx2,cy2,rr,rr*0.6+Math.sin(ri*0.7)*rr*0.15,0.2+Math.sin(ri)*0.1,0,Math.PI*2);
      c.stroke();
    }
  }
  else if(type==='brick'){
    var bw=Math.max(8,s*2),bh=Math.max(4,s);
    c.strokeStyle='rgba('+r+','+g+','+b+',0.45)';c.lineWidth=0.8;
    for(var by=0;by<H;by+=bh){
      var off=(Math.floor(by/bh)%2)*bw*0.5;
      for(var bx=-bw;bx<W+bw;bx+=bw){
        c.strokeRect(bx+off,by,bw-1,bh-1);
      }
    }
  }
  else if(type==='wavelines'){
    var wsp=Math.max(4,s);
    var amp=wsp*0.4;
    var freq=Math.PI*2/(wsp*3);
    c.strokeStyle='rgba('+r+','+g+','+b+',0.45)';c.lineWidth=0.8;
    for(var wy2=0;wy2<H;wy2+=wsp){
      c.beginPath();
      for(var wx2=0;wx2<=W;wx2+=2){
        var yy=wy2+Math.sin(wx2*freq)*amp;
        wx2===0?c.moveTo(wx2,yy):c.lineTo(wx2,yy);
      }
      c.stroke();
    }
  }
  else if(type==='circuit'){
    var cs=Math.max(6,s*1.5)|0;
    c.strokeStyle='rgba('+r+','+g+','+b+',0.4)';c.lineWidth=1;
    c.fillStyle='rgba('+r+','+g+','+b+',0.5)';
    for(var cy3=cs;cy3<H;cy3+=cs){
      for(var cx3=cs;cx3<W;cx3+=cs){
        /* Trace */
        var dir=Math.random();
        c.beginPath();c.moveTo(cx3,cy3);
        if(dir<0.5)c.lineTo(cx3+cs,cy3);
        else c.lineTo(cx3,cy3+cs);
        c.stroke();
        /* Pad */
        if(Math.random()<0.3){c.beginPath();c.arc(cx3,cy3,2,0,Math.PI*2);c.fill();}
      }
    }
  }
  else if(type==='lace'){
    var lcx=W/2,lcy=H/2;
    var spokes=Math.max(6,Math.round(scale*0.2));
    var rings2=Math.max(3,Math.round(scale*0.1));
    var maxR2=Math.min(W,H)/2;
    c.strokeStyle='rgba('+r+','+g+','+b+',0.35)';c.lineWidth=0.6;
    c.fillStyle='rgba('+r+','+g+','+b+',0.4)';
    /* Spokes */
    for(var sp=0;sp<spokes;sp++){
      var a3=sp/spokes*Math.PI*2;
      c.beginPath();c.moveTo(lcx,lcy);
      c.lineTo(lcx+Math.cos(a3)*maxR2,lcy+Math.sin(a3)*maxR2);c.stroke();
    }
    /* Rings with beads */
    for(var rr2=1;rr2<=rings2;rr2++){
      var rad=rr2/rings2*maxR2;
      c.beginPath();c.arc(lcx,lcy,rad,0,Math.PI*2);c.stroke();
      for(var sp2=0;sp2<spokes;sp2++){
        var a4=sp2/spokes*Math.PI*2;
        c.beginPath();c.arc(lcx+Math.cos(a4)*rad,lcy+Math.sin(a4)*rad,1.5,0,Math.PI*2);c.fill();
      }
    }
  }
  return tc;
}

/* ── Paint a single texture stamp at (x,y) ── */
window.paintTextureStamp=function(x,y,sz,op){
  var tctx=window._getActiveLayerCtx?window._getActiveLayerCtx():
           (document.getElementById('cv')?document.getElementById('cv').getContext('2d'):null);
  if(!tctx)return;
  var r=Math.max(4,Math.round(sz/2));
  var dia=r*2;
  var col=window.drawCol||'#ff4040';

  /* Generate texture tile */
  var tile=genTexture(texType,dia,dia,col,texScale);

  /* Create soft-edged circular mask */
  var mask=document.createElement('canvas');mask.width=dia;mask.height=dia;
  var mc=mask.getContext('2d');
  var grad=mc.createRadialGradient(r,r,r*0.3,r,r,r);
  grad.addColorStop(0,'rgba(255,255,255,1)');
  grad.addColorStop(0.7,'rgba(255,255,255,0.6)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  mc.fillStyle=grad;mc.fillRect(0,0,dia,dia);
  /* Apply mask to texture */
  mc.globalCompositeOperation='source-in';
  mc.drawImage(tile,0,0);

  /* Stamp onto canvas */
  tctx.save();
  tctx.globalAlpha=op;
  tctx.drawImage(mask,Math.round(x-r),Math.round(y-r));
  tctx.restore();
};

/* ── Expose texture type for HH ── */
window._texTypes=['noise','crosshatch','weave','hexgrid','dotmatrix','woodgrain','brick','wavelines','circuit','lace'];
window._setTexType=function(t){texType=t;var sel=document.getElementById('tex-type');if(sel)sel.value=t;};
window._genTexture=genTexture;

})();

/* ══════════════════════════════════════════════════════════════
   TEXTURE MAP PICKER -- Floating panel with clickable thumbnails
   ══════════════════════════════════════════════════════════════ */
(function(){

var TEX_META=[
  {id:'noise',name:'Noise / Grain',desc:'Random pixel scatter'},
  {id:'crosshatch',name:'Crosshatch',desc:'Ruled lines at multiple angles'},
  {id:'weave',name:'Weave',desc:'Interlocking warp and weft'},
  {id:'hexgrid',name:'Hex Grid',desc:'Repeating hexagonal cells'},
  {id:'dotmatrix',name:'Dot Matrix',desc:'Evenly spaced filled circles'},
  {id:'woodgrain',name:'Wood Grain',desc:'Concentric growth rings'},
  {id:'brick',name:'Brick',desc:'Offset rectangular courses'},
  {id:'wavelines',name:'Wave Lines',desc:'Sinusoidal horizontal bands'},
  {id:'circuit',name:'Circuit Board',desc:'Orthogonal traces with pads'},
  {id:'lace',name:'Lace / Filigree',desc:'Radial spoke-and-bead pattern'},
];

var tpEl=null,tpOpen=false,tpUserClosed=false,tpPos=null,tpSelCard=null;
var tpActiveType=null,tpColor='#E8F50A',tpScale=50,tpOpacity=90,tpDensity=100,_lastTexSnap=null;

function buildTexPicker(){
  if(tpEl)return;

  var sty=document.createElement('style');
  sty.textContent=[
    '#tex-picker-panel{display:none;position:fixed;z-index:610;',
    '  width:300px;max-height:calc(100vh - 40px);',
    '  background:#36281a;',
    '  border:1px solid rgba(255,255,255,0.2);border-radius:8px;',
    '  box-shadow:0 10px 50px rgba(0,0,0,0.85);',
    '  font-family:inherit;overflow:hidden;',
    '  flex-direction:column;}',
    '#tex-picker-panel.open{display:flex;}',
    '#tp-head{display:flex;align-items:center;justify-content:space-between;',
    '  padding:10px 14px;',
    '  border-bottom:1px solid rgba(255,255,255,0.1);',
    '  background:rgba(0,0,0,0.15);flex-shrink:0;',
    '  cursor:grab;user-select:none;-webkit-user-select:none;',
    '  border-radius:8px 8px 0 0;}',
    '#tp-head::before{content:"\\2807";color:rgba(255,255,255,0.15);',
    '  font-size:14px;margin-right:8px;line-height:1;}',
    '#tp-head-title{font-size:10px;letter-spacing:.2em;',
    '  color:#ffffff;text-transform:uppercase;font-weight:700;line-height:1.6;}',
    '#tp-head-sub{font-size:8px;color:#40c8a0;',
    '  margin-top:2px;line-height:1.5;letter-spacing:.06em;}',
    '#tp-close{background:none;border:1px solid rgba(255,255,255,0.2);',
    '  color:#ff9742;font-size:9px;letter-spacing:.08em;',
    '  padding:4px 10px;cursor:pointer;border-radius:3px;',
    '  font-family:inherit;line-height:1.4;position:relative;z-index:2;flex-shrink:0;}',
    '#tp-close:hover{color:#fff;border-color:#E8F50A;background:rgba(232,245,10,0.08);}',
    '#tp-grid-wrap{flex:1;overflow-y:auto;padding:10px 14px 14px;',
    '  scrollbar-width:thin;scrollbar-color:rgba(232,245,10,0.2) transparent;}',
    '#tp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}',
    '.tp-card{cursor:pointer;border:1px solid rgba(255,255,255,0.06);',
    '  border-radius:6px;overflow:hidden;transition:border-color .15s,transform .1s;',
    '  background:rgba(255,255,255,0.02);}',
    '.tp-card:hover{border-color:rgba(232,245,10,0.4);transform:scale(1.02);}',
    '.tp-card.sel{border-color:#E8F50A;box-shadow:0 0 10px rgba(232,245,10,0.25);}',
    '.tp-card canvas{display:block;width:100%;height:80px;}',
    '.tp-card-info{padding:5px 7px;}',
    '.tp-card-name{font-size:9px;color:rgba(255,255,255,0.8);',
    '  font-weight:600;line-height:1.4;letter-spacing:.04em;}',
    '.tp-card-desc{font-size:7px;color:rgba(255,255,255,0.35);',
    '  line-height:1.4;margin-top:2px;}',
    '#tp-controls input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;',
    '  width:12px;height:12px;border-radius:50%;background:#E8F50A;cursor:pointer;border:none;}',
    '#tp-controls input[type=color]{-webkit-appearance:none;padding:0;}',
    '#tp-controls input[type=color]::-webkit-color-swatch-wrapper{padding:2px;}',
    '#tp-controls input[type=color]::-webkit-color-swatch{border:none;border-radius:2px;}',
  ].join('\n');
  document.head.appendChild(sty);

  tpEl=document.createElement('div');
  tpEl.id='tex-picker-panel';
  tpEl.innerHTML=[
    '<div id="tp-head">',
    '  <div>',
    '    <div id="tp-head-title">\u25A9 Texture Map</div>',
    '    <div id="tp-head-sub">Click a texture to apply \u00B7 drag sliders to adjust</div>',
    '  </div>',
    '  <button id="tp-close">Close</button>',
    '</div>',

    /* Controls section */
    '<div id="tp-controls" style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;">',

    /* Color picker row */
    '  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">',
    '    <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.1em;text-transform:uppercase;line-height:1.5;">Color</span>',
    '    <input type="color" id="tp-color" value="#E8F50A" style="width:36px;height:26px;border:1px solid rgba(255,255,255,0.2);background:none;cursor:pointer;border-radius:3px;flex-shrink:0;">',
    '    <span id="tp-color-hex" style="font-size:9px;color:rgba(255,255,255,0.6);font-family:monospace;letter-spacing:.04em;">#E8F50A</span>',
    '    <div id="tp-color-swatch" style="flex:1;height:26px;border-radius:3px;background:#E8F50A;border:1px solid rgba(255,255,255,0.1);"></div>',
    '  </div>',

    /* Scale slider */
    '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">',
    '    <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.1em;text-transform:uppercase;min-width:36px;line-height:1.5;">Scale</span>',
    '    <input type="range" id="tp-scale" min="10" max="100" value="50" style="flex:1;height:3px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.12);outline:none;cursor:pointer;border-radius:2px;">',
    '    <span id="tp-scale-v" style="font-size:9px;color:rgba(255,255,255,0.6);min-width:30px;text-align:right;">50%</span>',
    '  </div>',

    /* Opacity slider */
    '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">',
    '    <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.1em;text-transform:uppercase;min-width:36px;line-height:1.5;">Opacity</span>',
    '    <input type="range" id="tp-opacity" min="5" max="100" value="90" style="flex:1;height:3px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.12);outline:none;cursor:pointer;border-radius:2px;">',
    '    <span id="tp-opacity-v" style="font-size:9px;color:rgba(255,255,255,0.6);min-width:30px;text-align:right;">90%</span>',
    '  </div>',

    /* Density slider */
    '  <div style="display:flex;align-items:center;gap:8px;">',
    '    <span style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:.1em;text-transform:uppercase;min-width:36px;line-height:1.5;">Density</span>',
    '    <input type="range" id="tp-density" min="10" max="200" value="100" style="flex:1;height:3px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.12);outline:none;cursor:pointer;border-radius:2px;">',
    '    <span id="tp-density-v" style="font-size:9px;color:rgba(255,255,255,0.6);min-width:30px;text-align:right;">100%</span>',
    '  </div>',

    '</div>',

    /* Texture grid */
    '<div id="tp-grid-wrap">',
    '  <div style="font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;line-height:1.5;">Textures (click to apply)</div>',
    '  <div id="tp-grid"></div>',
    '</div>',
  ].join('\n');
  document.body.appendChild(tpEl);

  /* Build thumbnail grid */
  var grid=document.getElementById('tp-grid');
  TEX_META.forEach(function(tex){
    var card=document.createElement('div');
    card.className='tp-card';
    card.title=tex.name;

    /* Thumbnail */
    var cv2=document.createElement('canvas');
    cv2.width=130;cv2.height=80;
    var thumbBg='#1a1a2a';
    var tc=cv2.getContext('2d');
    tc.fillStyle=thumbBg;tc.fillRect(0,0,130,80);
    if(window._genTexture){
      var tile=window._genTexture(tex.id,130,80,'#E8F50A',50);
      tc.drawImage(tile,0,0);
    }
    card.appendChild(cv2);

    /* Info */
    var info=document.createElement('div');
    info.className='tp-card-info';
    info.innerHTML='<div class="tp-card-name">'+tex.name+'</div><div class="tp-card-desc">'+tex.desc+'</div>';
    card.appendChild(info);

    /* Click -> set type + render full canvas */
    card.addEventListener('click',function(){
      if(window._setTexType)window._setTexType(tex.id);
      if(tpSelCard)tpSelCard.classList.remove('sel');
      card.classList.add('sel');tpSelCard=card;
      tpActiveType=tex.id;
      applyTextureToCanvas(tex.id);
    });

    grid.appendChild(card);
  });

  /* Close button */
  document.getElementById('tp-close').addEventListener('click',function(e){
    e.stopPropagation();
    tpUserClosed=true;
    closeTexPicker();
  });

  /* Drag header */
  var head=document.getElementById('tp-head');
  head.addEventListener('mousedown',function(e){
    if(e.target.id==='tp-close'||e.target.closest('#tp-close'))return;
    e.preventDefault();head.style.cursor='grabbing';
    var r=tpEl.getBoundingClientRect();
    var drag={sx:e.clientX,sy:e.clientY,ol:r.left,ot:r.top};
    function mv(ev){
      var nl=Math.max(0,Math.min(window.innerWidth-60,drag.ol+(ev.clientX-drag.sx)));
      var nt=Math.max(0,Math.min(window.innerHeight-40,drag.ot+(ev.clientY-drag.sy)));
      tpEl.style.left=nl+'px';tpEl.style.top=nt+'px';
      tpPos={left:nl,top:nt};
    }
    function up(){head.style.cursor='grab';document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });

  /* ── Wire panel controls ── */

  /* Color picker */
  var tpColIn=document.getElementById('tp-color');
  var tpColHex=document.getElementById('tp-color-hex');
  var tpColSw=document.getElementById('tp-color-swatch');
  tpColIn.addEventListener('input',function(){
    tpColor=tpColIn.value;
    if(tpColHex)tpColHex.textContent=tpColor;
    if(tpColSw)tpColSw.style.background=tpColor;
    window.drawCol=tpColor;
    var fg=document.getElementById('dcol');if(fg)fg.value=tpColor;
    var txt=document.getElementById('dcoltxt');if(txt)txt.textContent=tpColor;
    refreshThumbnails();
    if(tpActiveType)liveReapply();
  });

  /* Scale slider */
  var tpScaleIn=document.getElementById('tp-scale');
  var tpScaleV=document.getElementById('tp-scale-v');
  tpScaleIn.addEventListener('input',function(){
    tpScale=parseInt(tpScaleIn.value);
    if(tpScaleV)tpScaleV.textContent=tpScale+'%';
    /* Sync sidebar scale slider */
    var sideScl=document.getElementById('tex-scale');
    var sideSclV=document.getElementById('tex-scale-v');
    if(sideScl)sideScl.value=tpScale;
    if(sideSclV)sideSclV.textContent=tpScale+'%';
    refreshThumbnails();
    if(tpActiveType)liveReapply();
  });

  /* Opacity slider */
  var tpOpIn=document.getElementById('tp-opacity');
  var tpOpV=document.getElementById('tp-opacity-v');
  tpOpIn.addEventListener('input',function(){
    tpOpacity=parseInt(tpOpIn.value);
    if(tpOpV)tpOpV.textContent=tpOpacity+'%';
    if(tpActiveType)liveReapply();
  });

  /* Density slider */
  var tpDenIn=document.getElementById('tp-density');
  var tpDenV=document.getElementById('tp-density-v');
  tpDenIn.addEventListener('input',function(){
    tpDensity=parseInt(tpDenIn.value);
    if(tpDenV)tpDenV.textContent=tpDensity+'%';
    if(tpActiveType)liveReapply();
  });

  /* ── Refresh all thumbnails with current color/scale ── */
  function refreshThumbnails(){
    var cards=grid.querySelectorAll('.tp-card');
    TEX_META.forEach(function(tex,i){
      if(!cards[i])return;
      var cv3=cards[i].querySelector('canvas');
      if(!cv3)return;
      var tc2=cv3.getContext('2d');
      tc2.fillStyle='#1a1a2a';tc2.fillRect(0,0,130,80);
      if(window._genTexture){
        var tile=window._genTexture(tex.id,130,80,tpColor,tpScale);
        tc2.drawImage(tile,0,0);
      }
    });
  }

  /* ── Live re-apply: undo last texture then re-apply with new settings ── */
  function liveReapply(){
    var cvEl=document.getElementById('cv');
    if(!cvEl||!tpActiveType)return;
    var tctx2=cvEl.getContext('2d');
    var W=cvEl.width,H=cvEl.height;
    /* Restore pre-texture snapshot */
    if(_lastTexSnap){
      tctx2.putImageData(_lastTexSnap,0,0);
    }
    /* Re-apply with current controls */
    var op=tpOpacity/100;
    var densityMul=tpDensity/100;
    if(window._genTexture){
      var tile=window._genTexture(tpActiveType,W,H,tpColor,tpScale);
      tctx2.save();
      tctx2.globalAlpha=op*densityMul;
      tctx2.drawImage(tile,0,0);
      tctx2.restore();
    }
  }
}

/* ── Apply texture to full canvas ── */
function applyTextureToCanvas(type){
  var cvEl=document.getElementById('cv');
  if(!cvEl)return;
  var tctx=cvEl.getContext('2d');
  var W=cvEl.width,H=cvEl.height;

  /* Read from panel controls */
  var col=tpColor||window.drawCol||'#E8F50A';
  var op=(tpOpacity||90)/100;
  var scale=tpScale||50;
  var densityMul=(tpDensity||100)/100;

  /* Push undo */
  if(window.genUndoPush)window.genUndoPush();

  /* Save pre-texture snapshot for live slider adjustment */
  _lastTexSnap=tctx.getImageData(0,0,W,H);

  /* Generate and apply texture */
  if(window._genTexture){
    var tile=window._genTexture(type,W,H,col,scale);
    tctx.save();
    tctx.globalAlpha=op*densityMul;
    tctx.drawImage(tile,0,0);
    tctx.restore();
  }

  var si=document.getElementById('si');
  if(si)si.textContent='Texture applied: '+type;
  if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
}

function openTexPicker(){
  buildTexPicker();
  if(tpOpen)return;
  tpOpen=true;
  if(tpPos){
    tpEl.style.left=tpPos.left+'px';tpEl.style.top=tpPos.top+'px';
  } else {
    var tb=document.getElementById('tb');
    if(tb){var r=tb.getBoundingClientRect();tpEl.style.left=Math.max(4,r.left-308)+'px';tpEl.style.top='10px';}
    else{tpEl.style.left='50px';tpEl.style.top='40px';}
  }
  tpEl.classList.add('open');
  /* Sync color from current drawCol */
  var curCol=window.drawCol||'#E8F50A';
  tpColor=curCol;
  var ci=document.getElementById('tp-color');if(ci)ci.value=curCol;
  var ch=document.getElementById('tp-color-hex');if(ch)ch.textContent=curCol;
  var cs=document.getElementById('tp-color-swatch');if(cs)cs.style.background=curCol;
  _lastTexSnap=null;
  tpActiveType=null;
}

function closeTexPicker(){
  tpOpen=false;
  if(tpEl)tpEl.classList.remove('open');
}

/* ── Commit texture: locks current state so tool switch doesn't lose marks ── */
function texCommit(){
  tpActiveType=null;
  _lastTexSnap=null;
}
window._texCommit=texCommit;

/* ── Hook into tool selection ── */
var _prevSetToolPS2=window.setTool_ps;
window.setTool_ps=function(t){
  if(_prevSetToolPS2)_prevSetToolPS2(t);
  if(t==='texturemap'){
    tpUserClosed=false;
    openTexPicker();
  } else {
    tpUserClosed=false;
    closeTexPicker();
  }
};

/* Patch open to respect user close */
var _origOpenTP=openTexPicker;
openTexPicker=function(){
  if(tpUserClosed)return;
  _origOpenTP();
};

})();
