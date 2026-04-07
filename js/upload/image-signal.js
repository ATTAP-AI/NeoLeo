/* ══════════════════════════════════════════════════════════
   IMAGE SIGNAL EXTRACTION — extracted from NeoLeo monolith
   Depends on globals: uploadedImg, window._showImgComposite,
     window._MORPH, window._MBD, window._onPaletteChange
   ══════════════════════════════════════════════════════════ */
(function(){

var GW=80,GH=60; /* extraction grid */

var IS={
  active:false, influence:0.7, palBlend:1.0, invertMap:false,
  densMap:null, gradMap:null, warmMap:null, palCols:[], gradDirs:null,

  /* ── Extract all maps from uploaded image ── */
  extract:function(){
    var img=window.uploadedImg;
    if(!img){
      var st=document.getElementById('is-status');
      if(st)st.textContent='No image loaded \u2014 upload an image first';
      return;
    }
    /* Ensure panel is visible before rendering thumbnails */
    var sec=document.getElementById('is-sec');
    if(sec)sec.style.display='block';
    var oc=document.createElement('canvas');oc.width=GW;oc.height=GH;
    var ox=oc.getContext('2d');ox.drawImage(img,0,0,GW,GH);
    var id=ox.getImageData(0,0,GW,GH).data;
    var n=GW*GH;

    IS.densMap=new Float32Array(n);
    IS.gradMap=new Float32Array(n);
    IS.warmMap=new Float32Array(n);
    IS.gradDirs=new Float32Array(n*2); /* dx,dy per cell */

    for(var i=0;i<n;i++){
      var r=id[i*4]/255,g=id[i*4+1]/255,b=id[i*4+2]/255;
      IS.densMap[i]=0.299*r+0.587*g+0.114*b;
      IS.warmMap[i]=(r-b+1)*0.5;
    }

    /* Sobel gradient */
    for(var y=1;y<GH-1;y++){
      for(var x=1;x<GW-1;x++){
        var d=IS.densMap;
        var gx=-d[(y-1)*GW+(x-1)]+d[(y-1)*GW+(x+1)]-2*d[y*GW+(x-1)]+2*d[y*GW+(x+1)]-d[(y+1)*GW+(x-1)]+d[(y+1)*GW+(x+1)];
        var gy=-d[(y-1)*GW+(x-1)]-2*d[(y-1)*GW+x]-d[(y-1)*GW+(x+1)]+d[(y+1)*GW+(x-1)]+2*d[(y+1)*GW+x]+d[(y+1)*GW+(x+1)];
        var mag=Math.sqrt(gx*gx+gy*gy);
        IS.gradMap[y*GW+x]=Math.min(1,mag*3);
        if(mag>0){IS.gradDirs[(y*GW+x)*2]=gx/mag;IS.gradDirs[(y*GW+x)*2+1]=gy/mag;}
      }
    }

    /* k-means palette (6 clusters, 12 iterations) */
    IS._extractPalette(id,n);

    IS.active=true;
    IS._updateUI();
    /* Defer thumb render to next frame so canvases are visible in DOM */
    requestAnimationFrame(function(){
      IS._renderThumbs();
    });
    IS._applyPalette();
    IS._updateBadge();

    /* Re-render any open experimental tool */
    setTimeout(function(){
      if(window._MORPH&&document.getElementById('morph-body')&&document.getElementById('morph-body').style.display!=='none')window._MORPH.render();
      if(window._MBD&&document.getElementById('mbd-body')&&document.getElementById('mbd-body').style.display!=='none')window._MBD.render();
    },50);
  },

  _extractPalette:function(id,n){
    var step=Math.floor(n/6);
    var centroids=[];
    for(var k=0;k<6;k++)centroids.push([id[k*step*4],id[k*step*4+1],id[k*step*4+2]]);
    for(var iter=0;iter<12;iter++){
      var sums=centroids.map(function(){return[0,0,0,0];});
      for(var i=0;i<n;i++){
        var r=id[i*4],g=id[i*4+1],b=id[i*4+2];
        var bi=0,bd=Infinity;
        for(var c=0;c<centroids.length;c++){var dd=(r-centroids[c][0])*(r-centroids[c][0])+(g-centroids[c][1])*(g-centroids[c][1])+(b-centroids[c][2])*(b-centroids[c][2]);if(dd<bd){bd=dd;bi=c;}}
        sums[bi][0]+=r;sums[bi][1]+=g;sums[bi][2]+=b;sums[bi][3]++;
      }
      centroids=sums.map(function(s,i){return s[3]>0?[s[0]/s[3],s[1]/s[3],s[2]/s[3]]:centroids[i];});
    }
    centroids.sort(function(a,b){return(0.299*a[0]+0.587*a[1]+0.114*a[2])-(0.299*b[0]+0.587*b[1]+0.114*b[2]);});
    IS.palCols=centroids.map(function(c){return'#'+c.map(function(v){return Math.round(v).toString(16).padStart(2,'0');}).join('');});
  },

  deactivate:function(){
    IS.active=false;
    IS._updateBadge();
    var st=document.getElementById('is-status');
    if(st)st.textContent='Signal off \u2014 engines run independently';
  },

  toggleInvert:function(btn){
    IS.invertMap=!IS.invertMap;
    if(btn){btn.style.borderColor=IS.invertMap?'#97c3b0':'#444';btn.style.color=IS.invertMap?'#97c3b0':'var(--dim)';}
    IS._renderThumbs();
  },

  /* ── Spatial helpers (exposed on window) ── */
  getDens:function(nx,ny){
    if(!IS.active||!IS.densMap)return 0.5;
    var gx=Math.max(0,Math.min(GW-1,Math.floor(nx*GW)));
    var gy=Math.max(0,Math.min(GH-1,Math.floor(ny*GH)));
    var v=IS.densMap[gy*GW+gx];
    if(IS.invertMap)v=1-v;
    return v*IS.influence+(1-IS.influence)*0.5;
  },
  getGrad:function(nx,ny){
    if(!IS.active||!IS.gradMap)return 0;
    var gx=Math.max(0,Math.min(GW-1,Math.floor(nx*GW)));
    var gy=Math.max(0,Math.min(GH-1,Math.floor(ny*GH)));
    return IS.gradMap[gy*GW+gx];
  },
  getGradDir:function(nx,ny){
    if(!IS.active||!IS.gradDirs)return[0,0];
    var gx=Math.max(0,Math.min(GW-1,Math.floor(nx*GW)));
    var gy=Math.max(0,Math.min(GH-1,Math.floor(ny*GH)));
    var i=(gy*GW+gx)*2;
    return[IS.gradDirs[i],IS.gradDirs[i+1]];
  },
  getWarm:function(){
    if(!IS.active||!IS.warmMap)return 0.5;
    var s=0,n=GW*GH;for(var i=0;i<n;i++)s+=IS.warmMap[i];
    return s/n;
  },

  /* ── Apply extracted palette to NeoLeo ── */
  _applyPalette:function(){
    if(!IS.active||IS.palCols.length===0||IS.palBlend<=0)return;
    /* Set custom palette via NeoLeo's custom palette system */
    var sel=document.getElementById('pal');
    if(sel){
      /* Store extracted palette in custom palette slot */
      var customSlots=document.querySelectorAll('.cpe-slot');
      if(customSlots.length>0){
        IS.palCols.forEach(function(col,ci){
          if(ci<customSlots.length){
            var slot=customSlots[ci];
            slot.style.background=col;
            slot.dataset.col=col;
          }
        });
        /* Apply it */
        var applyBtn=document.getElementById('cp-apply-btn');
        if(applyBtn)applyBtn.click();
      }
    }
    if(window._onPaletteChange)window._onPaletteChange();
  },

  /* ── Post-process engine canvas with density map (all 48 engines) ── */
  applyToEngine:function(ctx,W,H){
    if(!IS.active||!IS.densMap||IS.influence<=0)return;
    var tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;
    var tc=tmp.getContext('2d');
    var id=tc.createImageData(W,H);
    for(var py=0;py<H;py++){
      for(var px=0;px<W;px++){
        var d=IS.getDens(px/W,py/H);
        var i=(py*W+px)*4;
        id.data[i]=id.data[i+1]=id.data[i+2]=Math.floor(d*255);
        id.data[i+3]=255;
      }
    }
    tc.putImageData(id,0,0);
    ctx.save();
    ctx.globalCompositeOperation='multiply';
    ctx.globalAlpha=IS.influence*0.8;
    ctx.drawImage(tmp,0,0);
    ctx.restore();
    /* Restore visibility after multiply (re-screen brightens) */
    ctx.save();
    ctx.globalCompositeOperation='screen';
    ctx.globalAlpha=IS.influence*0.25;
    ctx.drawImage(tmp,0,0);
    ctx.restore();
  },

  /* ── Get image-stat dimensions for Memory Architecture ── */
  getMBDDims:function(){
    if(!IS.active||!IS.densMap)return null;
    var n=GW*GH,avgW=0,avgD=0,avgE=0;
    for(var i=0;i<n;i++){avgW+=IS.warmMap[i];avgD+=(1-IS.densMap[i]);avgE+=IS.gradMap[i];}
    avgW/=n;avgD/=n;avgE/=n;
    var inf=IS.influence;
    return{
      warm:   avgW*inf+0.5*(1-inf),
      weight: avgD*inf+0.4*(1-inf),
      time:   (0.6+avgE*inf*2.5),
      dis:    Math.min(1,avgE*inf*3),
      tex:    Math.min(1,avgE*inf*2.5),
      space:  0.5,
      res:    0.65+avgW*inf*0.3
    };
  },

  /* ── UI helpers ── */
  _updateUI:function(){
    var st=document.getElementById('is-status');
    if(st)st.textContent='Active \u2014 palette extracted, density field ready';
    var btn=document.getElementById('is-extract-btn');
    if(btn){btn.style.borderColor='#97c3b0';btn.style.color='#fff';btn.style.background='rgba(151,195,176,0.15)';}
  },

  _updateBadge:function(){
    var badge=document.getElementById('is-badge');
    if(badge)badge.style.display=IS.active?'inline':'none';
  },

  _renderThumbs:function(){
    if(!IS.densMap)return;

    function drawMap(cvId,fillFn){
      var cv2=document.getElementById(cvId);
      if(!cv2)return;
      /* Force explicit pixel dimensions regardless of CSS/display state */
      cv2.width=80; cv2.height=60;
      var cx=cv2.getContext('2d');
      var id2=cx.createImageData(80,60);
      for(var y=0;y<60;y++)for(var x=0;x<80;x++){
        var gx2=Math.min(GW-1,Math.floor(x/80*GW));
        var gy2=Math.min(GH-1,Math.floor(y/60*GH));
        var val=fillFn(gy2*GW+gx2);
        var pi=(y*80+x)*4;
        id2.data[pi]=val[0];id2.data[pi+1]=val[1];id2.data[pi+2]=val[2];id2.data[pi+3]=255;
      }
      cx.putImageData(id2,0,0);
    }

    drawMap('is-map-thumb',function(i){
      var v=IS.densMap[i]; if(IS.invertMap)v=1-v;
      v=Math.min(1,Math.max(0,v));
      var c=Math.floor(v*255); return[c,c,c];
    });
    drawMap('is-grad-thumb',function(i){
      var v=Math.min(1,IS.gradMap[i]*2.5);
      return[Math.floor(v*230),Math.floor(v*160),20];
    });

    /* Palette swatches */
    var pr=document.getElementById('is-pal-row');
    if(pr&&IS.palCols.length){
      pr.innerHTML='<div style="font-size:8px;color:#97c3b0;margin-bottom:3px;">palette</div>';
      IS.palCols.forEach(function(c){
        var d=document.createElement('div');
        d.style.cssText='width:100%;height:8px;border-radius:1px;background:'+c+';margin-bottom:1px;';
        pr.appendChild(d);
      });
    }
  }
};

window._IS=IS;
window._ISgetDens=function(nx,ny){return IS.getDens(nx,ny);};
window._ISgetGrad=function(nx,ny){return IS.getGrad(nx,ny);};

/* ── Show IS panel when image loads ── */
var _origShowComposite2=window._showImgComposite;
window._showImgComposite=function(v){
  if(_origShowComposite2)_origShowComposite2(v);
  /* Always show IS section whenever an image is present */
  var sec=document.getElementById('is-sec');
  if(sec)sec.style.display=window.uploadedImg?'block':'none';
};

/* ── Slider wiring ── */
setTimeout(function(){
  var infEl=document.getElementById('is-inf');
  var palEl=document.getElementById('is-pal');
  if(infEl)infEl.addEventListener('input',function(){
    IS.influence=parseInt(this.value)/100;
    document.getElementById('is-inf-v').textContent=this.value+'%';
    clearTimeout(IS._infTimer);
    IS._infTimer=setTimeout(function(){
      if(window._MORPH){var mb=document.getElementById('morph-body');if(mb&&mb.style.display!=='none')window._MORPH.render();}
      if(window._MBD){var mb2=document.getElementById('mbd-body');if(mb2&&mb2.style.display!=='none')window._MBD.render();}
    },150);
  });
  if(palEl)palEl.addEventListener('input',function(){
    IS.palBlend=parseInt(this.value)/100;
    document.getElementById('is-pal-v').textContent=this.value+'%';
    clearTimeout(IS._palTimer);
    IS._palTimer=setTimeout(function(){IS._applyPalette();},200);
  });
},600);

})();
