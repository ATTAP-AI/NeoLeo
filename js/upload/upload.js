/* ══════════════════════════════════════════════════════════
   UPLOAD SYSTEM — extracted from NeoLeo monolith
   Depends on globals: uploadedImg, uploadedFit, uploadedMode,
     uploadedOp, uploadedBlend, uploadedEngBlend, uploadedEngOp,
     uploadedEngOn, uv, uctx, cv, ctx, lv, dv, dctx, av,
     setI, sz, openPanel, closePanel, setTool, renderLighting,
     renderAtmosphere
   ══════════════════════════════════════════════════════════ */

/* Helper: draw uploaded image into any 2D context at full canvas size */
function drawImageToCtx(c,alpha,blendMode){
  if(!uploadedImg)return;
  var W=c.canvas.width,H=c.canvas.height;
  var iw=uploadedImg.naturalWidth,ih=uploadedImg.naturalHeight;
  var dx=0,dy=0,dw=W,dh=H;
  if(uploadedFit==='contain'){var scale=Math.min(W/iw,H/ih);dw=iw*scale;dh=ih*scale;dx=(W-dw)/2;dy=(H-dh)/2;}
  else if(uploadedFit==='cover'){var scale2=Math.max(W/iw,H/ih);dw=iw*scale2;dh=ih*scale2;dx=(W-dw)/2;dy=(H-dh)/2;}
  c.save();c.globalAlpha=alpha;c.globalCompositeOperation=blendMode;
  c.drawImage(uploadedImg,dx,dy,dw,dh);c.restore();
}

/* Bake the uploaded image permanently onto the generative canvas */
function bakeUploadToCanvas(){
  if(!uploadedImg)return;
  if(window.genUndoPush)window.genUndoPush();
  // Draw upload under or over existing cv content
  var tmpCtx=cv.getContext('2d');
  if(uploadedMode==='under'||uploadedMode==='replace'){
    // Get current cv pixels, clear, draw image first, then redraw cv content on top
    var existing=null;
    try{existing=tmpCtx.getImageData(0,0,cv.width,cv.height);}catch(e){}
    tmpCtx.clearRect(0,0,cv.width,cv.height);
    drawImageToCtx(tmpCtx,uploadedOp,'source-over');
    if(existing&&uploadedMode!=='replace')tmpCtx.putImageData(existing,0,0);
  } else {
    // Over — draw image on top of existing cv
    drawImageToCtx(tmpCtx,uploadedOp,uploadedBlend);
  }
  // Clear the upload layer
  uploadedImg=null;window.uploadedImg=null;
  uctx.clearRect(0,0,uv.width,uv.height);
  cv.style.opacity='1';lv.style.opacity='1';uv.style.zIndex='0';cv.style.zIndex='1';dv.style.zIndex='3';av.style.zIndex='4';
  document.getElementById('u-preview').style.display='none';
  var _isS=document.getElementById('is-sec');if(_isS){_isS.style.display='none';if(window._IS)window._IS.deactivate();}
  if(window._adjReset)window._adjReset();
  document.getElementById('u-controls').style.display='none';
  document.getElementById('u-engine-sec').style.display='none';
  document.getElementById('u-bake-sec').style.display='none';
  document.getElementById('u-clear-row').style.display='none';
  var inp=document.getElementById('u-file');if(inp)inp.value='';
  setI('Image baked to canvas');
  if(window._onCvRender)window._onCvRender('Upload Bake');
}

function renderUpload(){
  var W=uv.width,H=uv.height;
  uctx.clearRect(0,0,W,H);
  if(!uploadedImg)return;
  uctx.save();
  uctx.globalAlpha=uploadedOp;
  uctx.globalCompositeOperation=uploadedBlend;
  var iw=uploadedImg.naturalWidth,ih=uploadedImg.naturalHeight;
  var dx=0,dy=0,dw=W,dh=H;
  if(uploadedFit==='contain'){var scale=Math.min(W/iw,H/ih);dw=iw*scale;dh=ih*scale;dx=(W-dw)/2;dy=(H-dh)/2;}
  else if(uploadedFit==='cover'){var scale2=Math.max(W/iw,H/ih);dw=iw*scale2;dh=ih*scale2;dx=(W-dw)/2;dy=(H-dh)/2;}
  uctx.drawImage(uploadedImg,dx,dy,dw,dh);
  uctx.restore();
  updateLayerOrder();
}

function updateLayerOrder(){
  var wrap=document.getElementById('cvwrap');
  if(uploadedMode==='over'){
    uv.style.zIndex='3';cv.style.zIndex='1';dv.style.zIndex='3';av.style.zIndex='4';
  } else {
    uv.style.zIndex='0';cv.style.zIndex='1';dv.style.zIndex='3';av.style.zIndex='4';
  }
  if(uploadedMode==='replace'){
    cv.style.opacity='0';lv.style.opacity='0';
  } else {
    cv.style.opacity='1';lv.style.opacity='1';
  }
}

function loadUploadFile(file){
  var err=document.getElementById('u-err');
  err.style.display='none';
  if(!file){return;}
  if(!file.type.match(/image\/(png|jpeg)/)){err.textContent='Only PNG and JPEG files are supported.';err.style.display='block';return;}
  if(file.size>5*1024*1024){err.textContent='File exceeds 5 MB limit ('+((file.size/1024/1024).toFixed(1))+' MB).';err.style.display='block';return;}
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      uploadedImg=img;
      window.uploadedImg=img;
      if(window._showImgComposite) window._showImgComposite(true);
      if(window._cropShowBtn) window._cropShowBtn(true);
      // Draw thumbnail
      var thumb=document.getElementById('u-thumb');
      var maxW=196,maxH=110;
      var scale=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
      thumb.width=Math.round(img.naturalWidth*scale);
      thumb.height=Math.round(img.naturalHeight*scale);
      var tc=thumb.getContext('2d');tc.drawImage(img,0,0,thumb.width,thumb.height);
      document.getElementById('u-preview').style.display='block';
      var _isSec=document.getElementById('is-sec');if(_isSec)_isSec.style.display='block';
      document.getElementById('u-preview-info').innerHTML=
        '<span>'+img.naturalWidth+' \u00D7 '+img.naturalHeight+'px</span> &nbsp;\u00B7&nbsp; <span>'+(file.size/1024).toFixed(0)+' KB</span> &nbsp;\u00B7&nbsp; <span>'+file.name+'</span>';
      document.getElementById('u-controls').style.display='block';
      document.getElementById('u-engine-sec').style.display='block';
      document.getElementById('u-bake-sec').style.display='block';
      document.getElementById('u-clear-row').style.display='block';
      // Resize canvases if not yet sized, then render
      if(uv.width===0){sz();}
      if(window.genUndoPush)window.genUndoPush();
      renderUpload();
      if(typeof updateGlobalUndoBtns==='function')updateGlobalUndoBtns();
    };
    img.onerror=function(){err.textContent='Could not load image.';err.style.display='block';};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

// Drop zone wiring
var dzone=document.getElementById('u-dropzone');
var finput=document.getElementById('u-file');
dzone.onclick=function(){finput.click();};
finput.onchange=function(){loadUploadFile(finput.files[0]);};
dzone.addEventListener('dragover',function(e){e.preventDefault();dzone.classList.add('drag');});
dzone.addEventListener('dragleave',function(){dzone.classList.remove('drag');});
dzone.addEventListener('drop',function(e){e.preventDefault();dzone.classList.remove('drag');loadUploadFile(e.dataTransfer.files[0]);});

// Control wiring
document.getElementById('u-opr').oninput=function(){uploadedOp=+this.value/100;document.getElementById('u-opv').textContent=this.value+'%';renderUpload();};
document.getElementById('u-mode').onchange=function(e){uploadedMode=e.target.value;renderUpload();};
document.getElementById('u-fit').onchange=function(e){uploadedFit=e.target.value;renderUpload();};
document.getElementById('u-blend').onchange=function(e){uploadedBlend=e.target.value;renderUpload();};
document.getElementById('u-eng-blend').onchange=function(e){uploadedEngBlend=e.target.value;};
document.getElementById('u-engopr').oninput=function(){uploadedEngOp=+this.value/100;document.getElementById('u-engopv').textContent=this.value+'%';if(window.uploadedImg)renderUpload();};
document.getElementById('u-eng-on').onchange=function(e){uploadedEngOn=e.target.checked;};
document.getElementById('u-bake').onclick=bakeUploadToCanvas;

document.getElementById('u-clear').onclick=function(){
  if(window.genUndoPush)window.genUndoPush();
  uploadedImg=null;window.uploadedImg=null;uctx.clearRect(0,0,uv.width,uv.height);
  if(window._showImgComposite) window._showImgComposite(false);
  if(window._cropShowBtn) window._cropShowBtn(false);
  cv.style.opacity='1';lv.style.opacity='1';uv.style.zIndex='0';cv.style.zIndex='1';dv.style.zIndex='3';av.style.zIndex='4';
  document.getElementById('u-preview').style.display='none';
  var _isS=document.getElementById('is-sec');if(_isS){_isS.style.display='none';if(window._IS)window._IS.deactivate();}
  if(window._adjReset)window._adjReset();
  document.getElementById('u-controls').style.display='none';
  document.getElementById('u-engine-sec').style.display='none';
  document.getElementById('u-bake-sec').style.display='none';
  document.getElementById('u-clear-row').style.display='none';
  document.getElementById('u-err').style.display='none';
  finput.value='';
};

// Upload panel toggle
document.getElementById('utool').onclick=function(){
  var p=document.getElementById('upload-panel');
  if(p.classList.contains('open')){closePanel('upload-panel');setTool('');}
  else{openPanel('upload-panel');document.querySelectorAll('.tbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t==='upload');});}
};
document.getElementById('up-cls').onclick=function(){closePanel('upload-panel');setTool('');};

/* ══ Expose on window ══ */
window.renderUpload=renderUpload;
window.drawImageToCtx=drawImageToCtx;
window.bakeUploadToCanvas=bakeUploadToCanvas;
window.loadUploadFile=loadUploadFile;
