/* Time dilation on a train — guide v2 spec. The 3D parts are boxed by the sim's own
   window.__cgSceneBox (projected through the live train camera, read-only). */
(function(){
  var $=function(id){return document.getElementById(id);};
  /* projected points of a scene part, kept inside the 3D view */
  var pts=function(k){ var f=window.__gvScenePts, g=$('gl'); if(!f||!g) return null; var P=f(k); if(!P) return null;
    return clipView(P,g.getBoundingClientRect()); };
  var clipView=function(P,r){ if(!P||!P.length) return null; var l=1e9,t=1e9,R=-1e9,b=-1e9; P.forEach(function(p){l=Math.min(l,p[0]);t=Math.min(t,p[1]);R=Math.max(R,p[0]);b=Math.max(b,p[1]);});
    var A=Math.max(1,(R-l)*(b-t)), iw=Math.max(0,Math.min(R,r.right)-Math.max(l,r.left)), ih=Math.max(0,Math.min(b,r.bottom)-Math.max(t,r.top));
    if(iw*ih/A<0.35) return null;   /* mostly out of view: no outline rather than a sliver at the edge */
    return P.map(function(p){ return [Math.max(r.left+6,Math.min(r.right-6,p[0])), Math.max(r.top+6,Math.min(r.bottom-6,p[1]))]; }); };
  var box=function(k,p){ var b=window.__cgSceneBox&&window.__cgSceneBox(k), g=$('gl'); p=p||0; if(!b||!g) return null;
    var c=g.getBoundingClientRect(), l=Math.max(c.left+8,b.left-p), t=Math.max(c.top+8,b.top-p),
        r=Math.min(c.right-8,b.left+b.width+p), bo=Math.min(c.bottom-8,b.top+b.height+p);
    return (r>l&&bo>t)?{left:l,top:t,width:r-l,height:bo-t}:null; };
  window.__GV_SPEC={
    title:'Time Dilation on a Train',
    blurb:'A light clock sits inside a moving train. Change the train’s speed and compare one tick timed on the train with the same tick timed from the platform.',
    reset:'#btnReset',
    play:'#btnPlayPause',
    start:function(){ var d3=$('btnDim3D'), vt=$('btnViewTrain');
      if(d3&&!d3.classList.contains('active')) d3.click(); if(vt&&vt.className!=='active-a') vt.click(); },
    steps:[
      {chap:'The simulation', title:'The light clock', enter:function(){ if(!pts('clock')&&window.__gvResetLook) window.__gvResetLook(); }, targets:function(){ return [{poly:pts('clock')}]; },
       text:'<p>Two round <b>mirrors</b> face each other, a height <b>h</b> apart. Together they form a clock.</p><p>You are inside the train, next to the clock. Drag to look around.</p>',
       say:'This is a light clock. Two round mirrors face each other, a height h apart. You’re inside the train, standing next to the clock, and you can drag to look around.'},
      {chap:'The simulation', title:'The photon', enter:function(){ if(!pts('photon')&&window.__gvResetLook) window.__gvResetLook(); }, targets:function(){ return [{poly:pts('photon'),pad:6,sec:true}]; },
       text:'<p>One <b>photon</b> bounces between the mirrors along the faint guide line.</p><p>One trip up and back is one tick.</p>',
       say:'A single photon bounces up and down between the mirrors, along the faint guide line. One trip up and back down counts as one tick of the clock.'},
      {chap:'Controls', title:'Where you watch from', targets:function(){ return [{sel:'#panel-frame'},{sel:'#btnDim2D'},{sel:'#btnDim3D'}]; },
       text:'<p><b>Reference frame</b> moves your view: inside the train, or out on the platform.</p><p><b>2D / 3D</b> (top bar) switches to a flat diagram of the same tick.</p>',
       say:'These two controls change how you watch. The reference frame moves your view, either inside the train or out on the platform. The 2D, 3D switch in the top bar shows the same tick as a flat diagram.'},
      {chap:'Controls', title:'Speed and mirror gap', targets:function(){ return [{sel:'#box-beta'},{sel:'#box-height'},{poly:pts('clock'),sec:true,tag:'h'}]; },
       text:'<p><b>β</b> sets how fast the train moves, as a fraction of c.</p><p><b>h</b> sets the gap between the mirrors, so it sets how long one tick takes.</p>',
       say:'Beta sets how fast the train moves, as a fraction of the speed of light. And h sets the gap between the mirrors, which sets how long one tick takes.'},
      {chap:'Controls', title:'What you measure', targets:function(){ return [{sel:'#panel-stats'},{sel:'#panel-graph'}]; },
       text:'<p><b>Statistics:</b> γ and both clock readings, t<sub>A</sub> on the train and t<sub>B</sub> on the platform.</p><p><b>Graph:</b> both readings against platform time.</p>',
       say:'The statistics panel shows gamma and both clock readings: t A on the train, and t B on the platform. The graph plots both readings against platform time.'}
    ],
    playText:'<p>Press <b>Play</b> to start the clock.</p>',
    playSay:'When you’re ready, press Play in the top bar to start the clock.',
    trigger:{ text:'<p>Press <b>Play</b> and watch the photon bounce.</p>', say:'Press Play, and watch the photon bounce between the mirrors.' }   /* at: defaults to Play; static sims name a slider or toggle */
  };
})();
