/* ==========================================================================
   split-text.js — [data-split-text] 要素のテキストを 1 文字ずつ <span> に
   分解し、CSS 変数 --i で順番にアニメ遅延を与える。
   <br> など要素ノードは温存。reduced-motion 時はアニメ無効化。
   ========================================================================== */
(function () {
  'use strict';

  function splitOne(el) {
    var index = 0;
    var children = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    children.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.textContent;
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (ch === ' ' || ch === '　') {
            el.appendChild(document.createTextNode(ch));
            continue;
          }
          var span = document.createElement('span');
          span.className = 'split-char';
          span.style.setProperty('--i', index);
          span.textContent = ch;
          el.appendChild(span);
          index++;
        }
      } else {
        el.appendChild(node);
      }
    });
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.classList.add(reduced ? 'split-text--reduced' : 'split-text--ready');
  }

  function init() {
    var targets = document.querySelectorAll('[data-split-text]');
    Array.prototype.forEach.call(targets, splitOne);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
