/* Double-Slit Experiment — guide v2 spec. The 3D parts are boxed by the sim's own projection helpers
   (exported read-only as window.__gvGeo), so each loop follows the camera if the bench is turned. */
(function(){
  var G=function(){ return window.__gvGeo||{}; };
  /* projected corners of a part, kept inside the 3D view */
  var pts=function(k){ var f=G().pts, c=document.getElementById('main-canvas'); if(!f||!c) return null; var P; try{ P=f(k); }catch(e){ return null; } if(!P) return null;
    return clipView(P,c.getBoundingClientRect()); };
  var clipView=function(P,r){ if(!P||!P.length) return null; var l=1e9,t=1e9,R=-1e9,b=-1e9; P.forEach(function(p){l=Math.min(l,p[0]);t=Math.min(t,p[1]);R=Math.max(R,p[0]);b=Math.max(b,p[1]);});
    var A=Math.max(1,(R-l)*(b-t)), iw=Math.max(0,Math.min(R,r.right)-Math.max(l,r.left)), ih=Math.max(0,Math.min(b,r.bottom)-Math.max(t,r.top));
    if(iw*ih/A<0.35) return null;   /* mostly out of view: no outline rather than a sliver at the edge */
    return P.map(function(p){ return [Math.max(r.left+6,Math.min(r.right-6,p[0])), Math.max(r.top+6,Math.min(r.bottom-6,p[1]))]; }); };
  /* one outline around several controls that sit together */
  var group=function(sels){ var l=1e9,t=1e9,r=-1e9,b=-1e9,n=0; sels.forEach(function(s){ var e=document.querySelector(s); if(!e) return; var q=e.getBoundingClientRect(); if(!q.width) return;
    l=Math.min(l,q.left); t=Math.min(t,q.top); r=Math.max(r,q.right); b=Math.max(b,q.bottom); n++; }); return n?{left:l-3,top:t-3,width:r-l+6,height:b-t+6}:null; };
  window.__GV_SPEC={
    title:'Double-Slit Experiment',
    blurb:'Particles go through two narrow slits, one at a time, and land on a screen. Change the slits and the wavelength, and see what pattern builds up.',
    reset:'#reset-btn',
    play:'#playpause-btn',
    steps:[
      {chap:'The simulation', title:'Source and two slits',
       targets:function(){ return [{ellipse:G().source?G().source():null},{poly:pts('barrier')}]; },
       text:'<p>Particles leave the <b>source</b> and reach a barrier with two narrow slits, <b>S1</b> and <b>S2</b>.</p><p>Drag to turn the view.</p>',
       say:'Particles leave the source at the front and travel to a barrier with two narrow slits, S one and S two. You can drag the view to look at the setup from any side.'},
      {chap:'The simulation', title:'Screen and chart',
       targets:function(){ var f=G().dom; return [{poly:pts('screen')},{rect:f?f('.detector-chart-panel',3):null}]; },
       text:'<p>Particles that pass the slits land on the <b>detector screen</b>.</p><p>The <b>chart</b> counts where they land. The green curve is the quantum prediction.</p>',
       say:'Particles that get through the slits land on the detector screen at the back. The chart in the corner counts where they land, and the green curve shows what quantum theory predicts.'},
      {chap:'Controls', title:'The slits',
       targets:function(){ return [{rect:group(['#sep-box','#width-box'])},{poly:pts('barrier'),sec:true,tag:'d, a'}]; },
       text:'<p><b>Slit separation d</b> sets how far apart the two slits are.</p><p><b>Slit width a</b> sets how wide each slit is.</p>',
       say:'The first two sliders change the slits in the barrier. Slit separation sets how far apart the two slits are, and slit width sets how wide each one is.'},
      {chap:'Controls', title:'Light and screen',
       targets:function(){ return [{rect:group(['#wavelength-group','#dist-box'])},{ellipse:G().source?G().source():null,sec:true,tag:'λ'},{poly:pts('screen'),sec:true,tag:'L'}]; },
       text:'<p><b>Wavelength λ</b> changes the light the source sends out.</p><p><b>Screen distance L</b> moves the detector screen nearer or farther.</p>',
       say:'The next two sliders change the light and the screen. Wavelength changes the light that comes out of the source, and screen distance moves the detector screen nearer or farther.'},
      {chap:'Controls', title:'Slit control',
       targets:function(){ return [{sel:'#slit-control-box'},{sel:'#classical-btn',sec:true}]; },
       text:'<p><b>S1 / S2:</b> open or close each slit.</p><p><b>Classical Pattern</b> (top bar): shows the pattern classical particles would make.</p>',
       say:'Down here you can open or close each slit on its own. In the top bar, Classical Pattern shows the pattern that classical particles would make instead.'}
    ],
    playText:'<p>Press <b>Play</b> to start sending particles.</p>',
    playSay:'When you’re ready, press Play in the top bar to start sending particles.',
    trigger:{ text:'<p>Press <b>Play</b> and watch where the particles land.</p>', say:'Press Play, and watch where the particles land on the screen.' }   /* at: defaults to Play; static sims name a slider or toggle */
  };
})();
