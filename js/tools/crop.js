/* ══════════════════════════════════════════════════════════
   CROP TOOL
   ══════════════════════════════════════════════════════════ */
(function(){

var overlay   = document.getElementById('crop-overlay');
var cropBox   = document.getElementById('crop-box');
var confirmBar= document.getElementById('crop-confirm');
var cropBtn   = document.getElementById('u-crop-btn');
var cropRow   = document.getElementById('u-crop-row');
var okBtn     = document.getElementById('crop-ok');
var cancelBtn = document.getElementById('crop-cancel');
var shadeN    = document.getElementById('crop-shade-n');
var shadeS    = document.getElementById('crop-shade-s');
var shadeW    = document.getElementById('crop-shade-w');
var shadeE    = document.getElementById('crop-shade-e');

if(!overlay||!cropBox||!confirmBar||!cropBtn){return;}

var active=false, dragging=false, handle='', moveStart=null;
var crop={x:0,y:0,w:0,h:0}; // in canvas pixels
var cw=0,ch=0; // canvas display size

function cvSize(){
  var wrap=document.getElementById('cvwrap');
  if(!wrap)return[cv.width,cv.height];
  return[wrap.offsetWidth,wrap.offsetHeight];
}

function scaleX(px){return px*(cv.width/cw);}
function scaleY(py){return py*(cv.height/ch);}

/* Show/hide crop row when image is loaded/cleared */
window._cropShowBtn = function(show){
  if(cropRow) cropRow.style.display = show?'block':'none';
};

/* Activate crop mode */
function startCrop(){
  if(!uploadedImg){setI('No image loaded');return;}
  var wrap=document.getElementById('cvwrap');
  cw=wrap.offsetWidth; ch=wrap.offsetHeight;

  /* Default crop = 80% of canvas, centred */
  var margin=Math.round(Math.min(cw,ch)*0.1);
  crop={x:margin,y:margin,w:cw-margin*2,h:ch-margin*2};

  overlay.classList.add('active');
  overlay.style.display='block';
  confirmBar.classList.add('show');
  active=true;
  updateBoxUI();
  setI('Drag handles to adjust crop, then click Apply');
}

function endCrop(apply){
  overlay.classList.remove('active');
  overlay.style.display='none';
  confirmBar.classList.remove('show');
  active=false;

  if(apply){
    /* Clamp crop to canvas bounds */
    var x=Math.max(0,Math.round(scaleX(crop.x)));
    var y=Math.max(0,Math.round(scaleY(crop.y)));
    var w=Math.min(cv.width-x,Math.round(scaleX(crop.w)));
    var h=Math.min(cv.height-y,Math.round(scaleY(crop.h)));
    if(w<4||h<4){setI('Crop area too small');return;}

    if(window.genUndoPush)window.genUndoPush();

    /* Crop every canvas: uv, cv, dv, lv, av */
    [
      {src:uv, ctx:uctx},
      {src:cv, ctx:ctx},
      {src:dv, ctx:dctx},
      {src:lv, ctx:lctx},
      {src:av, ctx:actx}
    ].forEach(function(layer){
      var tmp=document.createElement('canvas');
      tmp.width=w; tmp.height=h;
      var tc=tmp.getContext('2d');
      tc.drawImage(layer.src,x,y,w,h,0,0,w,h);
      layer.src.width=w; layer.src.height=h;
      layer.ctx.clearRect(0,0,w,h);
      layer.ctx.drawImage(tmp,0,0);
    });

    /* Resize display wrap */
    sz();
    if(typeof renderUpload==='function')renderUpload();
    if(typeof renderLighting==='function')renderLighting();
    if(typeof renderAtmosphere==='function')renderAtmosphere();
    setI('Cropped to '+w+'\u00D7'+h);
  }
}

/* Position the crop box and shades from crop{} */
function updateBoxUI(){
  var x=crop.x,y=crop.y,w=crop.w,h=crop.h;
  cropBox.style.left=x+'px'; cropBox.style.top=y+'px';
  cropBox.style.width=w+'px'; cropBox.style.height=h+'px';
  /* Shades */
  shadeN.style.height=y+'px';
  shadeS.style.top=(y+h)+'px'; shadeS.style.height=(ch-y-h)+'px';
  shadeW.style.top=y+'px'; shadeW.style.width=x+'px'; shadeW.style.height=h+'px';
  shadeE.style.left=(x+w)+'px'; shadeE.style.top=y+'px'; shadeE.style.width=(cw-x-w)+'px'; shadeE.style.height=h+'px';
}

function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v));}

/* Mouse/touch handling */
function getPos(e){
  var rect=overlay.getBoundingClientRect();
  var src=e.touches?e.touches[0]:e;
  return{x:src.clientX-rect.left,y:src.clientY-rect.top};
}

overlay.addEventListener('mousedown',onDown);
overlay.addEventListener('touchstart',onDown,{passive:false});

function onDown(e){
  if(!active)return;
  e.preventDefault();
  var pos=getPos(e);
  var target=e.target;
  handle=target.dataset.h||'';
  if(target.id==='crop-move'){handle='move';}
  else if(!handle){
    /* New crop drag on shade area */
    handle='new';
    crop={x:pos.x,y:pos.y,w:0,h:0};
  }
  moveStart={x:pos.x,y:pos.y,cx:crop.x,cy:crop.y,cw:crop.w,ch:crop.h};
  dragging=true;
}

document.addEventListener('mousemove',onMove);
document.addEventListener('touchmove',onMove,{passive:false});
function onMove(e){
  if(!dragging||!active)return;
  e.preventDefault();
  var pos=getPos(e);
  var dx=pos.x-moveStart.x, dy=pos.y-moveStart.y;
  var nc={x:moveStart.cx,y:moveStart.cy,w:moveStart.cw,h:moveStart.ch};

  if(handle==='move'){
    nc.x=clamp(moveStart.cx+dx,0,cw-nc.w);
    nc.y=clamp(moveStart.cy+dy,0,ch-nc.h);
  } else if(handle==='new'){
    nc.x=clamp(Math.min(moveStart.x,pos.x),0,cw);
    nc.y=clamp(Math.min(moveStart.y,pos.y),0,ch);
    nc.w=clamp(Math.abs(dx),0,cw-nc.x);
    nc.h=clamp(Math.abs(dy),0,ch-nc.y);
  } else {
    if(handle.includes('e')) nc.w=clamp(moveStart.cw+dx,20,cw-nc.x);
    if(handle.includes('s')) nc.h=clamp(moveStart.ch+dy,20,ch-nc.y);
    if(handle.includes('w')){var nx=clamp(moveStart.cx+dx,0,moveStart.cx+moveStart.cw-20);nc.w+=nc.x-nx;nc.x=nx;}
    if(handle.includes('n')){var ny=clamp(moveStart.cy+dy,0,moveStart.cy+moveStart.ch-20);nc.h+=nc.y-ny;nc.y=ny;}
  }
  crop=nc;
  updateBoxUI();
}

document.addEventListener('mouseup',function(){dragging=false;});
document.addEventListener('touchend',function(){dragging=false;});

if(cropBtn) cropBtn.addEventListener('click',startCrop);
if(okBtn)   okBtn.addEventListener('click',function(){endCrop(true);});
if(cancelBtn) cancelBtn.addEventListener('click',function(){endCrop(false);});

/* Show crop button when image loads */
var origShowComposite=window._showImgComposite;
window._showImgComposite=function(show){
  if(origShowComposite)origShowComposite(show);
  window._cropShowBtn(show);
};
/* Handle the case where image is already loaded */
if(uploadedImg) window._cropShowBtn(true);

})();
