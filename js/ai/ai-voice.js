/* ══════════════════════════════════════════════════════════════════
   AI VOICE INPUT — Web Speech API mic for the AI Prompt panel
   ══════════════════════════════════════════════════════════════════
   Toggle-record button next to Send. First tap asks the browser for
   microphone permission (once, then remembered per origin), starts
   the Web Speech recognizer, and streams interim + final transcripts
   into the AI textarea. Second tap stops. Nothing is auto-sent — the
   user still confirms with Send, so mis-hears never round-trip to the
   API without review.

   Browser support today (2026): Chrome, Edge, Safari (desktop + iOS
   16.4+), Chromium-based mobile. Firefox has partial support hidden
   behind a pref, so if the SpeechRecognition constructor is missing
   we hide the mic button entirely — users on those browsers see the
   panel exactly as it was before.

   No network hop; transcription runs locally (Chrome/Edge stream to
   Google's servers under the hood, Safari uses on-device dictation).
   No Anthropic tokens spent until the user hits Send.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return;   /* Browser can't do it; leave the mic button hidden. */

  var btn = document.getElementById('ai-mic');
  var ta  = document.getElementById('ai-textarea');
  var hist= document.getElementById('ai-history');
  if(!btn || !ta) return;
  btn.style.display = 'inline-block';

  /* ---- Style states ----
     idle:      dim, mic glyph
     recording: red pulse, wave glyph, "listening..." tooltip
     failed:    orange, warning glyph (surfaces last error text) */
  function setState(state, note){
    btn.classList.remove('rec','fail');
    btn.title = 'Speak your prompt (tap to start, tap to stop)';
    if(state === 'rec'){
      btn.classList.add('rec');
      btn.innerHTML = '&#9679;';  /* solid dot */
      btn.title = 'Listening… tap to stop';
    } else if(state === 'fail'){
      btn.classList.add('fail');
      btn.innerHTML = '&#9888;';  /* warning */
      btn.title = note || 'Voice error';
    } else {
      btn.innerHTML = '&#127908;';  /* microphone emoji */
    }
  }

  /* ---- Recognizer setup ---- */

  var rec = null, listening = false, baseText = '';

  function ensureRec(){
    if(rec) return rec;
    rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    /* Use the browser language if available, else en-US. Falls back
       cleanly on Safari where lang is often empty. */
    rec.lang = (navigator.language || 'en-US');

    rec.onresult = function(ev){
      var interim = '', finalPart = '';
      for(var i = ev.resultIndex; i < ev.results.length; i++){
        var t = ev.results[i][0].transcript;
        if(ev.results[i].isFinal) finalPart += t;
        else interim += t;
      }
      /* Preserve whatever the user had typed manually before the mic
         opened (baseText), then append every new fragment. Final
         phrases stick; interim ones repaint as the recognizer refines
         its guess. */
      if(finalPart){
        baseText = (baseText + ' ' + finalPart).replace(/\s+/g, ' ').trim();
      }
      ta.value = (baseText + (interim ? (' ' + interim) : '')).trim();
      ta.dispatchEvent(new Event('input', {bubbles: true}));
    };

    rec.onerror = function(e){
      var reason = e.error || 'unknown';
      var friendly = ({
        'not-allowed':   'Microphone permission denied. Enable it in the browser address bar.',
        'no-speech':     'No speech detected. Try again a little louder.',
        'audio-capture': 'No microphone found on this device.',
        'aborted':       'Voice stopped.',
        'network':       'Network glitch during transcription — try again.'
      })[reason] || ('Voice error: ' + reason);
      /* "aborted" fires on a normal user-stop, so don't nag. */
      if(reason !== 'aborted'){
        addSys(friendly);
        setState('fail', friendly);
      }
      listening = false;
    };

    rec.onend = function(){
      /* Reset button once the recognizer actually stops. */
      listening = false;
      if(!btn.classList.contains('fail')) setState('idle');
    };

    return rec;
  }

  function addSys(msg){
    if(!hist) return;
    var d = document.createElement('div');
    d.className = 'ai-msg sys';
    d.textContent = msg;
    hist.appendChild(d);
    hist.scrollTop = hist.scrollHeight;
  }

  function start(){
    if(listening) return;
    var r = ensureRec();
    baseText = (ta.value || '').trim();
    try{
      r.start();
      listening = true;
      setState('rec');
      ta.focus();
    }catch(e){
      /* start() throws if we're already recording somewhere else in
         the page. Reset and try once more; if it still fails surface
         the error into the chat. */
      try{ r.stop(); }catch(_){}
      setTimeout(function(){
        try{ r.start(); listening = true; setState('rec'); }
        catch(e2){ addSys('Could not start microphone: ' + e2.message); setState('fail'); }
      }, 150);
    }
  }

  function stop(){
    if(!rec || !listening) return;
    try{ rec.stop(); }catch(e){}
    /* onend flips state back to idle. */
  }

  btn.addEventListener('click', function(){
    if(listening) stop(); else start();
  });

  /* Space-bar convenience: if the textarea is empty and focused, a
     long-press Space could dictate — but that clashes with normal
     typing. Skipping unless someone asks for a push-to-talk mode. */

  /* ---- Public handle for scripting / hotkeys ---- */
  window._aiVoice = {
    start:  start,
    stop:   stop,
    toggle: function(){ if(listening) stop(); else start(); },
    isListening: function(){ return listening; }
  };
})();
