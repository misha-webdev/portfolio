/* MISHA BAILOV. — портфолио
   Появление при прокрутке, живая сфера, бегущая строка, мобильное меню,
   состояние шапки, год в подвале.
   Ещё не задействованы: data-split, data-magnetic, data-parallax. */

const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)');

function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (!('IntersectionObserver' in window) || !motionOK.matches) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry, index) => {
        // Элементы, появившиеся одновременно, выходят по очереди
        entry.target.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 90}ms`);
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -8% 0px' });

  items.forEach((el) => observer.observe(el));
}

function initHero() {
  const orb = document.querySelector('[data-hero-visual]');
  const hero = orb?.closest('.hero');
  if (!hero) return;

  // Анимации главного экрана не тратят ресурсы, пока он вне видимости
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      hero.classList.toggle('is-paused', !entry.isIntersecting);
    }).observe(hero);
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches || !motionOK.matches) return;

  // Сфера плавно догоняет курсор: --mx и --my от -1 до 1
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let frame = 0;

  const tick = () => {
    x += (targetX - x) * 0.06;
    y += (targetY - y) * 0.06;
    orb.style.setProperty('--mx', x.toFixed(3));
    orb.style.setProperty('--my', y.toFixed(3));
    const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.002;
    frame = settled ? 0 : requestAnimationFrame(tick);
  };

  const moveTo = (nextX, nextY) => {
    targetX = nextX;
    targetY = nextY;
    if (!frame) frame = requestAnimationFrame(tick);
  };

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    moveTo(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  });

  hero.addEventListener('pointerleave', () => moveTo(0, 0));
}

function initMarquee() {
  const marquee = document.querySelector('[data-marquee]');
  const track = marquee?.querySelector('.marquee__track');
  if (!track) return;

  // Лента сдвигается на половину своей ширины, поэтому половина должна
  // быть шире экрана — на широких мониторах содержимое удваивается
  for (let i = 0; i < 3 && track.offsetWidth / 2 < window.innerWidth; i++) {
    track.append(...[...track.children].map((node) => node.cloneNode(true)));
  }

  // Постоянная скорость ~45 px/с при любой длине ленты
  track.style.setProperty('--marquee-duration', `${Math.round(track.offsetWidth / 2 / 45)}s`);
  marquee.classList.add('is-ready');
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMenu() {
  const header = document.querySelector('[data-header]');
  const burger = document.querySelector('[data-burger]');
  const nav = document.querySelector('[data-nav]');
  if (!header || !burger || !nav) return;

  const desktop = window.matchMedia('(min-width: 901px)');
  const isOpen = () => header.classList.contains('is-open');

  const setOpen = (open, { restoreFocus = true } = {}) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.documentElement.classList.toggle('is-locked', open);

    if (open) nav.querySelector('a')?.focus();
    else if (restoreFocus) burger.focus();
  };

  burger.addEventListener('click', () => setOpen(!isOpen()));

  nav.addEventListener('click', (event) => {
    if (isOpen() && event.target.closest('a')) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    // Фокус не уходит за пределы открытого меню
    if (event.key === 'Tab') {
      const focusable = [...header.querySelectorAll('a[href], button')]
        .filter((el) => el.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches && isOpen()) setOpen(false, { restoreFocus: false });
  });
}

function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = year;
  });
}

// Появление — первым: без него контент с data-reveal остался бы скрытым
initReveal();
initHeader();
initMenu();
initYear();
initHero();

// Ширину ленты измеряем после загрузки шрифтов
(document.fonts ? document.fonts.ready : Promise.resolve()).then(initMarquee);
