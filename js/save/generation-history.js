/* ══════════════════════════════════════════════════════════
   GENERATION HISTORY  (last 4 renders, cycle prev/next)
   ══════════════════════════════════════════════════════════ */
(function(){

const MAX_HIST = 4;
const THUMB_W  = 104; // @2x for retina
const THUMB_H  = 104;

const histWrap      = document.getElementById('hist-wrap');
const histThumbs    = document.getElementById('hist-thumbs');
const histPos       = document.getElementById('hist-pos');
const histPrev      = document.getElementById('hist-prev');
const histNext      = document.getElementById('hist-next');
const histRestore   = document.getElementById('hist-restore-btn');
const histExport    = document.getElementById('hist-export-btn');

/* Each entry: { composite: ImageData, layers: {cv,dv,lv,av,uv}, eng, pal, seed, label } */
let history = [];
let cursor  = -1; /* index of currently displayed entry */

/* ── Capture a full composite snapshot ── */
function snapLayers(){
  function capLayer(c){
    try{ return c.getContext('2d').getImageData(0,0,c.width,c.height); }catch(e){return null;}
  }
  return { cv:capLayer(cv), dv:capLayer(dv), lv:capLayer(lv), av:capLayer(av), uv:capLayer(uv) };
}

function makeThumb(layers){
  const t = document.createElement('canvas');
  t.width = THUMB_W; t.height = THUMB_H;
  const tc = t.getContext('2d');
  /* Composite all layers scaled into thumb */
  function drawLayer(id){
    if(!id)return;
    const tmp=document.createElement('canvas');tmp.width=id.width;tmp.height=id.height;
    tmp.getContext('2d').putImageData(id,0,0);
    tc.drawImage(tmp,0,0,THUMB_W,THUMB_H);
  }
  drawLayer(layers.uv);
  drawLayer(layers.cv);
  tc.globalCompositeOperation='screen';
  drawLayer(layers.lv);
  tc.globalCompositeOperation='source-over';
  drawLayer(layers.dv);
  drawLayer(layers.av);
  return t;
}

/* ── Public: push a new history entry (called after generate completes) ── */
window._histPush = function(){
  const layers = snapLayers();
  const thumb  = makeThumb(layers);
  const entry  = {
    layers,
    thumb,
    eng: eng,
    pal: document.getElementById('pal').value,
    seed: lseed,
    label: (ENAMES[eng]||eng)
  };
  /* Truncate any forward history if we branched */
  if(cursor < history.length-1) history = history.slice(0, cursor+1);
  history.push(entry);
  if(history.length > MAX_HIST) history.shift();
  cursor = history.length - 1;
  renderHistUI();
};

/* ── Restore a saved layer set ── */
function restoreEntry(entry){
  function putLayer(c, id){
    if(!id)return;
    const dc=c.getContext('2d');
    dc.clearRect(0,0,c.width,c.height);
    /* Only restore if same size */
    if(id.width===c.width && id.height===c.height){
      dc.putImageData(id,0,0);
    } else {
      /* Scale via temp canvas */
      const tmp=document.createElement('canvas');tmp.width=id.width;tmp.height=id.height;
      tmp.getContext('2d').putImageData(id,0,0);
      dc.drawImage(tmp,0,0,c.width,c.height);
    }
  }
  [cv,lv,dv,av,uv].forEach(c=>c.getContext('2d').clearRect(0,0,c.width,c.height));
  putLayer(cv, entry.layers.cv);
  putLayer(lv, entry.layers.lv);
  putLayer(dv, entry.layers.dv);
  putLayer(av, entry.layers.av);
  putLayer(uv, entry.layers.uv);
  setI('history: '+entry.label+' · seed '+entry.seed);
  document.getElementById('se').textContent = entry.label;
}

/* ── Export composite of current history entry ── */
function exportEntry(entry){
  const W=cv.width,H=cv.height;
  const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;
  const tc=tmp.getContext('2d');
  function drawL(id){
    if(!id)return;
    const t2=document.createElement('canvas');t2.width=id.width;t2.height=id.height;
    t2.getContext('2d').putImageData(id,0,0);
    tc.drawImage(t2,0,0,W,H);
  }
  function drawLFiltered(id,filterStr){
    if(!id)return;
    const t2=document.createElement('canvas');t2.width=id.width;t2.height=id.height;
    t2.getContext('2d').putImageData(id,0,0);
    if(filterStr&&filterStr!=='none'&&filterStr!==''&&window._applyFilterToCanvas){
      const filtered=window._applyFilterToCanvas(t2, filterStr);
      tc.drawImage(filtered,0,0,W,H);
    } else {
      tc.drawImage(t2,0,0,W,H);
    }
  }
  drawL(entry.layers.uv);
  drawLFiltered(entry.layers.cv, cv.style.filter);
  tc.globalCompositeOperation='screen';
  drawLFiltered(entry.layers.lv, lv.style.filter);
  tc.globalCompositeOperation='source-over';
  drawL(entry.layers.dv);drawL(entry.layers.av);

  /* Apply container CSS filters (#cvwrap + #stage) via manual pixel ops */
  var cwF=document.getElementById('cvwrap').style.filter||'';
  var stF=document.getElementById('stage').style.filter||'';
  var combined='';
  if(cwF&&cwF!=='none')combined+=cwF+' ';
  if(stF&&stF!=='none')combined+=stF;
  combined=combined.trim();
  var result=tmp;
  if(combined&&window._applyFilterToCanvas){
    result=window._applyFilterToCanvas(tmp, combined);
  }

  const url=result.toDataURL('image/png');
  const modal=document.getElementById('export-modal');
  const img=document.getElementById('export-img');
  img.src=url;
  img.alt='neoleo-hist-'+(entry.eng||'art')+'-'+Date.now()+'.png';
  modal.classList.add('open');
  setI('Right-click image to save PNG');
}

/* ── Build thumbnail strip ── */
function renderHistUI(){
  if(!history.length){ histWrap.classList.remove('has-items'); return; }
  histWrap.classList.add('has-items');
  histThumbs.innerHTML='';
  history.forEach((entry,i)=>{
    const wrap=document.createElement('div');
    wrap.className='hist-thumb'+(i===cursor?' active':'');

    const c=document.createElement('canvas');c.width=52;c.height=52;
    const tc=c.getContext('2d');tc.drawImage(entry.thumb,0,0,52,52);
    wrap.appendChild(c);

    /* Per-thumb overlay: Del + Save buttons */
    const btns=document.createElement('div');btns.className='hist-btns';
    const delB=document.createElement('button');delB.className='hist-btn del';delB.textContent='Del';delB.title='Delete from history';
    const savB=document.createElement('button');savB.className='hist-btn sav';savB.textContent='Save';savB.title='Save to storage';
    btns.appendChild(delB);btns.appendChild(savB);
    wrap.appendChild(btns);

    const lbl=document.createElement('div');lbl.className='hist-label';
    lbl.textContent=(entry.eng||'?');wrap.appendChild(lbl);

    /* Click on canvas area: select / restore */
    c.addEventListener('click',()=>{ cursor=i; renderHistUI(); restoreEntry(history[cursor]); });
    lbl.addEventListener('click',()=>{ cursor=i; renderHistUI(); restoreEntry(history[cursor]); });

    /* Delete button */
    delB.addEventListener('click',e=>{
      e.stopPropagation();
      history.splice(i,1);
      if(cursor>=history.length)cursor=history.length-1;
      renderHistUI();
      if(history[cursor])restoreEntry(history[cursor]);
    });

    /* Save to localStorage */
    savB.addEventListener('click',e=>{
      e.stopPropagation();
      saveEntryToStorage(entry,i);
    });

    histThumbs.appendChild(wrap);
  });
  /* Scroll active thumb into view */
  const active=histThumbs.querySelectorAll('.hist-thumb')[cursor];
  if(active)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
  histPos.textContent=(cursor+1)+'/'+history.length;
  histPrev.disabled=(cursor<=0);
  histNext.disabled=(cursor>=history.length-1);
}

/* ── Save history entry to localStorage (reuses save-state store) ── */
function saveEntryToStorage(entry, histIdx){
  function imgDataToURL(id){
    if(!id)return null;
    const t=document.createElement('canvas');t.width=id.width;t.height=id.height;
    t.getContext('2d').putImageData(id,0,0);return t.toDataURL('image/png');
  }
  const defaultName=(ENAMES[entry.eng]||entry.eng)+' · '+(new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}));
  promptSaveName(defaultName, name=>{
    const thumb88=document.createElement('canvas');thumb88.width=88;thumb88.height=88;
    thumb88.getContext('2d').drawImage(entry.thumb,0,0,88,88);
    const storeEntry={
      ts:Date.now(),
      name:name,
      eng:entry.eng,
      pal:entry.pal,
      seed:entry.seed,
      thumb:thumb88.toDataURL('image/jpeg',0.6),
      layers:{
        cv:imgDataToURL(entry.layers.cv),
        dv:imgDataToURL(entry.layers.dv),
        uv:imgDataToURL(entry.layers.uv)
      }
    };
    try{
      const SK='neoleo_states';
      let slots=[];try{const r=localStorage.getItem(SK);slots=r?JSON.parse(r):[];}catch(e){}
      slots.unshift(storeEntry);
      if(slots.length>8)slots.splice(8);
      localStorage.setItem(SK,JSON.stringify(slots));
      setI('saved: '+name);
      if(typeof renderSlots==='function')renderSlots();
    }catch(e){setI('Storage save failed: '+e.message);}
  });
}

const histDelete=document.getElementById('hist-delete-btn');
const histSave  =document.getElementById('hist-save-btn');

histPrev.addEventListener('click',()=>{
  if(cursor>0){ cursor--; renderHistUI(); restoreEntry(history[cursor]); }
});
histNext.addEventListener('click',()=>{
  if(cursor<history.length-1){ cursor++; renderHistUI(); restoreEntry(history[cursor]); }
});

/* [ and ] cycle through history */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  if(e.key==='['){e.preventDefault();histPrev.click();}
  if(e.key===']'){e.preventDefault();histNext.click();}
});
histRestore.addEventListener('click',()=>{
  if(history[cursor]) restoreEntry(history[cursor]);
});
histExport.addEventListener('click',()=>{
  if(history[cursor]) exportEntry(history[cursor]);
});
if(histDelete) histDelete.addEventListener('click',()=>{
  if(cursor<0||!history.length)return;
  history.splice(cursor,1);
  if(cursor>=history.length)cursor=history.length-1;
  renderHistUI();
  if(history[cursor])restoreEntry(history[cursor]);
});
if(histSave) histSave.addEventListener('click',()=>{
  if(history[cursor]) saveEntryToStorage(history[cursor],cursor);
});

})();
