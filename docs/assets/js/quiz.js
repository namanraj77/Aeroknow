/* quiz.js — Open-ended reflection prompt engine */

(function () {
  'use strict';

  /**
   * Renders all .reflection-box elements with an expandable
   * text area and optional "show guidance" toggle.
   */
  function initReflectionBoxes() {
    document.querySelectorAll('.reflection-box').forEach(box => {
      const guidance = box.getAttribute('data-guidance');

      // Add textarea for each reflection
      const ta = document.createElement('textarea');
      ta.placeholder = 'Write your reflection here… (not submitted, local only)';
      ta.style.cssText = `
        width: 100%;
        min-height: 100px;
        margin-top: 1rem;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(0,212,255,0.2);
        color: #e0f4ff;
        font-family: 'Rajdhani', sans-serif;
        font-size: 0.95rem;
        padding: 0.75rem;
        resize: vertical;
        outline: none;
        line-height: 1.6;
      `;
      ta.addEventListener('focus', () => {
        ta.style.borderColor = 'rgba(0,212,255,0.5)';
      });
      ta.addEventListener('blur', () => {
        ta.style.borderColor = 'rgba(0,212,255,0.2)';
      });
      box.appendChild(ta);

      // Guidance toggle
      if (guidance) {
        const btn = document.createElement('button');
        btn.textContent = '▸ Show Guidance';
        btn.style.cssText = `
          margin-top: 0.75rem;
          background: transparent;
          border: 1px solid rgba(255,183,0,0.3);
          color: #ffb700;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        `;
        const guidanceDiv = document.createElement('div');
        guidanceDiv.style.cssText = `
          display: none;
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255,183,0,0.04);
          border-left: 2px solid #ffb700;
          font-size: 0.9rem;
          color: #c9a400;
          line-height: 1.6;
        `;
        guidanceDiv.innerHTML = guidance;

        btn.addEventListener('click', () => {
          const open = guidanceDiv.style.display === 'block';
          guidanceDiv.style.display = open ? 'none' : 'block';
          btn.textContent = open ? '▸ Show Guidance' : '▾ Hide Guidance';
        });

        box.appendChild(btn);
        box.appendChild(guidanceDiv);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initReflectionBoxes);
})();
