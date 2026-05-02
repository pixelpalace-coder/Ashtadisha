(function () {
  "use strict";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadingSkeleton() {
    return `
      <div class="planner-loading" aria-busy="true">
        <div class="planner-loading__shine"></div>
        <p class="planner-loading__title">Sketching your Northeast route…</p>
        <div class="planner-skel planner-skel--title"></div>
        <div class="planner-skel planner-skel--line"></div>
        <div class="planner-skel planner-skel--line short"></div>
        <div class="planner-skel-grid">
          <div class="planner-skel planner-skel--card"></div>
          <div class="planner-skel planner-skel--card"></div>
          <div class="planner-skel planner-skel--card"></div>
        </div>
      </div>`;
  }

  function renderPlan(plan) {
    const days = Array.isArray(plan?.itinerary) ? plan.itinerary : [];
    const suggested = Array.isArray(plan?.suggestedPlaces) ? plan.suggestedPlaces : [];
    const highlights = Array.isArray(plan?.highlights) ? plan.highlights : [];
    const tips = Array.isArray(plan?.travelTips) ? plan.travelTips : [];

    const placesHtml = suggested
      .slice(0, 12)
      .map((p) => `<span class="planner-tag">${escapeHtml(p)}</span>`)
      .join("");

    const highlightsHtml = highlights
      .map((h) => `<li>${escapeHtml(h)}</li>`)
      .join("");

    const tipsHtml = tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("");

    const dayHtml = days
      .map((d) => {
        const slots = [];
        if (d.morning) slots.push(`<span><em>Morning</em> ${escapeHtml(d.morning)}</span>`);
        if (d.afternoon) slots.push(`<span><em>Afternoon</em> ${escapeHtml(d.afternoon)}</span>`);
        if (d.evening) slots.push(`<span><em>Evening</em> ${escapeHtml(d.evening)}</span>`);
        const slotsHtml =
          slots.length > 0 ? `<div class="planner-day__slots">${slots.join("")}</div>` : "";

        return `
        <article class="planner-day">
          <div class="planner-day__dot"></div>
          <div class="planner-day__body">
            <div class="planner-day__head">
              <h4>Day ${escapeHtml(d.day)} · ${escapeHtml(d.title || "On the road")}</h4>
              <span class="planner-day__cost">~ INR ${Number(d.estimatedCost || 0).toLocaleString("en-IN")}</span>
            </div>
            <p class="planner-day__desc">${escapeHtml(d.description || "")}</p>
            ${slotsHtml}
          </div>
        </article>`;
      })
      .join("");

    return `
      <div class="planner-result">
        <div class="planner-result__hero">
          <div>
            <p class="planner-result__eyebrow">Your generated plan</p>
            <h3>${escapeHtml(plan.title || "AI Trip Plan")}</h3>
            <p class="planner-result__cost">
              Estimated total · <strong>INR ${Number(plan.estimatedTotalCost || 0).toLocaleString("en-IN")}</strong>
              <span class="planner-result__hint">Use this figure as base fare on the booking form (taxes added at checkout).</span>
            </p>
          </div>
          <button type="button" class="btn btn-outline planner-copy-btn" id="plannerCopyJson">Copy plan JSON</button>
        </div>

        ${
          highlightsHtml
            ? `<section class="planner-panel"><h4>Highlights</h4><ul class="planner-bullet">${highlightsHtml}</ul></section>`
            : ""
        }

        ${
          placesHtml
            ? `<section class="planner-panel"><h4>Suggested places</h4><div class="planner-tags">${placesHtml}</div></section>`
            : ""
        }

        ${
          tipsHtml
            ? `<section class="planner-panel planner-panel--tips"><h4>Permits, weather &amp; travel tips</h4><ul class="planner-bullet">${tipsHtml}</ul></section>`
            : ""
        }

        <section class="planner-panel"><h4>Daily timeline</h4><div class="planner-timeline">${dayHtml || "<p>No itinerary rows returned.</p>"}</div></section>
      </div>
    `;
  }

  async function bootstrapPlanner() {
    const form = document.getElementById("plannerForm");
    const output = document.getElementById("plannerOutput");
    const saveBtn = document.getElementById("savePlanBtn");
    const bookBtn = document.getElementById("bookPlanBtn");
    let latestPlanId = null;
    let latestPlanPayload = null;

    document.querySelectorAll(".planner-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const budget = chip.getAttribute("data-budget");
        const days = chip.getAttribute("data-days");
        const budgetInput = document.getElementById("planBudget");
        const durationInput = document.getElementById("planDuration");
        if (budgetInput && budget) budgetInput.value = budget;
        if (durationInput && days) durationInput.value = days;
      });
    });

    if (!form || !output) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = window.firebase?.auth()?.currentUser;
      if (!user) {
        window.AshtaAuth?.openAuthModal("signin");
        return;
      }

      const payload = {
        destination: document.getElementById("planDestination").value,
        budget: Number(document.getElementById("planBudget").value || 0),
        duration: Number(document.getElementById("planDuration").value || 0),
        preferences: Array.from(document.querySelectorAll('input[name="preference"]:checked')).map((n) => n.value),
      };

      output.innerHTML = loadingSkeleton();

      try {
        const result = await window.AshtaFirebase.generateAIPlan(payload);
        latestPlanId = result.planId;
        latestPlanPayload = result.plan;
        output.innerHTML = renderPlan(result.plan);
        saveBtn.disabled = false;
        bookBtn.disabled = false;

        const copyBtn = document.getElementById("plannerCopyJson");
        copyBtn?.addEventListener("click", async () => {
          const text = JSON.stringify(latestPlanPayload || {}, null, 2);
          try {
            await navigator.clipboard.writeText(text);
            copyBtn.textContent = "Copied!";
            setTimeout(() => {
              copyBtn.textContent = "Copy plan JSON";
            }, 2000);
          } catch {
            copyBtn.textContent = "Copy failed";
          }
        });
      } catch (error) {
        console.error(error);
        output.innerHTML =
          '<div class="planner-error"><p><strong>Could not generate a plan.</strong></p><p>Check that Firebase Functions and OpenAI keys are deployed, then try again.</p></div>';
      }
    });

    saveBtn?.addEventListener("click", () => {
      if (!latestPlanId) return;
      alert("Your plan is stored under My Trips → AI plans once generation succeeds.");
    });

    bookBtn?.addEventListener("click", () => {
      if (!latestPlanId) return;
      window.location.href = `/?aiPlanId=${encodeURIComponent(latestPlanId)}#booking`;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapPlanner);
  } else {
    bootstrapPlanner();
  }
})();
