/* Fortune Vista Stay Inn. Site interactions, no dependencies. */
(function () {
  'use strict';
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- year ---------- */
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- sticky nav ---------- */
  var nav = $('#nav');
  var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile drawer ---------- */
  var burger = $('#burger'), menu = $('#menu');
  var setMenu = function (open) {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  };
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.addEventListener('resize', function () { if (window.innerWidth > 980) setMenu(false); });

  /* ---------- scroll-spy ---------- */
  var secIds = ['about', 'rooms', 'amenities', 'banquet', 'catering', 'gallery', 'location'];
  var links = {};
  secIds.forEach(function (id) { links[id] = $('#menu a[href="#' + id + '"]'); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var l = links[e.target.id];
        if (!l) return;
        if (e.isIntersecting) {
          Object.keys(links).forEach(function (k) { if (links[k]) links[k].classList.remove('is-active'); });
          l.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secIds.forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }
  /* failsafe: never leave content invisible if the observer misfires */
  setTimeout(function () { document.documentElement.classList.add('reveal-all'); }, 2500);

  /* ---------- hero carousel ----------
     Slide 1 ships in the HTML and stays the LCP image. Slides 2+ only get
     their <source>/<img> built after load, so they never compete with it. */
  (function () {
    var wrap = $('#heroSlides'), dotsWrap = $('#heroDots');
    if (!wrap || !dotsWrap) return;
    var slides = $$('.hero__bg', wrap);
    if (slides.length < 2) return;

    var hydrated = false;
    var hydrate = function () {
      if (hydrated) return;
      hydrated = true;
      $$('[data-hero]', wrap).forEach(function (pic) {
        ['avif', 'webp'].forEach(function (t) {
          var sc = document.createElement('source');
          sc.type = 'image/' + t;
          sc.sizes = '100vw';
          sc.srcset = pic.getAttribute('data-' + t);
          pic.appendChild(sc);
        });
        var img = document.createElement('img');
        img.width = 1600; img.height = 900;
        img.decoding = 'async';
        img.loading = 'lazy';
        img.alt = pic.getAttribute('data-alt') || '';
        img.src = pic.getAttribute('data-src');
        pic.appendChild(img);
      });
    };

    var cur = 0, timer = null;
    var DUR = 6000;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
      b.className = i === 0 ? 'is-on' : '';
      b.addEventListener('click', function () { hydrate(); go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === cur); });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-on', k === cur);
        d.setAttribute('aria-selected', String(k === cur));
      });
    }
    function tick() { hydrate(); go(cur + 1); }
    function start() { if (!reduce && !timer) timer = setInterval(tick, DUR); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    /* build the other slides once the page has settled, then begin */
    var kick = function () { hydrate(); start(); };
    if (document.readyState === 'complete') setTimeout(kick, 900);
    else window.addEventListener('load', function () { setTimeout(kick, 900); });

    var hero = $('.hero');
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    dotsWrap.addEventListener('focusin', stop);
    dotsWrap.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    /* swipe on touch */
    var hx = null;
    hero.addEventListener('touchstart', function (e) { hx = e.changedTouches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (hx === null) return;
      var dx = e.changedTouches[0].clientX - hx; hx = null;
      if (Math.abs(dx) > 55) { hydrate(); go(dx < 0 ? cur + 1 : cur - 1); restart(); }
    }, { passive: true });
  })();

  /* ---------- carousels ---------- */
  $$('[data-carousel]').forEach(function (car) {
    var track  = $('.carousel__track', car);
    var slides = $$('.carousel__slide', car);
    var dotsEl = $('.carousel__dots', car);
    var prev   = $('.carousel__nav--prev', car);
    var next   = $('.carousel__nav--next', car);
    if (!track || slides.length < 2) { if (dotsEl) dotsEl.remove(); return; }

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to photo ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsEl.appendChild(b);
      return b;
    });

    var cur = 0;
    var mark = function (i) {
      cur = i;
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    };
    var go = function (i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
      mark(i);
    };
    mark(0);

    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur + 1); });

    var tick;
    track.addEventListener('scroll', function () {
      clearTimeout(tick);
      tick = setTimeout(function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== cur) mark(Math.min(i, slides.length - 1));
      }, 90);
    }, { passive: true });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); go(cur - 1); }
    });
  });

  /* ---------- catering menu ---------- */
  var MENU = [
    { c: 'Biryani', items: [
      { n: 'Hyderabadi Biryani', d: 'Authentic dum biryani with tender meat and fragrant basmati rice.', p: 350 },
      { n: 'Dum Biryani',        d: 'Slow-cooked traditional biryani with rich spices.',                 p: 320 },
      { n: 'Biryani with Raita', d: 'Classic biryani served with refreshing cucumber raita.',            p: 380 }
    ]},
    { c: 'Kebabs', items: [
      { n: 'Seekh Kebab',   d: 'Minced meat skewers grilled to perfection.',            p: 280 },
      { n: 'Galauti Kebab', d: 'Melt-in-the-mouth minced patties with aromatic spices.', p: 320 },
      { n: 'Shami Kebab',   d: 'Pan-fried meat and lentil patties.',                     p: 260 }
    ]},
    { c: 'Haleem & Nihari', items: [
      { n: 'Haleem', d: 'Rich, slow-cooked meat and wheat stew.', p: 400 },
      { n: 'Nihari', d: 'Slow-cooked meat stew with bone marrow.', p: 450 }
    ]},
    { c: 'Breakfast', items: [
      { n: 'Dosa',   d: 'Crispy fermented crepe served with chutney and sambar.', p: 120 },
      { n: 'Idli',   d: 'Steamed rice cakes served with sambar.',                 p: 80 },
      { n: 'Samosa', d: 'Crispy pastry filled with spiced potatoes.',             p: 40 }
    ]},
    { c: 'Beverages', items: [
      { n: 'Chai / Tea', d: 'Traditional Indian spiced tea.',   p: 30 },
      { n: 'Coffee',     d: 'Freshly brewed filter coffee.',    p: 50 },
      { n: 'Lassi',      d: 'Sweet or salted yoghurt drink.',   p: 80 }
    ]}
  ];

  var modal = $('#menuModal'), mBody = $('#menuBody'), mTabs = $('#menuTabs');
  var built = false, lastFocus = null;

  var buildMenu = function () {
    if (built) return;
    built = true;
    MENU.forEach(function (cat, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = cat.c;
      b.className = i === 0 ? 'is-on' : '';
      b.addEventListener('click', function () {
        $$('button', mTabs).forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
        var t = $('#mcat-' + i);
        if (t) mBody.scrollTo({ top: t.offsetTop - mBody.offsetTop - 8, behavior: 'smooth' });
      });
      mTabs.appendChild(b);

      var sec = document.createElement('section');
      sec.className = 'mcat';
      sec.id = 'mcat-' + i;
      var h = document.createElement('h3');
      h.textContent = cat.c;
      sec.appendChild(h);
      cat.items.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'mitem';
        var left = document.createElement('div');
        left.className = 'mitem__n';
        left.textContent = it.n;
        var dsc = document.createElement('span');
        dsc.className = 'mitem__d';
        dsc.textContent = it.d;
        left.appendChild(dsc);
        var dot = document.createElement('span'); dot.className = 'mitem__dot';
        var price = document.createElement('span');
        price.className = 'mitem__p';
        price.textContent = '₹' + it.p;
        row.appendChild(left); row.appendChild(dot); row.appendChild(price);
        sec.appendChild(row);
      });
      mBody.appendChild(sec);
    });
  };

  var openModal = function () {
    buildMenu();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('is-locked');
    var x = $('.modal__x', modal); if (x) x.focus();
  };
  var closeModal = function () {
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  };
  var mo = $('#menuOpen'); if (mo) mo.addEventListener('click', openModal);
  $$('[data-close]', modal).forEach(function (el) { el.addEventListener('click', closeModal); });

  /* shareable deep link: fortunevista…/#menu opens the menu straight away */
  if (location.hash === '#menu') openModal();
  window.addEventListener('hashchange', function () {
    if (location.hash === '#menu') openModal();
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  var shots = [], idx = 0, lbPrevFocus = null;

  var collect = function () {
    shots = $$('[data-lb]').map(function (el) {
      return { src: el.getAttribute('data-lb'), cap: el.getAttribute('data-cap') || '' };
    });
  };
  var show = function (i) {
    idx = (i + shots.length) % shots.length;
    lbImg.src = shots[idx].src;
    lbImg.alt = shots[idx].cap;
    lbCap.textContent = shots[idx].cap + '  ·  ' + (idx + 1) + ' / ' + shots.length;
  };
  var openLb = function (i) {
    lbPrevFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.classList.add('is-locked');
    $('[data-lbclose]', lb).focus();
  };
  var closeLb = function () {
    lb.hidden = true;
    lbImg.src = '';
    document.body.classList.remove('is-locked');
    if (lbPrevFocus) lbPrevFocus.focus();
  };

  collect();
  $$('[data-lb]').forEach(function (el, i) {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('click', function () { openLb(i); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); }
    });
  });
  $('[data-lbclose]').addEventListener('click', closeLb);
  $('[data-lbprev]').addEventListener('click', function () { show(idx - 1); });
  $('[data-lbnext]').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  /* swipe on the lightbox */
  var sx = 0;
  lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 55) show(dx < 0 ? idx + 1 : idx - 1);
  }, { passive: true });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape')     closeLb();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft')  show(idx - 1);
      return;
    }
    if (!modal.hidden && e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
  });
})();
