export function init(): void {
  const nav = document.getElementById('site-nav');
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-overlay');
  const drawerClose = document.getElementById('nav-drawer-close');

  if (!nav || !burger || !drawer || !overlay) return;

  // ── Scroll visibility (hidden while hero is on screen) ──
  let rafId: number | undefined;
  const updateNavVisibility = () => {
    nav.classList.toggle('nav-visible', window.scrollY > 120);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (rafId !== undefined) return;
      rafId = requestAnimationFrame(() => {
        rafId = undefined;
        updateNavVisibility();
      });
    },
    { passive: true },
  );

  // ── Drawer open / close ──
  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('open');
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  drawerClose?.addEventListener('click', closeDrawer);

  drawer.querySelectorAll('.vitra-drawer-link').forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // ── Scroll-spy: highlight active section ──
  const navSections: { id: string; links: NodeListOf<Element> }[] = [
    'about',
    'skills',
    'trello',
    'projects',
    'scope-section',
    'snake-section',
  ]
    .filter((id) => document.getElementById(id))
    .map((id) => ({
      id,
      links: document.querySelectorAll(`[data-nav="${id}"]`),
    }));

  const updateActive = () => {
    let currentId = '';
    for (const { id } of navSections) {
      const el = document.getElementById(id)!;
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.55) {
        currentId = id;
      }
    }
    navSections.forEach(({ id, links }) => {
      links.forEach((l) => l.classList.toggle('active', id === currentId));
    });
  };

  window.addEventListener('scroll', updateActive, { passive: true });
}
