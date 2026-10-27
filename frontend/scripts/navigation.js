(() => {
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.site-nav');
  if (!header || !nav) return;

  const button = document.createElement('button');
  button.className = 'nav-menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-label', 'Abrir menu');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'main-navigation');
  button.innerHTML = '<span></span><span></span><span></span>';
  nav.id = 'main-navigation';
  header.insertBefore(button, nav);

  button.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  nav.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link?.classList.contains('nav-cta') && typeof window.sair === 'function') {
      event.preventDefault();
      window.sair(event);
    }
    if (link) {
      header.classList.remove('menu-open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Abrir menu');
    }
  });
})();
