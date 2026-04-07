document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;if(e.shiftKey&&e.key==='P'){e.preventDefault();document.getElementById('aitool').click();return;}if(e.shiftKey&&e.key==='U'){e.preventDefault();document.getElementById('utool').click();return;}if(e.shiftKey&&e.key==='L'){e.preventDefault();document.getElementById('ltool').click();return;}if(e.shiftKey&&e.key==='A'){e.preventDefault();document.getElementById('atool').click();return;}const km={b:'brush',p:'pencil',f:'fill',c:'creplace',l:'line',r:'rect',e:'ellipse',t:'triangle',g:'polygon',s:'shape'};if(km[e.key]){setTool(km[e.key]);return;}if(e.key==='Escape'){setTool('');return;}if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();globalUndo();}if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&e.key==='Z'))){e.preventDefault();globalRedo();}
/* ── Arrow keys navigate toolbar tools ── */
if(e.key==='ArrowDown'||e.key==='ArrowUp'){
  e.preventDefault();
  var tools=Array.from(document.querySelectorAll('#tb .tbtn'));
  if(!tools.length)return;
  /* Find the currently active tool button, or start from -1 */
  var curIdx=tools.findIndex(b=>b.classList.contains('on'));
  if(e.key==='ArrowDown'){
    curIdx=curIdx<tools.length-1?curIdx+1:0;
  } else {
    curIdx=curIdx>0?curIdx-1:tools.length-1;
  }
  tools[curIdx].click();
  tools[curIdx].focus();
}
});
