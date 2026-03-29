/* mathjax-config.js */
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    tags: 'ams',
    packages: {'[+]': ['ams', 'boldsymbol']},
    macros: {
      bm: ['\\boldsymbol{#1}', 1],
      R:  '\\mathbb{R}',
      E:  '\\mathbb{E}',
      norm: ['\\left\\|#1\\right\\|', 1],
    }
  },
  options: {
    skipHtmlTags: ['script','noscript','style','textarea','pre','code'],
  },
  startup: {
    ready() {
      MathJax.startup.defaultReady();
    }
  }
};
