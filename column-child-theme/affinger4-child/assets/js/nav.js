/**
 * Mobile drawer toggle + URL copy share button
 * column.namae-studio.com child theme
 */
(function () {
  'use strict';

  var toggle = document.getElementById('site-header-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('site-nav--open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('is-drawer-open', isOpen);
    });

    // ESC でドロワーを閉じる
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('site-nav--open')) {
        nav.classList.remove('site-nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-drawer-open');
        toggle.focus();
      }
    });

    // リンククリックでドロワーを閉じる（モバイル）
    nav.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link && nav.classList.contains('site-nav--open')) {
        nav.classList.remove('site-nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-drawer-open');
      }
    });
  }

  // URL コピー share ボタン
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-copy-url="true"]');
    if (!target) return;
    event.preventDefault();

    var url = target.getAttribute('href') || window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showCopyFeedback(target);
      }, function () {
        fallbackCopy(url, target);
      });
    } else {
      fallbackCopy(url, target);
    }
  });

  function fallbackCopy(url, target) {
    try {
      var textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showCopyFeedback(target);
    } catch (err) {
      /* noop */
    }
  }

  function showCopyFeedback(target) {
    var original = target.getAttribute('aria-label');
    target.setAttribute('aria-label', 'URL をコピーしました');
    target.style.backgroundColor = 'var(--color-sage)';
    target.style.color = 'var(--color-white)';
    setTimeout(function () {
      target.setAttribute('aria-label', original || 'URL をコピー');
      target.style.backgroundColor = '';
      target.style.color = '';
    }, 1800);
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
