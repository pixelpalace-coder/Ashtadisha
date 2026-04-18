/**
 * Renders Popular Packages from data/packages.js and wires Book Now → AshtaCheckout.
 */
export function initPopularPackages(options = {}) {
  const gridId = options.gridId || 'popularPackagesGrid';
  const grid = document.getElementById(gridId);
  const list = window.AshtaPredefinedPackages;

  if (!grid || !Array.isArray(list) || list.length === 0) {
    return;
  }

  const fmt = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  grid.innerHTML = '';
  const frag = document.createDocumentFragment();

  list.forEach((pkg) => {
    if (!pkg || !pkg.id) return;

    const article = document.createElement('article');
    article.className = 'pp-card';
    article.setAttribute('data-package-id', pkg.id);

    article.innerHTML = `
      <div class="pp-card-media">
        <img src="${escapeAttr(pkg.image)}" alt="${escapeAttr(pkg.title)}" loading="lazy" width="800" height="500">
        <span class="pp-card-badge">PREDEFINED</span>
      </div>
      <div class="pp-card-body">
        <h3 class="pp-card-title">${escapeHtml(pkg.title)}</h3>
        <p class="pp-card-meta">${escapeHtml(pkg.duration)} · ${escapeHtml(pkg.destination || '')}</p>
        <p class="pp-card-desc">${escapeHtml(pkg.description || '')}</p>
        <div class="pp-card-footer">
          <span class="pp-card-price">${fmt.format(Number(pkg.price) || 0)} <small style="font-size:0.65em;font-weight:500;opacity:0.85">/ person</small></span>
          <button type="button" class="pp-card-btn" data-book-package="${escapeAttr(pkg.id)}">Book Now</button>
        </div>
      </div>
    `;

    frag.appendChild(article);
  });

  grid.appendChild(frag);

  grid.querySelectorAll('[data-book-package]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-book-package');
      const pkg = list.find((p) => p && p.id === id);
      if (!pkg) return;

      if (!window.AshtaCheckout || typeof window.AshtaCheckout.open !== 'function') {
        alert('Checkout is still loading. Please try again in a moment.');
        return;
      }

      window.AshtaCheckout.open({
        id: pkg.id,
        title: pkg.title,
        price: pkg.price,
        duration: pkg.duration,
        description: pkg.description,
        image: pkg.image,
        destination: pkg.destination,
        source: 'PREDEFINED'
      });
    });
  });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (str == null) return '';
  return String(str).replace(/"/g, '&quot;');
}
