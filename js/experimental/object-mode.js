/* ═══════════════════════════════════════════════════════════════════
   OBJECT MODE v4
   • Each completed mark becomes an object with visible bbox
   • Click inside any bbox → select (solid teal handles)
   • 8 resize handles (corners + edges) + 1 rotation handle
   • Drag rotation handle (circle above top-center) → rotate
   • Drag corner/edge handles → scale
   • Click selected obj body → drag to move
   • Sliders adjust selected object live
   ═══════════════════════════════════════════════════════════════════ */
(function(){

/* ── State ── */
var S={on:false,objs:[],selId:null,nid:1,
  action:null, /* 'move'|'rotate'|'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w' */
  startPt:null, startBbox:null, startAngle:null, startScale:null};
var _ov=null,_ovCtx=null,_slH=[];
var HSIZE=7; /* handle pixel radius */

/* ── CSS ── */
(function(){
  var s=document.createElement('style');
  s.textContent='#om-btn{width:100%;padding:6px 10px;background:rgba(40,224,209,0.04);'+
    'border:1px solid var(--brd);color:var(--dim);font-family:inherit;font-size:9px;cursor:pointer;'+
    'letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;'+
    'justify-content:space-between;}#om-btn.on{background:rgba(40,224,209,0.14);border-color:#28E0D1;color:#28E0D1;}';
  document.head.appendChild(s);
})();

/* ── Button ── */
setTimeout(function(){
  var dt=document.getElementById('dt-body');if(!dt)return;
  if(document.getElementById('om-btn'))return; /* already injected — guard against double-run */
  /* Remove any orphaned non-functional om-btn clones */
  dt.querySelectorAll('#om-btn').forEach(function(el,i){if(i>0)el.remove();});
  var btn=document.createElement('button');btn.id='om-btn';
  btn.innerHTML='<span>&#9671; Object Mode</span><span id="om-st">off</span>';
  btn.addEventListener('click',toggleOM);
  dt.insertBefore(btn,dt.firstChild);
  window.toggleObjMode=toggleOM;
},300);

function toggleOM(){
  S.on=!S.on;
  var b=document.getElementById('om-btn'),st=document.getElementById('om-st');
  if(b)b.classList.toggle('on',S.on);
  if(st)st.textContent=S.on?S.objs.length+' objs':'off';
  if(!S.on){desel();clearOV();}
  else{ensureOV();drawAllBoxes();si('Object Mode ON — draw marks, click bbox to select');}
}
window.toggleObjMode=function(){toggleOM();};

/* ── Helpers ── */
function si(m){var e=document.getElementById('si');if(e)e.textContent=m;}
function updSt(){var s=document.getElementById('om-st');if(s)s.textContent=S.on?S.objs.length+' objs'+(S.selId?' · 1 sel':''):'off';}

/* ── Overlay ── */
function ensureOV(){
  if(_ov)return;
  var wrap=document.getElementById('cvwrap'),dv=document.getElementById('dv');
  if(!wrap||!dv)return;
  _ov=document.createElement('canvas');_ov.id='om-ov';
  _ov.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:8;';
  _ov.width=dv.width;_ov.height=dv.height;
  _ov.style.width=dv.style.width;_ov.style.height=dv.style.height;
  wrap.appendChild(_ov);_ovCtx=_ov.getContext('2d');
}
function syncOV(){
  if(!_ov)return;var dv=document.getElementById('dv');if(!dv)return;
  if(_ov.width!==dv.width){_ov.width=dv.width;_ov.height=dv.height;}
  _ov.style.width=dv.style.width;_ov.style.height=dv.style.height;
}
function clearOV(){if(_ovCtx&&_ov)_ovCtx.clearRect(0,0,_ov.width,_ov.height);}

/* ── Object center, rotated corners ── */
function objCenter(o){
  return{x:o.bbox.x+o.bbox.w/2, y:o.bbox.y+o.bbox.h/2};
}
/* 9 handle positions in un-rotated bbox space, then rotated */
function handles(o){
  var cx=o.bbox.x+o.bbox.w/2, cy=o.bbox.y+o.bbox.h/2;
  var hw=o.bbox.w/2, hh=o.bbox.h/2;
  var ang=o.angle||0;
  function rot(lx,ly){
    var c=Math.cos(ang),s2=Math.sin(ang);
    return{x:cx+lx*c-ly*s2, y:cy+lx*s2+ly*c};
  }
  return{
    nw:rot(-hw,-hh),ne:rot(hw,-hh),sw:rot(-hw,hh),se:rot(hw,hh),
    n:rot(0,-hh),s:rot(0,hh),w:rot(-hw,0),e:rot(hw,0),
    rot:rot(0,-hh-28) /* rotation handle above top-center */
  };
}

/* ── Draw all bounding boxes ── */
function drawAllBoxes(){
  if(!S.on||!_ovCtx)return;
  clearOV();syncOV();
  S.objs.forEach(function(o){
    var sel=o.id===S.selId;
    if(sel)drawObjBox(o,true); /* only draw box when selected */
  });
}
function drawObjBox(o,sel){
  var c=_ovCtx,cx=o.bbox.x+o.bbox.w/2,cy=o.bbox.y+o.bbox.h/2;
  var hw=o.bbox.w/2,hh=o.bbox.h/2,ang=o.angle||0;
  c.save();c.translate(cx,cy);c.rotate(ang);
  /* Box */
  c.strokeStyle=sel?'#28E0D1':'rgba(40,224,209,0.35)';
  c.lineWidth=sel?1.5:1;c.setLineDash(sel?[]:[3,3]);
  c.strokeRect(-hw,-hh,o.bbox.w,o.bbox.h);c.setLineDash([]);
  if(sel){
    /* Rotation handle line + circle */
    c.strokeStyle='rgba(40,224,209,0.6)';c.lineWidth=1;
    c.beginPath();c.moveTo(0,-hh);c.lineTo(0,-hh-28);c.stroke();
    c.fillStyle='rgba(40,200,200,0.2)';c.strokeStyle='#28E0D1';c.lineWidth=1.5;
    c.beginPath();c.arc(0,-hh-28,HSIZE,0,Math.PI*2);c.fill();c.stroke();
    /* Rotation arrow inside handle */
    c.fillStyle='#28E0D1';c.font='bold 9px monospace';c.textAlign='center';
    c.fillText('↻',0,-hh-24);
    /* Corner + edge handles */
    [[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh],[0,-hh],[0,hh],[-hw,0],[hw,0]].forEach(function(p){
      c.fillStyle='#28E0D1';c.strokeStyle='rgba(255,255,255,0.9)';c.lineWidth=1;
      c.fillRect(p[0]-HSIZE/2,p[1]-HSIZE/2,HSIZE,HSIZE);
      c.strokeRect(p[0]-HSIZE/2,p[1]-HSIZE/2,HSIZE,HSIZE);
    });
    /* Label */
    c.restore();c.save();
    c.font='9px monospace';c.fillStyle='rgba(40,224,209,0.9)';c.textAlign='left';
    c.fillText('move · resize · ↻ rotate · Del',cx-hw,cy-hh-35);
  }
  c.restore();
}

/* ── Coordinate helper ── */
function cvPt(e){
  var dv=document.getElementById('dv');if(!dv)return null;
  var r=dv.getBoundingClientRect();
  var src=e.changedTouches?e.changedTouches[0]:e;
  var x=(src.clientX-r.left)*(dv.width/r.width);
  var y=(src.clientY-r.top)*(dv.height/r.height);
  if(x<-20||y<-20||x>dv.width+20||y>dv.height+20)return null;
  return{x:x,y:y};
}

/* ── Hit test: which handle or object? ── */
function whichHandle(o,cx,cy){
  var hs=handles(o),R=HSIZE+4;
  /* Check rotation handle first */
  var dr=Math.hypot(cx-hs.rot.x,cy-hs.rot.y);
  if(dr<=R+4)return 'rotate';
  /* Check resize handles */
  var checks=[['nw',hs.nw],['ne',hs.ne],['sw',hs.sw],['se',hs.se],
              ['n',hs.n],['s',hs.s],['w',hs.w],['e',hs.e]];
  for(var i=0;i<checks.length;i++){
    if(Math.hypot(cx-checks[i][1].x,cy-checks[i][1].y)<=R)return checks[i][0];
  }
  /* Check inside body */
  var ang=-(o.angle||0);
  var c2=Math.cos(ang),s2=Math.sin(ang);
  var lx=(cx-(o.bbox.x+o.bbox.w/2))*c2-(cy-(o.bbox.y+o.bbox.h/2))*s2;
  var ly=(cx-(o.bbox.x+o.bbox.w/2))*s2+(cy-(o.bbox.y+o.bbox.h/2))*c2;
  if(Math.abs(lx)<=o.bbox.w/2+6&&Math.abs(ly)<=o.bbox.h/2+6)return 'move';
  return null;
}
function hitAny(cx,cy){
  for(var i=S.objs.length-1;i>=0;i--){
    var h=whichHandle(S.objs[i],cx,cy);
    if(h)return{obj:S.objs[i],handle:h};
  }
  return null;
}

/* ── Select / deselect ── */
function sel(o){S.selId=o.id;drawAllBoxes();wireSliders(o);updSt();
  si('Selected — drag body to move, corners/edges to resize, ↻ to rotate');}
function desel(){S.selId=null;S.action=null;unwireSliders();drawAllBoxes();updSt();}

/* ── Sliders ── */
function wireSliders(o){
  unwireSliders();
  function mk(id,fn){var el=document.getElementById(id);if(!el)return;
    var h=function(){fn(el);recomputeBbox(o);redrawAll();drawAllBoxes();};
    el.addEventListener('input',h);_slH.push([el,h]);}
  mk('szr',function(el){o.sz=parseInt(el.value)||o.sz;});
  mk('opr',function(el){o.op=parseInt(el.value)/100;});
  mk('dcol',function(el){o.col=el.value;});
  mk('hdr',function(el){if(o.type==='stroke')o.hd=parseInt(el.value)/100;});
}
function unwireSliders(){_slH.forEach(function(h){h[0].removeEventListener('input',h[1]);});_slH=[];}

/* ── Recompute bbox keeping center stable ── */
function recomputeBbox(o){
  var pad=(o.sz||4)+4;
  if(o.pts&&o.pts.length){
    var xs=o.pts.map(function(p){return p[0];}),ys=o.pts.map(function(p){return p[1];});
    var cx=o.bbox.x+o.bbox.w/2,cy=o.bbox.y+o.bbox.h/2;
    var nw=Math.max.apply(null,xs)-Math.min.apply(null,xs)+pad*2;
    var nh=Math.max.apply(null,ys)-Math.min.apply(null,ys)+pad*2;
    o.bbox={x:cx-nw/2,y:cy-nh/2,w:nw,h:nh};
  }
}

/* ── Apply scale to object (around center) ── */
function scaleObject(o,sx,sy){
  var cx=o.bbox.x+o.bbox.w/2,cy=o.bbox.y+o.bbox.h/2;
  o.scale=(o.scale||1)*Math.max(0.05,(sx+sy)/2);
  if(o.pts)o.pts=o.pts.map(function(p){
    return[cx+(p[0]-cx)*sx, cy+(p[1]-cy)*sy];
  });
  if(o.x0!==undefined){
    o.x0=cx+(o.x0-cx)*sx;o.y0=cy+(o.y0-cy)*sy;
    o.x1=cx+(o.x1-cx)*sx;o.y1=cy+(o.y1-cy)*sy;
  }
  o.sz=Math.max(0.5,o.sz*Math.max(0.05,(sx+sy)/2));
  o.bbox.w=Math.max(10,o.bbox.w*sx);o.bbox.h=Math.max(10,o.bbox.h*sy);
  o.bbox.x=cx-o.bbox.w/2;o.bbox.y=cy-o.bbox.h/2;
}

/* ── Rotate all points around center ── */
function rotateObject(o,dAngle){
  o.angle=(o.angle||0)+dAngle;
  var cx=o.bbox.x+o.bbox.w/2,cy=o.bbox.y+o.bbox.h/2;
  var c2=Math.cos(dAngle),s2=Math.sin(dAngle);
  if(o.pts)o.pts=o.pts.map(function(p){
    var lx=p[0]-cx,ly=p[1]-cy;
    return[cx+lx*c2-ly*s2, cy+lx*s2+ly*c2];
  });
  if(o.x0!==undefined){
    var pts2=[[o.x0,o.y0],[o.x1,o.y1]].map(function(p){
      var lx=p[0]-cx,ly=p[1]-cy;
      return[cx+lx*c2-ly*s2,cy+lx*s2+ly*c2];
    });
    o.x0=pts2[0][0];o.y0=pts2[0][1];o.x1=pts2[1][0];o.y1=pts2[1][1];
  }
}

/* ── Redraw all objects ── */
function redrawAll(){
  var lctx=window._getActiveLayerCtx?window._getActiveLayerCtx():(window._dctx||null);
  if(!lctx)return;
  lctx.clearRect(0,0,lctx.canvas.width,lctx.canvas.height);
  if(window._dctx&&window._dv)window._dctx.clearRect(0,0,window._dv.width,window._dv.height);
  S.objs.forEach(function(o){renderObj(o,lctx);});
  if(window._layersCompositeFn)window._layersCompositeFn();
}

function renderObj(o,c){
  var cx=o.bbox.x+o.bbox.w/2,cy=o.bbox.y+o.bbox.h/2;
  c.save();
  c.translate(cx,cy);c.rotate(o.angle||0);c.translate(-cx,-cy);
  c.strokeStyle=o.col;c.fillStyle=o.col;
  c.lineWidth=o.sz;c.globalAlpha=o.op;c.lineCap='round';c.lineJoin='round';
  if(o.type==='stroke'&&typeof window.applyBrushStroke==='function'&&o.pts){
    window.applyBrushStroke(c,o.pts,o.brushType,o.col,o.sz,o.hd,o.op);
  } else if(o.type==='line'){
    c.beginPath();c.moveTo(o.x0,o.y0);c.lineTo(o.x1,o.y1);c.stroke();
  } else if(o.type==='rect'){
    c.beginPath();c.rect(o.x0,o.y0,o.x1-o.x0,o.y1-o.y0);
    if(o.fill!=='stroke')c.fill();if(o.fill!=='fill')c.stroke();
  } else if(o.type==='ellipse'){
    c.beginPath();c.ellipse(o.x0+(o.x1-o.x0)/2,o.y0+(o.y1-o.y0)/2,
      Math.abs(o.x1-o.x0)/2,Math.abs(o.y1-o.y0)/2,0,0,Math.PI*2);
    if(o.fill!=='stroke')c.fill();if(o.fill!=='fill')c.stroke();
  } else if(o.pts){
    c.beginPath();o.pts.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});
    c.closePath();if(o.fill!=='stroke')c.fill();if(o.fill!=='fill')c.stroke();
  }
  c.restore();
}

/* ── Mouse events ── */
document.addEventListener('mousedown',function(e){
  if(!S.on)return;
  var pt=cvPt(e);if(!pt)return;
  var hit=hitAny(pt.x,pt.y);
  if(hit){
    e.stopPropagation();e.preventDefault();
    if(S.selId!==hit.obj.id){sel(hit.obj);S.action=null;return;}
    /* Already selected — start transform action */
    S.action=hit.handle;
    S.startPt={x:pt.x,y:pt.y};
    S.startBbox={x:hit.obj.bbox.x,y:hit.obj.bbox.y,w:hit.obj.bbox.w,h:hit.obj.bbox.h};
    S.startAngle=hit.obj.angle||0;
    var cx=hit.obj.bbox.x+hit.obj.bbox.w/2,cy=hit.obj.bbox.y+hit.obj.bbox.h/2;
    S.startRotAngle=Math.atan2(pt.y-cy,pt.x-cx);
  } else {
    if(S.selId!==null){e.stopPropagation();e.preventDefault();desel();}
  }
},{capture:true});

document.addEventListener('mousemove',function(e){
  if(!S.on||!S.action||S.selId===null)return;
  var pt=cvPt(e);
  var dv=document.getElementById('dv');if(!dv)return;
  var r=dv.getBoundingClientRect();
  var src=e.changedTouches?e.changedTouches[0]:e;
  var cx2=(src.clientX-r.left)*(dv.width/r.width);
  var cy2=(src.clientY-r.top)*(dv.height/r.height);
  var o=S.objs.find(function(x){return x.id===S.selId;});
  if(!o)return;
  var dx=cx2-S.startPt.x, dy=cy2-S.startPt.y;

  if(S.action==='move'){
    if(o.pts)o.pts=o.pts.map(function(p){return[p[0]+dx,p[1]+dy];});
    if(o.x0!==undefined){o.x0+=dx;o.y0+=dy;o.x1+=dx;o.y1+=dy;}
    o.bbox.x+=dx;o.bbox.y+=dy;
    S.startPt={x:cx2,y:cy2};

  } else if(S.action==='rotate'){
    var ocx=o.bbox.x+o.bbox.w/2, ocy=o.bbox.y+o.bbox.h/2;
    var curAng=Math.atan2(cy2-ocy,cx2-ocx);
    var dAng=curAng-S.startRotAngle;
    rotateObject(o,dAng);
    S.startRotAngle=curAng;

  } else {
    /* Resize: work in object-local space */
    var ocx2=S.startBbox.x+S.startBbox.w/2, ocy2=S.startBbox.y+S.startBbox.h/2;
    var ang=-(S.startAngle);
    var c2=Math.cos(ang),s2=Math.sin(ang);
    var ldx=dx*c2-dy*s2, ldy=dx*s2+dy*c2;
    var nb={x:S.startBbox.x,y:S.startBbox.y,w:S.startBbox.w,h:S.startBbox.h};
    if(S.action.indexOf('e')>=0){nb.w=Math.max(10,S.startBbox.w+ldx);}
    if(S.action.indexOf('w')>=0){nb.x=S.startBbox.x+Math.min(ldx,S.startBbox.w-10);nb.w=Math.max(10,S.startBbox.w-ldx);}
    if(S.action.indexOf('s')>=0){nb.h=Math.max(10,S.startBbox.h+ldy);}
    if(S.action.indexOf('n')>=0){nb.y=S.startBbox.y+Math.min(ldy,S.startBbox.h-10);nb.h=Math.max(10,S.startBbox.h-ldy);}
    var sx=nb.w/o.bbox.w, sy=nb.h/o.bbox.h;
    if(sx>0&&sy>0)scaleObject(o,sx,sy);
    S.startBbox={x:o.bbox.x,y:o.bbox.y,w:o.bbox.w,h:o.bbox.h};
    S.startPt={x:cx2,y:cy2};
  }
  redrawAll();drawAllBoxes();
});

document.addEventListener('mouseup',function(){
  if(S.action){S.action=null;if(window._layersUpdateThumbs)window._layersUpdateThumbs();}
});

document.addEventListener('keydown',function(e){
  if(!S.on)return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='Escape')desel();
  if((e.key==='Delete'||e.key==='Backspace')&&S.selId!==null){
    e.preventDefault();S.objs=S.objs.filter(function(x){return x.id!==S.selId;});
    desel();redrawAll();
  }
});

/* ── Public API ── */
window._OM={
  isOn:function(){return S.on;},
  hitTest:function(x,y){return !!hitAny(x,y);},
  add:function(o){
    if(!S.on)return;
    o.id=S.nid++;o.angle=0;o.scale=1;
    S.objs.push(o);ensureOV();drawAllBoxes();updSt();
    /* Disengage drawing briefly so next mousedown is a selection attempt, not new mark */
    window._OM_cooldown=true;
    setTimeout(function(){window._OM_cooldown=false;},600);
    si('Object #'+o.id+' — click to select, draw again to add another');
  }
};

window.addEventListener('resize',function(){setTimeout(function(){syncOV();drawAllBoxes();},80);});
})();
