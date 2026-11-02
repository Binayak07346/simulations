
/* ---- JEE family: appended to every spec by chain.py. The sim's own welcome overlay inerts everything behind it
   (holdFocus); the guide engine only hides the overlay, so release the inert once it is hidden. ---- */
(function(){
  function release(){
    var ov=document.getElementById('welcome-overlay');
    if(!ov||!ov.classList.contains('hidden')) return;
    var kids=[]; for(var n=ov;n&&n.parentNode&&n!==document.body;n=n.parentNode){ for(var i=0;i<n.parentNode.children.length;i++){ var s=n.parentNode.children[i]; if(s!==n) kids.push(s); } }
    kids.forEach(function(el){ if(el.hasAttribute&&el.hasAttribute('inert')){ el.removeAttribute('inert'); if(el.getAttribute('aria-hidden')==='true') el.removeAttribute('aria-hidden'); } });
  }
  function arm(){
    var ov=document.getElementById('welcome-overlay'); release();
    if(ov&&window.MutationObserver) new MutationObserver(release).observe(ov,{attributes:true,attributeFilter:['class']});
    [0,200,800,2000].forEach(function(t){ setTimeout(release,t); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',arm); else arm();
})();
