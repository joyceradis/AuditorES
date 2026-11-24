function anchorTarget(hash) {
  if (!hash) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

export function initMunicipalNavigation({ tabForHash, onNavigate } = {}) {
  const sections = [...document.querySelectorAll('.atlas-nav [data-tab]')]
    .map(link => ({ link, panel: document.getElementById('screen-' + link.dataset.tab) }))
    .filter(({ panel }) => panel);
  if (!sections.length) return () => {};

  function show({ moveFocus = false, previousHash = null } = {}) {
    const { hash } = window.location;
    const target = anchorTarget(hash);
    const override = tabForHash?.(hash);
    const current = sections.find(({ link, panel }) =>
      override ? link.dataset.tab === override : target && panel.contains(target)
    ) || sections[0];

    for (const section of sections) {
      const active = section === current;
      section.panel.hidden = !active;
      if (active) section.link.setAttribute('aria-current', 'location');
      else section.link.removeAttribute('aria-current');
    }

    if (onNavigate?.({ hash, previousHash, panel: current.panel })) return;

    const destination = target && current.panel.contains(target) ? target : null;
    if (!destination) return;

    if (moveFocus) {
      const heading = destination.matches('h2, h3') ? destination
        : destination.querySelector('h2, h3') || current.panel.querySelector('h2, h3');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }

    const start = destination.id === 'visao-geral' ? current.panel : destination;
    start.scrollIntoView({ block: 'start' });
  }

  window.addEventListener('hashchange', event => show({
    moveFocus: true,
    previousHash: new URL(event.oldURL).hash
  }));
  show();
  return show;
}
