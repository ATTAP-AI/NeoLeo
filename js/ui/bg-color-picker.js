/* ══════════════════════════════════════════════════════════
   RE-RENDER ON BACKGROUND CHANGE
   When an engine image is already rendered, changing the background
   color re-renders that same engine/seed onto the new background.
   Debounced so dragging the color picker doesn't flood renders.
   ══════════════════════════════════════════════════════════ */
var _bgRenderTimer = null;
function _reRenderOnBgChange(){
  /* Only re-render if an engine has been rendered */
  if(!window._engineSelected || !window.eng) return;
  /* Don't re-render during showcase batch render */
  if(window._showcaseBatchRunning) return;
  if(_bgRenderTimer) clearTimeout(_bgRenderTimer);
  _bgRenderTimer = setTimeout(function(){
    var W = cv.width, H = cv.height;
    if(W <= 0 || H <= 0) return;
    var p = window.gpal ? window.gpal() : {bg: _canvasBg, c:['#ff4040']};
    /* Fill new background */
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);
    /* Re-seed with the locked/current seed */
    var sd = window.lseed != null ? window.lseed : Date.now();
    if(window.seed) window.seed(sd);
    /* Re-render the engine */
    try {
      if(window.ENGINES && window.ENGINES[window.eng]){
        window.ENGINES[window.eng](W, H, p);
      }
    } catch(e){ console.warn('BG re-render failed:', e.message); }
    /* Re-apply lighting & atmosphere */
    if(window.renderLighting) window.renderLighting();
    if(window.renderAtmosphere) window.renderAtmosphere();
    if(window.setI) window.setI('Re-rendered on new background: ' + (p.bg || _canvasBg));
  }, 180);
}

/* ══════════════════════════════════════════════════════════
   CANVAS BACKGROUND COLOR
   ══════════════════════════════════════════════════════════ */
(function(){
/* Wire the quick color input in style row */
(function(){})();

const PRESETS=[
  '#000000','#080403','#060408','#0a0a0a','#0d0d0d',
  '#040810','#08040c','#0a0604','#080c04','#04080c',
  '#ffffff','#f4efe4','#f0f0f0','#1a1a2a','#2a1a1a',
  '#1a2a1a','#0d0014','#140008','#001408','#001214'
];

const swatch = document.getElementById('cvbg-swatch')||{style:{},addEventListener:function(){},classList:{toggle:function(){},add:function(){},remove:function(){}}};
const hexLbl = document.getElementById('cvbg-hex')||{textContent:''};
const presetRow = document.getElementById('cvbg-presets')||{innerHTML:'',appendChild:function(){},querySelectorAll:function(){return[];}};

function applyBg(hex){
  _canvasBg = hex;
  swatch.style.background = hex;
  hexLbl.textContent = hex.toUpperCase();
  /* Repaint the generative canvas background immediately */
  if(cv.width > 0){
    ctx.fillStyle = hex;
    ctx.fillRect(0,0,cv.width,cv.height);
    if(window._onCvRender)window._onCvRender('BG: '+hex);
  }
  /* Update active dot */
  presetRow.querySelectorAll('.cvbg-dot').forEach(d=>{
    d.classList.toggle('active', d.dataset.col===hex);
  });
  /* Re-render current engine onto new background */
  _reRenderOnBgChange();
}

/* Build preset dots */
PRESETS.forEach(col=>{
  const dot = document.createElement('div');
  dot.className = 'cvbg-dot';
  dot.style.background = col;
  dot.dataset.col = col;
  dot.title = col;
  dot.addEventListener('click',()=>{
    openColorWheel(col, hex=>{
      applyBg(hex);
      /* Update clicked dot to new colour if it was the active one */
    }, swatch);
    /* Actually just apply immediately from preset without opening wheel */
    applyBg(col);
  });
  presetRow.appendChild(dot);
});

/* Main swatch opens the full color wheel */
swatch.addEventListener('click',()=>{
  openColorWheel(_canvasBg, hex=>{
    applyBg(hex);
  }, swatch);
});

/* Initialise to default black */
applyBg('#000000');
swatch.classList.add('active');

})();

/* ══════════════════════════════════════════════════════════
   SQUARE BACKGROUND COLOR PICKER
   ══════════════════════════════════════════════════════════ */
(function(){
  var panel=document.getElementById('bg-picker-panel');
  var svCanvas=document.getElementById('bg-sv-canvas');
  var hueStrip=document.getElementById('bg-hue-strip');
  var opSlider=document.getElementById('bg-opacity-sl');
  var opVal=document.getElementById('bg-opacity-val');
  var hexInput=document.getElementById('bg-hex-input');
  var prevSwatch=document.getElementById('bg-preview-swatch');
  var presetRow=document.getElementById('bg-preset-row');
  var defaultBtn=document.getElementById('bg-default-btn');
  var closeBtn=document.getElementById('bg-picker-close');
  var mainSwatch=document.getElementById('bg-col-swatch');
  var mainHex=document.getElementById('bg-col-hex');
  if(!svCanvas||!hueStrip||!panel)return;
  var svCtx=svCanvas.getContext('2d');
  var hueCtx=hueStrip.getContext('2d');
  var W=160,H=160;

  var curHue=0,curSat=0,curVal=0,curOp=100;

  function hsv2rgb(h,s,v){
    var c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    var r=0,g=0,b=0;
    if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
    return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
  }
  function rgb2hsv(r,g,b){
    r/=255;g/=255;b/=255;
    var mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
    var h=0,s=mx===0?0:d/mx,v=mx;
    if(d>0){if(mx===r)h=((g-b)/d+6)%6*60;else if(mx===g)h=((b-r)/d+2)*60;else h=((r-g)/d+4)*60;}
    return[h,s,v];
  }
  function hex2rgb(hex){
    hex=(hex||'#000000').replace('#','');
    if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return[parseInt(hex.substr(0,2),16)||0,parseInt(hex.substr(2,2),16)||0,parseInt(hex.substr(4,2),16)||0];
  }
  function rgb2hex(r,g,b){return'#'+[r,g,b].map(function(c){return('0'+Math.max(0,Math.min(255,c)).toString(16)).slice(-2);}).join('');}

  function drawSV(){
    var imgData=svCtx.createImageData(W,H);
    var d=imgData.data;
    for(var y=0;y<H;y++){
      var v=1-y/H;
      for(var x=0;x<W;x++){
        var s=x/W;
        var rgb=hsv2rgb(curHue,s,v);
        var i=(y*W+x)*4;
        d[i]=rgb[0];d[i+1]=rgb[1];d[i+2]=rgb[2];d[i+3]=255;
      }
    }
    svCtx.putImageData(imgData,0,0);
    var mx=curSat*W,my=(1-curVal)*H;
    svCtx.strokeStyle='#ffffff';svCtx.lineWidth=1.5;
    svCtx.beginPath();svCtx.arc(mx,my,5,0,Math.PI*2);svCtx.stroke();
    svCtx.strokeStyle='#000000';svCtx.lineWidth=0.8;
    svCtx.beginPath();svCtx.arc(mx,my,6,0,Math.PI*2);svCtx.stroke();
  }

  function drawHue(){
    var hw=20,hh=160;
    for(var y=0;y<hh;y++){
      var h=y/hh*360;
      var rgb=hsv2rgb(h,1,1);
      hueCtx.fillStyle='rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
      hueCtx.fillRect(0,y,hw,1);
    }
    var hy=curHue/360*hh;
    hueCtx.strokeStyle='#ffffff';hueCtx.lineWidth=2;
    hueCtx.strokeRect(0,Math.max(0,hy-2),hw,4);
  }

  function apply(){
    var rgb=hsv2rgb(curHue,curSat,curVal);
    var hex=rgb2hex(rgb[0],rgb[1],rgb[2]);
    hexInput.value=hex;
    var displayCol;
    if(curOp<100){
      displayCol='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(curOp/100).toFixed(2)+')';
    } else {
      displayCol=hex;
    }
    prevSwatch.style.background=displayCol;
    mainSwatch.style.background=displayCol;
    mainHex.textContent=curOp<100?(hex+' '+curOp+'%'):hex;
    /* Apply to canvas using global state */
    _canvasBg=displayCol;
    if(typeof ctx!=='undefined'&&cv.width>0){
      ctx.clearRect(0,0,cv.width,cv.height);
      ctx.fillStyle=displayCol;
      ctx.fillRect(0,0,cv.width,cv.height);
      if(window._onCvRender)window._onCvRender('BG: '+displayCol);
    }
    var nativePicker=document.getElementById('bg-col-picker');
    if(nativePicker)nativePicker.value=hex;
    /* Update aspect ratio preview thumbnail */
    var preInner=document.getElementById('res-preview-inner');
    if(preInner)preInner.style.background=displayCol;
    /* Update ratio thumb active shape */
    if(window._syncThumbColor)window._syncThumbColor();
    /* Re-render current engine onto new background */
    _reRenderOnBgChange();
  }

  /* SV interaction */
  var svDrag=false;
  function svPick(e){
    var r=svCanvas.getBoundingClientRect();
    curSat=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    curVal=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));
    drawSV();apply();
  }
  svCanvas.addEventListener('mousedown',function(e){e.preventDefault();svDrag=true;svPick(e);});
  document.addEventListener('mousemove',function(e){if(svDrag){e.preventDefault();svPick(e);}});
  document.addEventListener('mouseup',function(){svDrag=false;});

  /* Hue interaction */
  var hueDrag=false;
  function huePick(e){
    var r=hueStrip.getBoundingClientRect();
    curHue=Math.max(0,Math.min(359,(e.clientY-r.top)/r.height*360));
    drawSV();drawHue();apply();
  }
  hueStrip.addEventListener('mousedown',function(e){e.preventDefault();hueDrag=true;huePick(e);});
  document.addEventListener('mousemove',function(e){if(hueDrag){e.preventDefault();huePick(e);}});
  document.addEventListener('mouseup',function(){hueDrag=false;});

  /* Opacity */
  opSlider.addEventListener('input',function(){
    curOp=parseInt(opSlider.value);
    opVal.textContent=curOp+'%';
    apply();
  });

  /* Hex input */
  hexInput.addEventListener('change',function(){
    var v=hexInput.value.trim();if(v[0]!=='#')v='#'+v;
    if(/^#[0-9a-fA-F]{6}$/.test(v)){
      var rgb=hex2rgb(v);var hsv=rgb2hsv(rgb[0],rgb[1],rgb[2]);
      curHue=hsv[0];curSat=hsv[1];curVal=hsv[2];
      drawSV();drawHue();apply();
    }
  });

  /* Presets */
  var BG_PRESETS=[
    '#000000','#1a1a1a','#2a2a2a','#3a3a3a','#555555','#888888','#bbbbbb','#ffffff',
    '#0a0614','#140a06','#060a14','#0a1406','#1a0a2a','#2a0a0a','#0a2a1a','#2a1a0a',
    '#c0392b','#2980b9','#27ae60','#f39c12','#8e44ad','#16a085','#e74c3c','#2c3e50'
  ];
  BG_PRESETS.forEach(function(col){
    var dot=document.createElement('div');
    dot.style.cssText='width:14px;height:14px;background:'+col+';border:1px solid rgba(255,255,255,0.15);border-radius:2px;cursor:pointer;flex-shrink:0;';
    dot.title=col;
    dot.addEventListener('click',function(){
      var rgb=hex2rgb(col);var hsv=rgb2hsv(rgb[0],rgb[1],rgb[2]);
      curHue=hsv[0];curSat=hsv[1];curVal=hsv[2];
      drawSV();drawHue();apply();
    });
    presetRow.appendChild(dot);
  });

  /* Default black */
  defaultBtn.addEventListener('click',function(){
    curHue=0;curSat=0;curVal=0;curOp=100;
    opSlider.value=100;opVal.textContent='100%';
    drawSV();drawHue();apply();
  });

  /* Toggle panel open/close */
  function syncPickerToCurrentColor(){
    var cur=_canvasBg||'#000000';
    if(cur==='transparent'){curHue=0;curSat=0;curVal=0;curOp=100;}
    else{
      var hex=cur;
      if(cur.indexOf('rgba')===0){
        var m=cur.match(/[\d.]+/g);
        if(m&&m.length>=3)hex=rgb2hex(parseInt(m[0]),parseInt(m[1]),parseInt(m[2]));
        if(m&&m.length>=4){curOp=Math.round(parseFloat(m[3])*100);opSlider.value=curOp;opVal.textContent=curOp+'%';}
      }
      var rgb=hex2rgb(hex);var hsv=rgb2hsv(rgb[0],rgb[1],rgb[2]);
      curHue=hsv[0];curSat=hsv[1];curVal=hsv[2];
      hexInput.value=hex;
    }
    drawSV();drawHue();
  }

  function togglePanel(){
    var isOpen=panel.style.display!=='none';
    panel.style.display=isOpen?'none':'block';
    if(!isOpen)syncPickerToCurrentColor();
  }

  mainSwatch.addEventListener('click',function(e){e.stopPropagation();togglePanel();});
  mainHex.addEventListener('click',function(e){e.stopPropagation();togglePanel();});
  /* Preview thumbnail also opens the bg color picker */
  var previewBox=document.getElementById('res-preview-box');
  if(previewBox){
    previewBox.style.cursor='pointer';
    previewBox.title='Click to change background color';
    previewBox.addEventListener('click',function(e){e.stopPropagation();togglePanel();});
  }
  closeBtn.addEventListener('click',function(){panel.style.display='none';});

  /* Slider thumb style */
  var sty=document.createElement('style');
  sty.textContent='#bg-opacity-sl::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#ffffff;cursor:pointer;border:none;}';
  document.head.appendChild(sty);
})();
