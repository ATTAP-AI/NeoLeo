/* ══════════════════════════════════════════════════════════
   SAVE / RESTORE STATE SYSTEM
   ══════════════════════════════════════════════════════════ */
(function(){

const MAX_SLOTS = 8;
const STORE_KEY = 'neoleo_states';

/* ── Storage helpers (localStorage, fall back to in-memory) ── */
let _mem = {};
function storeGet(){try{const r=localStorage.getItem(STORE_KEY);return r?JSON.parse(r):[];}catch(e){return _mem[STORE_KEY]||[];}}
function storeSave(slots){try{localStorage.setItem(STORE_KEY,JSON.stringify(slots));}catch(e){_mem[STORE_KEY]=slots;}}

/* ── Collect entire app state ── */
function captureState(){
  /* Composite all visible layers into a single thumbnail */
  const SZ = 88;
  const thumb = document.createElement('canvas');
  thumb.width = SZ; thumb.height = SZ;
  const tc = thumb.getContext('2d');
  tc.drawImage(uv, 0,0, SZ, SZ);
  tc.drawImage(cv, 0,0, SZ, SZ);
  tc.globalCompositeOperation = 'screen';
  tc.drawImage(lv, 0,0, SZ, SZ);
  tc.globalCompositeOperation = 'source-over';
  tc.drawImage(dv, 0,0, SZ, SZ);
  tc.drawImage(av, 0,0, SZ, SZ);
  const thumbData = thumb.toDataURL('image/jpeg', 0.6);

  /* Save each canvas layer as full-res JPEG/PNG */
  function layerData(c){ try{ return c.getContext('2d').getImageData(0,0,c.width,c.height); }catch(e){return null;} }
  function imgDataToB64(id){
    if(!id) return null;
    const t=document.createElement('canvas');t.width=id.width;t.height=id.height;
    t.getContext('2d').putImageData(id,0,0);
    return t.toDataURL('image/png');
  }

  /* Gather all param values */
  const params={};
  if(PD[eng]) PD[eng].forEach(p=>{params[p.id]=gp(p.id);});

  return {
    ts: Date.now(),
    eng,
    pal: document.getElementById('pal').value,
    params,
    seed_val: lseed,
    locked,
    LS: JSON.parse(JSON.stringify(LS)),
    AS: JSON.parse(JSON.stringify(AS)),
    custom_pal: JSON.parse(JSON.stringify(PALS['custom']||{bg:'#000',c:['#fff']})),
    layers: {
      cv: imgDataToB64(layerData(cv)),
      dv: imgDataToB64(layerData(dv)),
      uv: imgDataToB64(layerData(uv)),
    },
    thumb: thumbData,
    w: cv.width,
    h: cv.height
  };
}

/* ── Restore a saved state ── */
function restoreState(state){
  /* Resize canvases if needed */
  if(state.w && state.w !== cv.width){
    /* sz() handles resize — skip for simplicity, just clear and draw */
  }

  /* Restore palette */
  if(state.custom_pal) PALS['custom'] = state.custom_pal;
  const palSel = document.getElementById('pal');
  palSel.value = state.pal || 'ember';
  drawSw();

  /* Restore engine + params */
  if(state.eng && ENAMES[state.eng]){
    eng = state.eng;
    _engineSelected=true;
    document.querySelectorAll('.eng').forEach(b=>b.classList.toggle('on',b.dataset.e===eng));
    buildP(eng);
    if(state.params){
      Object.entries(state.params).forEach(([id,val])=>{
        const el=document.getElementById(id); if(!el) return;
        if(el.tagName==='SELECT') el.value=String(val);
        else {
          el.value=val;
          const pd=PD[eng]&&PD[eng].find(p=>p.id===id);
          const vl=document.getElementById(id+'v');
          if(vl&&pd) vl.textContent=parseFloat(val).toFixed(pd.st<1?(pd.st.toString().split('.')[1]||'').length:0);
        }
      });
    }
  }

  /* Restore seed */
  if(state.seed_val!=null){
    lseed=state.seed_val;
    document.getElementById('si2').value=state.seed_val;
    document.getElementById('ss').textContent=state.seed_val;
  }
  /* Restore lock */
  locked=!!state.locked;
  const lb=document.getElementById('lbtn');
  if(lb){lb.classList.toggle('on',locked);lb.textContent=locked?'LOCKED':'LOCK';}

  /* Restore LS */
  if(state.LS){
    Object.assign(LS, JSON.parse(JSON.stringify(state.LS)));
    /* Sync LS UI */
    const lOn=document.getElementById('l-on');if(lOn)lOn.checked=LS.on;
    [0,1].forEach(i=>{
      const n=i+1,lt=LS.lights[i];
      const ckOn=document.getElementById('l'+n+'-on');if(ckOn)ckOn.checked=lt.on;
      const tp=document.getElementById('l'+n+'-type');if(tp)tp.value=lt.type;
      const cl=document.getElementById('l'+n+'-col');if(cl)cl.value=lt.col;
      const sw=document.getElementById('l'+n+'csw');if(sw)sw.style.background=lt.col;
      ['int','px','py','rad'].forEach(k=>{
        const sl=document.getElementById('l'+n+'-'+k);if(sl)sl.value=lt[k];
        const vl=document.getElementById('l'+n+'-'+k+'v');if(vl)vl.textContent=lt[k]+(k==='px'||k==='py'?'%':'');
      });
    });
    const blm=document.getElementById('l-blm');if(blm)blm.value=LS.bloom;
    const blmv=document.getElementById('l-blmv');if(blmv)blmv.textContent=LS.bloom;
    renderLighting();
  }

  /* Restore AS */
  if(state.AS){
    Object.assign(AS, JSON.parse(JSON.stringify(state.AS)));
    const aOn=document.getElementById('a-on');if(aOn)aOn.checked=AS.on;
    [['a-vstr','a-vstrv',AS.vig.str],['a-vsft','a-vsftv',AS.vig.soft],
     ['a-fden','a-fdenv',AS.fog.den],['a-grain','a-grainv',AS.grain],
     ['a-temp','a-tempv',AS.grade.temp],['a-sat','a-satv',AS.grade.sat],
     ['a-con','a-conv',AS.grade.con],['a-bri','a-briv',AS.grade.bri],
     ['a-aber','a-aberv',AS.aber]].forEach(([sid,vid,val])=>{
      const s=document.getElementById(sid);if(s)s.value=val;
      const v=document.getElementById(vid);if(v)v.textContent=val;
    });
    const ft=document.getElementById('a-ftype');if(ft)ft.value=AS.fog.type;
    renderAtmosphere();
  }

  /* Restore canvas layers */
  function loadLayer(c,dataUrl,cb){
    const context=c.getContext('2d');
    context.clearRect(0,0,c.width,c.height);
    if(!dataUrl){if(cb)cb();return;}
    const img=new Image();
    img.onload=()=>{context.drawImage(img,0,0,c.width,c.height);if(cb)cb();};
    img.onerror=()=>{if(cb)cb();};
    img.src=dataUrl;
  }

  /* Clear everything first */
  [cv,lv,dv,av,uv].forEach(c=>c.getContext('2d').clearRect(0,0,c.width,c.height));
  lv.style.filter='';
  document.getElementById('cvwrap').style.filter='none';
  uploadedImg=null;window.uploadedImg=null;
  cv.style.opacity='1';lv.style.opacity='1';

  const layers=state.layers||{};
  loadLayer(cv,layers.cv,()=>{
    loadLayer(dv,layers.dv,()=>{
      loadLayer(uv,layers.uv,()=>{
        renderLighting();
        renderAtmosphere();
        setI('state restored');
      });
    });
  });

  document.getElementById('se').textContent=ENAMES[eng]||eng;
}

/* ── Thumbnail canvas for slot display ── */
function makeThumbCanvas(dataUrl){
  const c=document.createElement('canvas');c.width=44;c.height=44;
  if(dataUrl){const img=new Image();img.onload=()=>c.getContext('2d').drawImage(img,0,0,44,44);img.src=dataUrl;}
  return c;
}

function fmtDate(ts){
  const d=new Date(ts);
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}

/* ── Render the slots list ── */
function renderSlots(){
  const list=document.getElementById('slots-list');
  const slots=storeGet();
  if(!slots.length){list.innerHTML='<div class="slot-empty">No saved states yet.</div>';return;}
  list.innerHTML='';
  slots.forEach((s,i)=>{
    const row=document.createElement('div');row.className='slot';

    const thumb=document.createElement('div');thumb.className='slot-thumb';
    const tc=makeThumbCanvas(s.thumb);thumb.appendChild(tc);
    thumb.addEventListener('click',()=>{
      if(!confirm('Restore this state? Unsaved changes will be lost.'))return;
      restoreState(s);
    });

    const meta=document.createElement('div');meta.className='slot-meta';
    const name=document.createElement('div');name.className='slot-name';
    name.textContent=s.name||(ENAMES[s.eng]||s.eng)+' · '+(s.pal||'');
    const info=document.createElement('div');info.className='slot-info';
    info.textContent=fmtDate(s.ts);
    meta.appendChild(name);meta.appendChild(info);

    const del=document.createElement('button');del.className='slot-del';del.innerHTML='&times;';del.title='Delete';
    del.addEventListener('click',e=>{
      e.stopPropagation();
      const all=storeGet();all.splice(i,1);storeSave(all);renderSlots();
    });

    row.appendChild(thumb);row.appendChild(meta);row.appendChild(del);
    list.appendChild(row);
  });
}

/* ── Shared save-name modal (exposed globally) ── */
window.promptSaveName = function promptSaveName(defaultName, onConfirm){
  const modal = document.getElementById('save-name-modal');
  const inp   = document.getElementById('save-name-in');
  const ok    = document.getElementById('save-name-ok');
  const cancel= document.getElementById('save-name-cancel');
  inp.value = '';
  inp.placeholder = defaultName || 'Enter a name…';
  modal.classList.add('open');
  setTimeout(()=>inp.focus(),50);
  function finish(confirmed){
    modal.classList.remove('open');
    ok.removeEventListener('click', handleOk);
    cancel.removeEventListener('click', handleCancel);
    modal.removeEventListener('click', handleOutside);
    inp.removeEventListener('keydown', handleKey);
    if(confirmed) onConfirm(inp.value.trim() || defaultName);
  }
  function handleOk(){ finish(true); }
  function handleCancel(){ finish(false); }
  function handleOutside(e){ if(e.target===modal) finish(false); }
  function handleKey(e){
    if(e.key==='Enter'){ e.preventDefault(); finish(true); }
    if(e.key==='Escape'){ e.preventDefault(); finish(false); }
  }
  ok.addEventListener('click', handleOk);
  cancel.addEventListener('click', handleCancel);
  modal.addEventListener('click', handleOutside);
  inp.addEventListener('keydown', handleKey);
}

/* ── Save button ── */
document.getElementById('save-btn').addEventListener('click',()=>{
  const state=captureState();
  const defaultName=(ENAMES[eng]||eng)+' · '+(new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}));
  promptSaveName(defaultName, name=>{
    state.name = name;
    const slots=storeGet();
    slots.unshift(state);
    if(slots.length>MAX_SLOTS)slots.splice(MAX_SLOTS);
    storeSave(slots);
    document.getElementById('slots-wrap').classList.add('open');
    renderSlots();
    setI('\u2713 State saved: '+name);
  });
});

document.getElementById('slots-close-btn').addEventListener('click',()=>{
  document.getElementById('slots-wrap').classList.remove('open');
});

/* Render on init in case there are persisted states */
renderSlots();

})();
