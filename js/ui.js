/* ============================================================================
   ui.js  —  small "polish" layer (added for the professional / Apple-style look)

   PLAIN ENGLISH:
   This file does two gentle visual things. It has NO effect on the maths.
     1) "Scroll reveal" — cards and headings fade and slide up softly the first
        time they scroll into view (like the Apple product pages).
     2) "Active nav" — the menu link for the section you're currently looking at
        gets highlighted as you scroll.
   It uses the browser's built-in IntersectionObserver (a tool that tells us when
   an element enters the screen). No external libraries. If the visitor prefers
   reduced motion, everything just appears instantly with no animation.
   ========================================================================== */
(function () {
  'use strict';

  // Check if the user prefers reduced motion (for accessibility)
  // This respects system settings from people who have motion sensitivity
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ready runs a function once the DOM is fully loaded
  function ready(fn) {
    // If DOM is already loaded, run immediately
    if (document.readyState !== 'loading') fn();
    // Otherwise wait for DOMContentLoaded
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---- 1) Scroll reveal ----- Cards and headings fade in as you scroll down */
    // Pick all the elements we want to animate
    var selector = '.sec-head, .solver, .panel, .hl-card, .scan-card, .scan-side, .learn-card, .team-card, .member';
    var items = Array.prototype.slice.call(document.querySelectorAll(selector));
    // Add "reveal" class to all of them so CSS can hide them initially
    items.forEach(function (el) { el.classList.add('reveal'); });

    if (reduce || !('IntersectionObserver' in window)) {
      // If user prefers no motion or browser is too old, just show everything immediately
      items.forEach(function (el) { el.classList.add('in'); });
    } else {
      // Use IntersectionObserver to watch when elements enter the viewport
      var io = new IntersectionObserver(function (entries) {
        // When an element enters the screen
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            // Add "in" class to trigger the fade-up animation
            e.target.classList.add('in');
            // Stop observing this element (animation only happens once)
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      // Add a stagger effect: each group of 4 cards animates in sequence
      items.forEach(function (el, i) {
        el.style.setProperty('--rd', (i % 4) * 60 + 'ms');  // Set animation delay via CSS variable
        io.observe(el);  // Start watching this element
      });
    }

    /* ---- 1b) Top bar lift ----- the bar gains a shadow + solidifies once the
       page is scrolled, so it "floats" above the content (Apple-style). */
    var bar = document.querySelector('.topbar');
    if (bar) {
      var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 8); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---- 2) Active nav link ----- Highlight which section you're currently viewing */
    // Get all nav links that point to sections
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    // Create a map connecting each link to its corresponding section
    var map = {};
    links.forEach(function (a) {
      // Extract the section ID from the link's href
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      // Store the link and section together
      if (sec) map[id] = { a: a, s: sec };
    });
    var ids = Object.keys(map);

    // Watch which section is in the middle of the screen
    if (ids.length && 'IntersectionObserver' in window) {
      var nav = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            // When a section is visible, highlight its corresponding nav link
            ids.forEach(function (id) {
              // Add "active" class only to the link for the current section
              map[id].a.classList.toggle('active', id === e.target.id);
            });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });  // Watch for sections in the middle of screen
      // Start watching each section
      ids.forEach(function (id) { nav.observe(map[id].s); });
    }
  });
})();
