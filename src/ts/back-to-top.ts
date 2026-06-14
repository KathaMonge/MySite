let _initialized = false;

export function init(): void {
  if (_initialized) return;
  _initialized = true;

  const btn = document.getElementById('back-to-top')!;

  function toggle(): void {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
