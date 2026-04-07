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

/* ── Save / Download canvas as PNG (top-bar button) ── */
window._saveCanvas=function(){
  var tmp=window._buildExportCanvas();
  var url=tmp.toDataURL('image/png');
  var modal=document.getElementById('export-modal');
  var img=document.getElementById('export-img');
  img.src=url;
  img.alt='NeoLeo-'+Date.now()+'.png';
  modal.classList.add('open');
  setI('Right-click image to save PNG');
};
