/* The Nonlinear Pendulum — guide v2 spec. Outlines come from the sim's own read-only layout hook
   (window.__cgGeo, canvas px) and the live angle state.th, so each loop sits on the drawn part. */
(function(){
  var $=function(id){return document.getElementById(id);};
  function R(l,t,r,b){ return {left:l,top:t,width:r-l,height:b-t}; }
  function cv(){ var c=$('pendCanvas'), r=c&&c.getBoundingClientRect(); return r&&r.width?r:null; }
  function geo(){ return window.__cgGeo&&window.__cgGeo(); }
  function bobAt(){ var g=geo(); if(!g) return null; var m=g.rooms[0];
    var st=window.__gvState&&window.__gvState(), th=(st&&isFinite(st.th))?st.th:g.a0;
    return {x:m.x+m.Ls*Math.sin(th), y:g.py+m.Ls*Math.cos(th), m:m, g:g}; }
  function rig(){ var c=cv(), b=bobAt(); if(!c||!b) return null; var g=b.g, m=b.m;
    var l=Math.min(m.x-g.beamW/2-6, b.x-g.bobR-10), r=Math.max(m.x+g.beamW/2+6, b.x+g.bobR+10);
    return R(c.left+l, c.top+g.py-30, c.left+r, c.top+b.y+g.bobR+12); }
  /* the L and θ₀ labels drawn just right of the bob */
  function labels(){ var c=cv(), b=bobAt(); if(!c||!b) return null; var r=b.g.bobR;
    return R(c.left+b.x+r, c.top+b.y-r-6, c.left+b.x+r+96, c.top+b.y+r+16); }
  function bob(){ var c=cv(), b=bobAt(); if(!c||!b) return null; var p=b.g.bobR+9;
    return R(c.left+b.x-p, c.top+b.y-p, c.left+b.x+p, c.top+b.y+p); }
  window.__GV_SPEC={
    title:'The Nonlinear Pendulum',
    blurb:'A real pendulum swings next to a pendulum that follows the textbook formula. Change the release angle and compare the two.',
    reset:'#shell-reset',
    play:'#shell-play',
    steps:[
      {chap:'The simulation', title:'The pendulum', targets:function(){ return [{rect:rig()}]; },
       text:'<p>A bob hangs on a light string from a pivot with no friction.</p><p>It is released from rest at angle <b>θ₀</b>, measured from the vertical.</p>',
       say:'This is the pendulum. The bob hangs on a light string from a pivot with no friction. You release it from rest at an angle, theta zero, measured from the dashed vertical line.'},
      {chap:'The simulation', title:'The formula bob', targets:function(){ return [{rect:bob()},{rect:labels(),avoid:true}]; },
       text:'<p>A dashed amber bob moves the way the formula T₀ = 2π√(L/g) predicts.</p><p>Both bobs start together, so it is behind the real bob for now.</p>',
       say:'There is a second, dashed amber bob behind the real one. It moves the way the textbook formula predicts. Both bobs start together, so at the start you can’t see it.'},
      {chap:'Controls', title:'Set up the swing', targets:function(){ return [{sel:'#box-theta'},{sel:'#box-len'},{sel:'#box-second'},{rect:rig(),sec:true,tag:'θ₀, L'}]; },
       text:'<p><b>Release angle θ₀</b> sets where the bob starts.</p><p><b>Length L</b> sets how long the string is.</p><p><b>Second pendulum</b> hangs a second bob next to the first, with its own length.</p>',
       say:'These controls set up the swing. The release angle sets where the bob starts, and the length sets how long the string is. Second pendulum hangs a second bob next to the first one, with its own length, so you can compare two lengths.'},
      {chap:'Controls', title:'Overlays and readouts', targets:function(){ return [{sel:'#grp-overlays'},{sel:'#panel-readouts'}]; },
       enter:function(){ var p=$('panel-readouts'); if(p&&p.classList.contains('collapsed')){ var h=p.querySelector('.shell-panel-head'); if(h) h.click(); } },
       text:'<p><b>Small angle:</b> shows or hides the formula bob.</p><p><b>T(θ₀) curve:</b> plots the period against the release angle.</p><p><b>Readouts:</b> the period and the swing count.</p>',
       say:'Small angle shows or hides the formula bob. The T curve plots the period against the release angle. Below them, the readouts show the period and how many swings each bob has made.'}
    ],
    playText:'<p>Press <b>Play</b> to release the bob.</p>',
    playSay:'When you’re ready, press Play in the top bar to release the bob.',
    trigger:{ text:'<p>Press <b>Play</b> and watch both bobs swing.</p>', say:'Press Play, and watch both bobs swing.' }   /* at: defaults to Play; static sims name a slider or toggle */
  };
})();
