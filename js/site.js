/* MAPS shared script — slideshows, project galleries and photo enlarging.
   Slideshow and gallery photos come from the files in the /data folder.
   Add as many photos to those files as you like; nothing here needs changing. */
(function(){
  var yr=document.getElementById('year'); if(yr) yr.textContent=new Date().getFullYear();

  function loadPhotos(url){
    return fetch(url,{cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ return (d.photos||[]).filter(function(p){ return p && p.src; }); });
  }
  function el(tag,attrs,text){ var e=document.createElement(tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(text) e.textContent=text; return e; }
  function photoImg(p,lazy){ return el('img',{src:p.src,alt:p.alt||p.caption||'MAPS project photo',loading:lazy?'lazy':'eager',decoding:'async','class':'photo-expand'}); }

  /* Slideshow: <div class="project-slider" data-photos="data/residential-projects.json"> */
  document.querySelectorAll('.project-slider[data-photos]').forEach(function(slider){
    var wrap=slider.closest('.work')||document, status=wrap.querySelector('.slide-status');
    loadPhotos(slider.getAttribute('data-photos')).then(function(photos){
      if(!photos.length){ slider.appendChild(el('div',{'class':'slider-empty'},'Project photos coming soon.')); if(status) status.textContent=''; return; }
      var slides=photos.map(function(p,i){
        var f=el('figure',{'class':'project-slide'+(i===0?' active':'')});
        f.appendChild(photoImg(p,i>1));
        if(p.caption) f.appendChild(el('figcaption',{},p.caption));
        slider.appendChild(f); return f;
      });
      var idx=0, timer=null;
      function show(n){
        idx=(n+slides.length)%slides.length;
        slides.forEach(function(s,i){ s.classList.toggle('active',i===idx); });
        var next=slides[(idx+1)%slides.length].querySelector('img'); if(next) next.loading='eager';
        if(status) status.textContent=(idx+1)+' / '+slides.length;
      }
      show(0);
      if(slides.length<2){ if(status) status.textContent=''; return; }
      var prev=el('button',{type:'button','class':'slide-arrow prev','aria-label':'Previous photo'},'‹');
      var nxt=el('button',{type:'button','class':'slide-arrow next','aria-label':'Next photo'},'›');
      slider.appendChild(prev); slider.appendChild(nxt);
      function restart(){ clearInterval(timer); if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){ timer=setInterval(function(){ if(!document.hidden && !document.querySelector('.lightbox.open')) show(idx+1); },5000); } }
      prev.addEventListener('click',function(){ show(idx-1); restart(); });
      nxt.addEventListener('click',function(){ show(idx+1); restart(); });
      var sx=null;
      slider.addEventListener('touchstart',function(e){ sx=e.changedTouches[0].clientX; },{passive:true});
      slider.addEventListener('touchend',function(e){ if(sx===null) return; var d=e.changedTouches[0].clientX-sx; if(Math.abs(d)>50){ show(idx+(d<0?1:-1)); restart(); } sx=null; },{passive:true});
      restart();
    }).catch(function(){ slider.appendChild(el('div',{'class':'slider-empty'},'Photos could not be loaded.')); });
  });

  /* Gallery: <div class="gallery-grid" data-photos="data/commercial-projects.json"> */
  document.querySelectorAll('.gallery-grid[data-photos]').forEach(function(grid){
    var count=document.querySelector('.gallery-count');
    var filters=document.querySelector('.gallery-filters'), empty=document.querySelector('.gallery-empty');
    loadPhotos(grid.getAttribute('data-photos')).then(function(photos){
      var figs=photos.map(function(p,i){
        var f=el('figure',{'data-category':p.category||''});
        f.appendChild(photoImg(p,i>5));
        if(p.caption) f.appendChild(el('figcaption',{},p.caption));
        grid.appendChild(f); return f;
      });
      var buttons=filters?Array.prototype.slice.call(filters.querySelectorAll('button[data-filter]')):[];
      var wanted=(new URLSearchParams(location.search).get('service')||'all').toLowerCase();
      if(!buttons.some(function(b){ return b.getAttribute('data-filter')===wanted; })) wanted='all';
      // Hide filter buttons that have no photos yet (unless someone linked straight to it)
      buttons.forEach(function(b){
        var k=b.getAttribute('data-filter');
        if(k!=='all' && k!==wanted && !photos.some(function(p){ return p.category===k; })) b.hidden=true;
      });
      function apply(k){
        var shown=0;
        figs.forEach(function(f){ var on=(k==='all'||f.getAttribute('data-category')===k); f.hidden=!on; if(on) shown++; });
        buttons.forEach(function(b){ b.setAttribute('aria-pressed',String(b.getAttribute('data-filter')===k)); });
        if(count) count.textContent=shown+(shown===1?' photo':' photos');
        if(empty) empty.style.display=shown?'none':'block';
        var url=new URL(location.href); if(k==='all') url.searchParams.delete('service'); else url.searchParams.set('service',k);
        history.replaceState(null,'',url);
      }
      buttons.forEach(function(b){ b.addEventListener('click',function(){ apply(b.getAttribute('data-filter')); }); });
      apply(wanted);
    }).catch(function(){ if(count) count.textContent='Photos could not be loaded.'; });
  });

  /* Click any project photo to enlarge it */
  var box=document.getElementById('photo-lightbox'); if(!box) return;
  var large=document.getElementById('lightbox-image'), caption=document.getElementById('lightbox-caption');
  var group=[], gi=0, lastFocus=null, tx=null;
  function render(){ var img=group[gi]; large.src=img.currentSrc||img.src; large.alt=img.alt; caption.textContent=img.alt||''; }
  function open(img){
    var scope=img.closest('.project-slider,.gallery-grid,.oncall-gallery,.image-composition,.service-photo-strip')||document.querySelector('main');
    group=Array.prototype.slice.call(scope.querySelectorAll('img.photo-expand')).filter(function(i){ return !i.closest('[hidden]'); }); gi=Math.max(0,group.indexOf(img));
    lastFocus=document.activeElement; render(); box.classList.add('open'); box.setAttribute('aria-hidden','false');
    box.querySelector('.lightbox-close').focus(); document.body.style.overflow='hidden';
  }
  function close(){ box.classList.remove('open'); box.setAttribute('aria-hidden','true'); document.body.style.overflow=''; large.removeAttribute('src'); if(lastFocus) lastFocus.focus(); }
  function step(d){ gi=(gi+d+group.length)%group.length; render(); }
  document.querySelectorAll('main img:not(.no-expand)').forEach(function(img){ img.classList.add('photo-expand'); });
  document.addEventListener('click',function(e){ var img=e.target.closest&&e.target.closest('main img.photo-expand'); if(img) open(img); });
  box.querySelector('.lightbox-close').addEventListener('click',close);
  box.querySelector('.lightbox-prev').addEventListener('click',function(){ step(-1); });
  box.querySelector('.lightbox-next').addEventListener('click',function(){ step(1); });
  box.addEventListener('click',function(e){ if(e.target===box) close(); });
  document.addEventListener('keydown',function(e){ if(!box.classList.contains('open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') step(-1); if(e.key==='ArrowRight') step(1); });
  box.addEventListener('touchstart',function(e){ tx=e.changedTouches[0].clientX; },{passive:true});
  box.addEventListener('touchend',function(e){ if(tx===null) return; var d=e.changedTouches[0].clientX-tx; if(Math.abs(d)>50) step(d<0?1:-1); tx=null; },{passive:true});
})();
