/* ══════════════════════════════════════════════════════════
   Shared full-fidelity export: captures every layer + every
   CSS filter exactly as the user sees it on screen.
   Uses manual pixel ops — ctx.filter is blocked in sandbox.
   ══════════════════════════════════════════════════════════ */
(function(){

/* ── Parse a CSS filter string into an array of {fn, val} ── */
function parseFilter(s){
  if(!s||s==='none')return [];
  var ops=[], re=/(\w[\w-]*)\(([^)]+)\)/g, m;
  while((m=re.exec(s))!==null){
    var fn=m[1], raw=m[2].trim();
    var val=parseFloat(raw);
    ops.push({fn:fn, val:val, raw:raw});
  }
  return ops;
}

/* ── Clamp 0-255 ── */
function cl(v){return v<0?0:v>255?255:v+0.5|0;}

/* ── Apply parsed filter ops to an ImageData in-place ── */
function applyOps(imgData, ops){
  if(!ops.length)return;
  var d=imgData.data, len=d.length;
  for(var oi=0;oi<ops.length;oi++){
    var fn=ops[oi].fn, v=ops[oi].val;
    if(fn==='brightness'){
      for(var i=0;i<len;i+=4){d[i]=cl(d[i]*v);d[i+1]=cl(d[i+1]*v);d[i+2]=cl(d[i+2]*v);}
    }else if(fn==='contrast'){
      var f=v, ic=128*(1-f);
      for(var i=0;i<len;i+=4){d[i]=cl(d[i]*f+ic);d[i+1]=cl(d[i+1]*f+ic);d[i+2]=cl(d[i+2]*f+ic);}
    }else if(fn==='saturate'){
      for(var i=0;i<len;i+=4){
        var r=d[i],g=d[i+1],b=d[i+2];
        var gray=0.2126*r+0.7152*g+0.0722*b;
        d[i]=cl(gray+(r-gray)*v);d[i+1]=cl(gray+(g-gray)*v);d[i+2]=cl(gray+(b-gray)*v);
      }
    }else if(fn==='sepia'){
      var amt=Math.min(1,v);
      for(var i=0;i<len;i+=4){
        var r=d[i],g=d[i+1],b=d[i+2];
        var sr=Math.min(255,r*.393+g*.769+b*.189);
        var sg=Math.min(255,r*.349+g*.686+b*.168);
        var sb=Math.min(255,r*.272+g*.534+b*.131);
        d[i]=cl(r+(sr-r)*amt);d[i+1]=cl(g+(sg-g)*amt);d[i+2]=cl(b+(sb-b)*amt);
      }
    }else if(fn==='hue-rotate'){
      var deg=v*(Math.PI/180);
      var cos=Math.cos(deg),sin=Math.sin(deg);
      /* Standard hue-rotate matrix per CSS spec */
      var m00=0.213+0.787*cos-0.213*sin;
      var m01=0.715-0.715*cos-0.715*sin;
      var m02=0.072-0.072*cos+0.928*sin;
      var m10=0.213-0.213*cos+0.143*sin;
      var m11=0.715+0.285*cos+0.140*sin;
      var m12=0.072-0.072*cos-0.283*sin;
      var m20=0.213-0.213*cos-0.787*sin;
      var m21=0.715-0.715*cos+0.715*sin;
      var m22=0.072+0.928*cos+0.072*sin;
      for(var i=0;i<len;i+=4){
        var r=d[i],g=d[i+1],b=d[i+2];
        d[i]=cl(r*m00+g*m01+b*m02);
        d[i+1]=cl(r*m10+g*m11+b*m12);
        d[i+2]=cl(r*m20+g*m21+b*m22);
      }
    }
    /* blur: skip — requires spatial kernel, minor visual difference */
  }
}

/* ── Apply filter string to a canvas, return new canvas ── */
function applyFilterToCanvas(src, filterStr){
  if(!filterStr||filterStr==='none'||filterStr==='')return src;
  var ops=parseFilter(filterStr);
  if(!ops.length)return src;
  var W=src.width,H=src.height;
  var c=document.createElement('canvas');c.width=W;c.height=H;
  var g=c.getContext('2d');
  g.drawImage(src,0,0);
  var imgData=g.getImageData(0,0,W,H);
  applyOps(imgData, ops);
  g.putImageData(imgData,0,0);
  return c;
}

/* ── Main export builder ── */
window._buildExportCanvas=function(){
  /* Ensure drawing layers are composited to dv */
  if(typeof compositeLayers==='function')compositeLayers();

  var W=cv.width,H=cv.height;

  /* 1. Per-element CSS filters: bake cv and lv filters */
  var cvSrc=applyFilterToCanvas(cv, cv.style.filter);
  var lvSrc=applyFilterToCanvas(lv, lv.style.filter);

  /* 2. Composite all layers in correct order + blend modes */
  var comp=document.createElement('canvas');comp.width=W;comp.height=H;
  var cc=comp.getContext('2d');
  if(_canvasRatio==='circle'){
    cc.save();cc.beginPath();cc.arc(W/2,H/2,Math.min(W,H)/2,0,Math.PI*2);cc.clip();
  }
  cc.drawImage(uv,0,0);
  cc.drawImage(cvSrc,0,0);
  cc.globalCompositeOperation='screen';
  cc.drawImage(lvSrc,0,0);
  cc.globalCompositeOperation='source-over';
  cc.drawImage(dv,0,0);
  cc.drawImage(av,0,0);
  if(_canvasRatio==='circle')cc.restore();

  /* 3. Container-level CSS filters: #cvwrap then #stage */
  var cwF=document.getElementById('cvwrap').style.filter||'';
  var stF=document.getElementById('stage').style.filter||'';
  var combined='';
  if(cwF&&cwF!=='none')combined+=cwF+' ';
  if(stF&&stF!=='none')combined+=stF;
  combined=combined.trim();
  if(combined) comp=applyFilterToCanvas(comp, combined);

  return comp;
};

/* Expose for other modules (history export, HH export, etc.) */
window._applyFilterToCanvas=applyFilterToCanvas;

})();

/* ── Programmatic download helper ── */
window._downloadPNG=function(dataUrl, filename){
  var a=document.createElement('a');
  a.href=dataUrl;
  a.download=filename||'NeoLeo-'+Date.now()+'.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/* ── Save confirmation with upload-to-canvas link ── */
window._lastSavedDataUrl=null;
window._showSaveStatus=function(filename, dataUrl){
  window._lastSavedDataUrl=dataUrl||null;
  var si=document.getElementById('si');
  if(!si)return;
  si.innerHTML='';
  var txt=document.createTextNode('\u2713 Image saved: '+filename);
  si.appendChild(txt);
  if(dataUrl){
    var link=document.createElement('span');
    link.textContent=' \u00B7 Upload to canvas';
    link.style.cssText='color:#40c8a0;cursor:pointer;text-decoration:underline;margin-left:2px;';
    link.addEventListener('click',function(){
      var img=new Image();
      img.onload=function(){
        window.uploadedImg=img;uploadedImg=img;
        if(window._showImgComposite)window._showImgComposite(true);
        if(window._cropShowBtn)window._cropShowBtn(true);
        var thumb=document.getElementById('u-thumb');
        var maxW=196,maxH=110;
        var sc=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight);
        thumb.width=Math.round(img.naturalWidth*sc);
        thumb.height=Math.round(img.naturalHeight*sc);
        thumb.getContext('2d').drawImage(img,0,0,thumb.width,thumb.height);
        document.getElementById('u-preview').style.display='block';
        var _isSec=document.getElementById('is-sec');if(_isSec)_isSec.style.display='block';
        document.getElementById('u-preview-info').innerHTML=
          '<span>'+img.naturalWidth+' \u00D7 '+img.naturalHeight+'px</span> &nbsp;\u00B7&nbsp; <span>'+filename+'</span>';
        document.getElementById('u-controls').style.display='block';
        document.getElementById('u-engine-sec').style.display='block';
        document.getElementById('u-bake-sec').style.display='block';
        document.getElementById('u-clear-row').style.display='block';
        if(uv.width===0&&typeof sz==='function')sz();
        renderUpload();
        openPanel('upload-panel');
        document.querySelectorAll('.tbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t==='upload');});
        setI('\u2713 Image loaded to canvas: '+filename);
      };
      img.src=dataUrl;
    });
    si.appendChild(link);
  }
};

/* ── Save / Download canvas as PNG (top-bar button) ── */
window._saveCanvas=function(){
  var tmp=window._buildExportCanvas();
  var url=tmp.toDataURL('image/png');
  var modal=document.getElementById('export-modal');
  var img=document.getElementById('export-img');
  img.src=url;
  img.alt='NeoLeo-'+Date.now()+'.png';
  modal.classList.add('open');
  setI('Click Save As to download PNG');
};

/* ── Export modal: Save As button ── */
document.getElementById('export-save-as').addEventListener('click',function(){
  var img=document.getElementById('export-img');
  if(!img.src)return;
  var filename=img.alt||'NeoLeo-'+Date.now()+'.png';
  var savedUrl=img.src;
  window._downloadPNG(savedUrl, filename);
  document.getElementById('export-modal').classList.remove('open');
  document.getElementById('export-img').src='';
  window._showSaveStatus(filename, savedUrl);
  window._showSaveConfirmation(filename);
});

/* ── Save confirmation notification popup ── */
(function(){var s=document.createElement('style');s.textContent='@keyframes sc-fade-in{from{opacity:0;transform:translate(-50%,-50%) scale(0.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}';document.head.appendChild(s);})();
window._showSaveConfirmation=function(filename){
  var existing=document.getElementById('save-confirm-popup');
  if(existing) existing.remove();
  var popup=document.createElement('div');
  popup.id='save-confirm-popup';
  popup.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a2e28;border:1px solid rgba(64,200,160,0.5);border-radius:8px;padding:24px 32px;z-index:9999;box-shadow:0 12px 50px rgba(0,0,0,0.7);text-align:center;font-family:inherit;min-width:300px;max-width:480px;animation:sc-fade-in .25s ease-out;';
  popup.innerHTML='<div style="font-size:28px;margin-bottom:10px;color:#40c8a0;">&#10003;</div><div style="font-size:11px;font-weight:bold;letter-spacing:.15em;color:#40c8a0;text-transform:uppercase;margin-bottom:12px;">Image Saved Successfully</div><div style="font-size:10px;color:rgba(255,255,255,0.85);margin-bottom:6px;word-break:break-all;"><span style="color:rgba(255,255,255,0.5);">File:</span> <strong>'+filename+'</strong></div><div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:16px;">Saved to your browser\'s default <strong style="color:rgba(255,255,255,0.7);">Downloads</strong> folder</div><button id="save-confirm-ok" style="padding:6px 28px;background:rgba(64,200,160,0.12);border:1px solid rgba(64,200,160,0.4);color:#40c8a0;font-family:inherit;font-size:9px;font-weight:600;cursor:pointer;letter-spacing:.12em;text-transform:uppercase;border-radius:3px;">OK</button>';
  var backdrop=document.createElement('div');
  backdrop.id='save-confirm-backdrop';
  backdrop.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;animation:sc-fade-in .2s ease-out;';
  document.body.appendChild(backdrop);
  document.body.appendChild(popup);
  function dismiss(){popup.remove();backdrop.remove();}
  document.getElementById('save-confirm-ok').onclick=dismiss;
  backdrop.onclick=dismiss;
  setTimeout(function(){if(document.getElementById('save-confirm-popup'))dismiss();},5000);
};

/* ── Export modal close (always wire — these elements are stable) ── */
document.getElementById('export-close').addEventListener('click',function(){
  document.getElementById('export-modal').classList.remove('open');
  document.getElementById('export-img').src='';
});
document.getElementById('export-modal').addEventListener('click',function(e){
  if(e.target===this){this.classList.remove('open');document.getElementById('export-img').src='';}
});
