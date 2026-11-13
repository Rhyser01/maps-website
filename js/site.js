/* MAPS shared script — services, slideshows, project galleries and photo enlarging.
   Everything comes from the files in the /data folder (one per side):
   each service has a name, a short description and its own photos.
   Add, rename, reorder or remove services and photos there — nothing here needs changing. */
(function(){
  var yr=document.getElementById('year'); if(yr) yr.textContent=new Date().getFullYear();

  var cache={};
  function loadData(url){
    if(!cache[url]) cache[url]=fetch(url,{cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){
        var services=(d.services||[]).filter(function(s){ return s && s.name; }).map(function(s){
          var id=slug(s.name);
          return {id:id,name:s.name,description:s.description||'',photos:(s.photos||[]).filter(function(p){ return p && p.src; }).map(function(p){
            return {src:p.src,caption:p.caption||s.name,alt:p.alt,category:id};
          })};
        });
        var photos=[];
        services.forEach(function(s){ photos=photos.concat(s.photos); });
        (d.other_photos||[]).forEach(function(p){ if(p && p.src) photos.push({src:p.src,caption:p.caption||'',alt:p.alt,category:''}); });
        return {services:services,photos:photos};
      });
    return cache[url];
  }
  function slug(t){ return String(t).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function el(tag,attrs,text){ var e=document.createElement(tag); for(var k in attrs) e.setAttribute(k,attrs[k]); if(text!=null) e.textContent=text; return e; }
  function pad(n){ return (n<10?'0':'')+n; }
  function photoImg(p,lazy){ return el('img',{src:p.src,alt:p.alt||p.caption||'MAPS project photo',loading:lazy?'lazy':'eager',decoding:'async','class':'photo-expand'}); }

  /* Residential service cards: <div class="service-grid" data-services="..." data-gallery="..."> */
  document.querySelectorAll('.service-grid[data-services]').forEach(function(grid){
    var gallery=grid.getAttribute('data-gallery'), before=grid.querySelector('.service-card.ask');
    loadData(grid.getAttribute('data-services')).then(function(d){
      d.services.forEach(function(s,i){
        var a=el('a',{'class':'service-card',href:gallery+'?service='+s.id});
        a.appendChild(el('span',{'class':'service-num'},pad(i+1)));
        a.appendChild(el('h3',{},s.name));
        if(s.description) a.appendChild(el('p',{},s.description));
        a.appendChild(el('span',{'class':'service-more'},s.photos.length?'See projects →':'Ask about this →'));
        grid.insertBefore(a,before);
      });
    });
  });

  /* Commercial scope list: <ul class="scope-list" data-services="..." data-gallery="..."> */
  document.querySelectorAll('.scope-list[data-services]').forEach(function(list){
    var gallery=list.getAttribute('data-gallery');
    loadData(list.getAttribute('data-services')).then(function(d){
      d.services.forEach(function(s,i){
        var li=el('li'), a=el('a',{href:gallery+'?service='+s.id});
        a.appendChild(el('span',{'class':'scope-num'},pad(i+1)));
        a.appendChild(el('span',{'class':'scope-title'},s.name));
        a.appendChild(el('span',{'class':'scope-desc'},s.description));
        a.appendChild(el('span',{'class':'scope-arrow'},'→'));
        li.appendChild(a); list.appendChild(li);
      });
    });
  });

  /* Slideshow: <div class="project-slider" data-photos="..."> — shows every photo */
  document.querySelectorAll('.project-slider[data-photos]').forEach(function(slider){
    var wrap=slider.closest('.work')||document, status=wrap.querySelector('.slide-status');
    loadData(slider.getAttribute('data-photos')).then(function(d){
      var photos=d.photos;
      if(!photos.length){ slider.appendChild(el('div',{'class':'slider-empty'},'Project photos coming soon.')); return; }
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
      slider.addEventListener('touchend',function(e){ if(sx===null) return; var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){ show(idx+(dx<0?1:-1)); restart(); } sx=null; },{passive:true});
      restart();
    }).catch(function(){ slider.appendChild(el('div',{'class':'slider-empty'},'Photos could not be loaded.')); });
  });

  /* Gallery with service filters: <div class="gallery-grid" data-photos="..."> */
  document.querySelectorAll('.gallery-grid[data-photos]').forEach(function(grid){
    var count=document.querySelector('.gallery-count'), filters=document.querySelector('.gallery-filters'), empty=document.querySelector('.gallery-empty');
    loadData(grid.getAttribute('data-photos')).then(function(d){
      var figs=d.photos.map(function(p,i){
        var f=el('figure',{'data-category':p.category});
        f.appendChild(photoImg(p,i>5));
        if(p.caption) f.appendChild(el('figcaption',{},p.caption));
        grid.appendChild(f); return f;
      });
      var wanted=(new URLSearchParams(location.search).get('service')||'all').toLowerCase();
      if(!d.services.some(function(s){ return s.id===wanted; })) wanted='all';
      var buttons=[];
      if(filters){
        var all=el('button',{type:'button','data-filter':'all'},'All projects'); filters.appendChild(all); buttons.push(all);
        d.services.forEach(function(s){
          if(!s.photos.length && s.id!==wanted) return; // only show filters that have photos
          var b=el('button',{type:'button','data-filter':s.id},s.name); filters.appendChild(b); buttons.push(b);
        });
        if(buttons.length<2) filters.style.display='none';
      }
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
  var box=null; if(!box) return; /* photo zoom turned off */
  var large=document.getElementById('lightbox-image'), caption=document.getElementById('lightbox-caption');
  var group=[], gi=0, lastFocus=null, tx=null;
  function render(){ var img=group[gi]; large.src=img.currentSrc||img.src; large.alt=img.alt; caption.textContent=img.alt||''; }
  function open(img){
    var scope=img.closest('.project-slider,.gallery-grid,.oncall-gallery,.image-composition,.service-photo-strip')||document.querySelector('main');
    group=Array.prototype.slice.call(scope.querySelectorAll('img.photo-expand')).filter(function(i){ return !i.closest('[hidden]'); });
    gi=Math.max(0,group.indexOf(img));
    lastFocus=document.activeElement; render(); box.classList.add('open'); box.setAttribute('aria-hidden','false');
    box.querySelector('.lightbox-close').focus(); document.body.style.overflow='hidden';
  }
  function close(){ box.classList.remove('open'); box.setAttribute('aria-hidden','true'); document.body.style.overflow=''; large.removeAttribute('src'); if(lastFocus) lastFocus.focus(); }
  function step(dlt){ gi=(gi+dlt+group.length)%group.length; render(); }
  document.querySelectorAll('main img:not(.no-expand)').forEach(function(img){ img.classList.add('photo-expand'); });
  document.addEventListener('click',function(e){ var img=e.target.closest&&e.target.closest('main img.photo-expand'); if(img) open(img); });
  box.querySelector('.lightbox-close').addEventListener('click',close);
  box.querySelector('.lightbox-prev').addEventListener('click',function(){ step(-1); });
  box.querySelector('.lightbox-next').addEventListener('click',function(){ step(1); });
  box.addEventListener('click',function(e){ if(e.target===box) close(); });
  document.addEventListener('keydown',function(e){ if(!box.classList.contains('open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') step(-1); if(e.key==='ArrowRight') step(1); });
  box.addEventListener('touchstart',function(e){ tx=e.changedTouches[0].clientX; },{passive:true});
  box.addEventListener('touchend',function(e){ if(tx===null) return; var dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) step(dx<0?1:-1); tx=null; },{passive:true});
})();
