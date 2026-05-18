// Panel klienta - interakcje
document.addEventListener('DOMContentLoaded', () => {

  // ── HACKER SCRAMBLE on H1 (cyferki 0-9) ──
  (function() {
    const h1 = document.querySelector('.hero__heading[data-scramble]');
    if (!h1) return;

    let segments;
    try {
      segments = JSON.parse(h1.dataset.scramble);
    } catch (e) {
      return;
    }

    const pool = '0123456789';
    const startDelay = 80;
    const perChar = 10;
    const swapEvery = 14;
    const tailHold = 25;

    const rand = () => pool.charAt(Math.floor(Math.random() * pool.length));

    h1.innerHTML = '';
    const chars = [];
    segments.forEach(seg => {
      for (let i = 0; i < seg.text.length; i++) {
        const c = seg.text.charAt(i);
        const span = document.createElement('span');
        span.className = 'ch ch--scrambling' + (seg.italic ? ' ch--it' : '');
        if (c === ' ') {
          span.innerHTML = '&nbsp;';
        } else {
          span.textContent = rand();
        }
        h1.appendChild(span);
        chars.push({ el: span, char: c, isSpace: c === ' ' });
      }
    });

    setTimeout(() => {
      let revealed = 0;
      const swapTimer = setInterval(() => {
        for (let i = revealed; i < chars.length; i++) {
          if (!chars[i].isSpace) chars[i].el.textContent = rand();
        }
      }, swapEvery);

      const revealTimer = setInterval(() => {
        if (revealed >= chars.length) {
          clearInterval(revealTimer);
          setTimeout(() => {
            clearInterval(swapTimer);
            chars.forEach(c => {
              c.el.classList.remove('ch--scrambling');
              if (c.isSpace) c.el.innerHTML = '&nbsp;';
              else c.el.textContent = c.char;
            });
          }, tailHold);
          return;
        }
        const c = chars[revealed];
        c.el.classList.remove('ch--scrambling');
        if (c.isSpace) c.el.innerHTML = '&nbsp;';
        else c.el.textContent = c.char;
        revealed++;
      }, perChar);
    }, startDelay);
  })();

  // ── Smooth scroll do kotwic ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = id && document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Awatar - placeholder ──
  const avatar = document.querySelector('.navbar__user-avatar');
  if (avatar) {
    avatar.addEventListener('click', () => {
      console.log('open account menu');
    });
  }
});
