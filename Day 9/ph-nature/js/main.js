/* ==========================================================================
   Isla — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canObserve   = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------------ */
  /* Footer year                                                        */
  /* ------------------------------------------------------------------ */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ */
  /* Header state                                                       */
  /* ------------------------------------------------------------------ */
  var header = $('#siteHeader');

  function syncHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                  */
  /* ------------------------------------------------------------------ */
  var navToggle = $('#navToggle');
  var mobileNav = $('#mobileNav');

  if (navToggle && mobileNav) {
    var lastFocused = null;
    var closeTimer = null;

    var focusables = function () {
      return $$('a[href], button:not([disabled])', mobileNav);
    };

    function openNav() {
      window.clearTimeout(closeTimer);
      lastFocused = document.activeElement;
      mobileNav.hidden = false;
      document.body.classList.add('nav-open');
      navToggle.setAttribute('aria-expanded', 'true');
      var label = $('.visually-hidden', navToggle);
      if (label) label.textContent = 'Close menu';

      requestAnimationFrame(function () {
        mobileNav.classList.add('is-open');
      });

      window.setTimeout(function () {
        var first = focusables()[0];
        if (first) first.focus();
      }, 120);

      document.addEventListener('keydown', onNavKeydown);
    }

    function closeNav(restoreFocus) {
      mobileNav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      var label = $('.visually-hidden', navToggle);
      if (label) label.textContent = 'Open menu';

      document.removeEventListener('keydown', onNavKeydown);

      closeTimer = window.setTimeout(function () {
        mobileNav.hidden = true;
      }, 420);

      if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    function onNavKeydown(event) {
      if (event.key === 'Escape') {
        closeNav(true);
        return;
      }
      if (event.key !== 'Tab') return;

      var items = focusables();
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    navToggle.addEventListener('click', function () {
      if (navToggle.getAttribute('aria-expanded') === 'true') closeNav(true);
      else openNav();
    });

    $$('a', mobileNav).forEach(function (link) {
      link.addEventListener('click', function () {
        window.setTimeout(function () { closeNav(false); }, 60);
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1000 && navToggle.getAttribute('aria-expanded') === 'true') {
        closeNav(false);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll spy — highlight the section you're reading                  */
  /* ------------------------------------------------------------------ */
  var navLinks = $$('.site-nav a');
  var spySections = navLinks.map(function (link) {
    var id = link.getAttribute('href');
    return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
  }).filter(Boolean);

  function syncNav() {
    if (!spySections.length) return;
    var line = window.scrollY + window.innerHeight * 0.35;
    var current = null;

    spySections.forEach(function (section) {
      if (section.offsetTop <= line) current = section;
    });

    navLinks.forEach(function (link) {
      var id = link.getAttribute('href');
      if (current && id === '#' + current.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if (spySections.length) {
    var spyQueued = false;
    window.addEventListener('scroll', function () {
      if (spyQueued) return;
      spyQueued = true;
      requestAnimationFrame(function () {
        syncNav();
        spyQueued = false;
      });
    }, { passive: true });
    syncNav();
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                   */
  /* ------------------------------------------------------------------ */
  var revealEls = $$('[data-reveal]');

  /* Stagger cards and features within their groups. */
  $$('.cards, .features, .gallery__grid').forEach(function (group) {
    $$('[data-reveal]', group).forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', (i * 70) + 'ms');
    });
  });

  if (!revealEls.length) {
    /* nothing to do */
  } else if (!canObserve) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------ */
  /* Count-up stats                                                     */
  /* ------------------------------------------------------------------ */
  var counters = $$('[data-count]');

  function formatCount(n) {
    return n.toLocaleString('en-US');
  }

  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;

    if (reduceMotion.matches) {
      el.textContent = formatCount(target);
      return;
    }

    var duration = 1700;
    var started = null;

    function step(now) {
      if (started === null) started = now;
      var progress = Math.min((now - started) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (counters.length && canObserve) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = formatCount(parseInt(el.getAttribute('data-count'), 10) || 0);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Subtle parallax                                                    */
  /* ------------------------------------------------------------------ */
  var heroImg = $('.hero__media img');
  var band    = $('.band');
  var bandImg = $('.band__media img');
  var parallaxQueued = false;

  function applyParallax() {
    parallaxQueued = false;
    if (reduceMotion.matches) return;

    if (heroImg) {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.4) {
        heroImg.style.transform = 'scale(1.12) translate3d(0,' + (y * 0.05).toFixed(1) + 'px,0)';
      }
    }

    if (band && bandImg) {
      var rect = band.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var offset = ((rect.top + rect.height / 2) - window.innerHeight / 2) / window.innerHeight;
        bandImg.style.transform = 'scale(1.08) translate3d(0,' + (offset * -34).toFixed(1) + 'px,0)';
      }
    }
  }

  if ((heroImg || bandImg) && !reduceMotion.matches) {
    window.addEventListener('scroll', function () {
      if (parallaxQueued) return;
      parallaxQueued = true;
      requestAnimationFrame(applyParallax);
    }, { passive: true });
    applyParallax();
  }

  /* ------------------------------------------------------------------ */
  /* Gallery lightbox                                                   */
  /* ------------------------------------------------------------------ */
  var shots    = $$('.shot');
  var lightbox = $('#lightbox');
  var lbImg    = $('#lightboxImg');
  var lbCaption = $('#lightboxCaption');
  var lbIndex  = 0;
  var lbOpener = null;

  if (shots.length && lightbox && lbImg && lbCaption) {
    var nativeDialog = typeof lightbox.showModal === 'function';

    function paint(index) {
      if (!shots.length) return;
      lbIndex = (index + shots.length) % shots.length;

      var shot = shots[lbIndex];
      var thumb = $('img', shot);
      var full = shot.getAttribute('data-full');

      lbImg.classList.remove('is-loaded');
      lbImg.onload = function () { lbImg.classList.add('is-loaded'); };
      lbImg.src = full;
      lbImg.alt = thumb ? thumb.alt : '';
      lbCaption.textContent = shot.getAttribute('data-caption') || '';
    }

    function openLightbox(index, opener) {
      lbOpener = opener || document.activeElement;
      paint(index);
      document.body.style.overflow = 'hidden';
      if (nativeDialog) lightbox.showModal();
      else lightbox.setAttribute('open', '');
      var closeBtn = $('[data-lb="close"]', lightbox);
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (nativeDialog) lightbox.close();
      else lightbox.removeAttribute('open');
      document.body.style.overflow = '';
      if (lbOpener && typeof lbOpener.focus === 'function') lbOpener.focus();
    }

    shots.forEach(function (shot, i) {
      shot.addEventListener('click', function () { openLightbox(i, shot); });
    });

    lightbox.addEventListener('click', function (event) {
      var action = event.target.closest('[data-lb]');
      if (action) {
        var kind = action.getAttribute('data-lb');
        if (kind === 'close') closeLightbox();
        if (kind === 'prev') paint(lbIndex - 1);
        if (kind === 'next') paint(lbIndex + 1);
        return;
      }
      /* Click on the backdrop (the dialog itself) closes it. */
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); paint(lbIndex + 1); }
      if (event.key === 'ArrowLeft')  { event.preventDefault(); paint(lbIndex - 1); }
    });

    /* Native dialog fires this on Escape and on .close() */
    lightbox.addEventListener('close', function () {
      document.body.style.overflow = '';
      if (lbOpener && typeof lbOpener.focus === 'function') lbOpener.focus();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Trip enquiry form                                                  */
  /* ------------------------------------------------------------------ */
  var tripForm = $('#tripForm');

  if (tripForm) {
    var nameInput  = $('#fieldName');
    var emailInput = $('#fieldEmail');
    var monthInput = $('#fieldMonth');
    var successEl  = $('#formSuccess');

    var validators = [
      {
        input: nameInput, error: $('#errName'),
        check: function (v) { return v.trim().length >= 2 || 'Please tell us your name.'; }
      },
      {
        input: emailInput, error: $('#errEmail'),
        check: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'That email doesn\u2019t look quite right.';
        }
      },
      {
        input: monthInput, error: $('#errMonth'),
        check: function (v) { return v !== '' || 'Pick a rough window — we can flex it.'; }
      }
    ];

    function validate(entry, announce) {
      if (!entry.input) return true;
      var result = entry.check(entry.input.value);
      var ok = result === true;
      var field = entry.input.closest('.field');

      if (field) field.classList.toggle('has-error', !ok);
      entry.input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (entry.error) entry.error.textContent = ok ? '' : (announce ? result : '');
      return ok;
    }

    validators.forEach(function (entry) {
      if (!entry.input) return;
      entry.input.addEventListener('blur', function () { validate(entry, true); });
      entry.input.addEventListener('input', function () {
        if (!entry.error || !entry.error.textContent) return;
        validate(entry, true);
      });
      entry.input.addEventListener('change', function () { validate(entry, true); });
    });

    tripForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = null;
      var allValid = true;

      validators.forEach(function (entry) {
        var ok = validate(entry, true);
        if (!ok && !firstInvalid) firstInvalid = entry.input;
        if (!ok) allValid = false;
      });

      if (!allValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var name = nameInput ? nameInput.value.trim().split(' ')[0] : 'friend';
      tripForm.classList.add('form--sent');

      if (successEl) {
        successEl.hidden = false;
        successEl.textContent = 'Salamat, ' + name + '! Your note is on its way. We\u2019ll reply with a first sketch of an itinerary within two days.';
        successEl.setAttribute('tabindex', '-1');
        successEl.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Newsletter                                                         */
  /* ------------------------------------------------------------------ */
  var newsletter = $('#newsletterForm');
  var newsletterMsg = $('#newsletterMsg');

  if (newsletter && newsletterMsg) {
    newsletter.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = $('input[type="email"]', newsletter);
      var value = input ? input.value.trim() : '';

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        newsletterMsg.textContent = 'A real email, please.';
        if (input) input.focus();
        return;
      }

      newsletterMsg.textContent = 'Salamat — you\u2019re on the list.';
      newsletter.reset();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Image failure fallback                                             */
  /* ------------------------------------------------------------------ */
  $$('img').forEach(function (img) {
    function fail() { img.classList.add('img-failed'); }
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

})();
