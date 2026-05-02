function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function safeImgSrc(url) {
  const u = String(url || "").trim();
  if (!u || /^javascript:/i.test(u) || u.startsWith("data:text/html")) return "";
  return escapeAttr(u);
}

export async function initPopularPackages() {
  const grid = document.getElementById("popularPackagesGrid");
  if (!grid) return;
  if (!window.AshtaFirebase) {
    setTimeout(initPopularPackages, 300);
    return;
  }

  try {
    const packageMap = await window.AshtaFirebase.getPackages();
    const packages = Object.values(packageMap || {});
    if (!packages.length) {
      grid.innerHTML = "<p>No packages available right now.</p>";
      return;
    }

    grid.innerHTML = packages
      .map((pkg) => {
        const title = escapeHtml(pkg.title || pkg.name || "Package");
        const metaDur = escapeHtml(pkg.duration || "Custom duration");
        const metaDest = escapeHtml(pkg.destination || "Seven Sisters");
        const desc = escapeHtml(pkg.description || "Curated package across Northeast India.");
        const idAttr = escapeAttr(pkg.id || "");
        const titleAttr = escapeAttr(pkg.title || pkg.name || "");
        const priceNum = Number(pkg.price || pkg.pricePerPerson || 0);
        const imgUrl = safeImgSrc(pkg.image);
        const imgTag = imgUrl
          ? `<img src="${imgUrl}" alt="${titleAttr}" loading="lazy" />`
          : `<div class="pp-card-media pp-card-media--placeholder" role="img" aria-label="${titleAttr}"></div>`;

        return `
        <article class="pp-card">
          <div class="pp-card-media">
            ${imgTag}
            <span class="pp-card-badge">Popular</span>
          </div>
          <div class="pp-card-body">
            <h3 class="pp-card-title">${title}</h3>
            <p class="pp-card-meta">${metaDur} • ${metaDest}</p>
            <p class="pp-card-desc">${desc}</p>
            <div class="pp-card-footer">
              <strong class="pp-card-price">INR ${priceNum.toLocaleString("en-IN")}<span>/person</span></strong>
              <button type="button" class="pp-card-btn" data-book-package="${idAttr}" data-package-title="${titleAttr}" data-package-price="${priceNum}">Book Now</button>
            </div>
          </div>
        </article>
      `;
      })
      .join("");
  } catch (error) {
    grid.innerHTML = "<p>Failed to load packages. Please refresh.</p>";
    console.error(error);
  }
}
