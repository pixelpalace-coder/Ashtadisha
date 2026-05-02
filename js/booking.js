export function initBooking() {
  const form = document.getElementById("bookingForm");
  const packageInput = document.getElementById("bookingPackageId");
  const status = document.getElementById("bookingStatus");
  const summaryTrip = document.getElementById("summaryTrip");
  const summaryTravelers = document.getElementById("summaryTravelers");
  const summaryPerPerson = document.getElementById("summaryPerPerson");
  const summaryBaseFare = document.getElementById("summaryBaseFare");
  const summaryTaxes = document.getElementById("summaryTaxes");
  const summaryTotal = document.getElementById("summaryTotal");
  const travelersInput = document.getElementById("bookingTravelers");
  const totalInput = document.getElementById("bookingTotalPrice");
  const submitBtn = document.getElementById("bookingSubmitBtn");

  if (!form) return;

  function stripePublishableConfigured() {
    const k = window.AshtaConfig?.stripePublishableKey;
    return typeof k === "string" && k.length > 0 && !k.includes("REPLACE_STRIPE");
  }

  const pageUrl = new URL(window.location.href);
  const aiPlanParam = pageUrl.searchParams.get("aiPlanId");
  if (aiPlanParam) {
    const aiInput = document.getElementById("bookingAIPlanId");
    if (aiInput) aiInput.value = aiPlanParam;
    if (summaryTrip) summaryTrip.textContent = "AI custom plan (from planner)";
    
    // Explicitly scroll to the booking section since the native #hash fails
    // because the booking HTML is injected dynamically after page load.
    setTimeout(() => {
      const bookingSection = document.getElementById("booking");
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300); // Slight delay ensures layout has settled
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-package]");
    if (!button) return;
    const packageId = button.getAttribute("data-book-package");
    const packageTitle = button.getAttribute("data-package-title");
    const packagePrice = Number(button.getAttribute("data-package-price") || 0);
    if (packageInput) packageInput.value = packageId;
    if (summaryTrip) summaryTrip.textContent = packageTitle || packageId || "Selected package";
    if (totalInput && packagePrice > 0) {
      const travelers = Number(travelersInput?.value || 1);
      totalInput.value = String(packagePrice * travelers);
    }
    refreshSummary();
    const bookingSection = document.getElementById("booking");
    bookingSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.setAttribute("aria-busy", isSubmitting ? "true" : "false");
  }

  function refreshSummary() {
    const travelers = Number(travelersInput?.value || 1);
    const baseFare = Number(totalInput?.value || 0);
    const taxesAndFees = Math.round(baseFare * 0.05);
    const grandTotal = baseFare + taxesAndFees;
    const perPerson = travelers > 0 ? grandTotal / travelers : grandTotal;
    if (summaryTravelers) summaryTravelers.textContent = String(travelers);
    if (summaryPerPerson) summaryPerPerson.textContent = `INR ${Math.round(perPerson).toLocaleString("en-IN")}`;
    if (summaryBaseFare) summaryBaseFare.textContent = `INR ${Math.round(baseFare).toLocaleString("en-IN")}`;
    if (summaryTaxes) summaryTaxes.textContent = `INR ${Math.round(taxesAndFees).toLocaleString("en-IN")}`;
    if (summaryTotal) summaryTotal.textContent = `INR ${Math.round(grandTotal).toLocaleString("en-IN")}`;
  }

  travelersInput?.addEventListener("input", refreshSummary);
  totalInput?.addEventListener("input", refreshSummary);
  refreshSummary();

    let currentPayload = null;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (status) status.textContent = "";

      const user = window.firebase?.auth()?.currentUser;
      if (!user) {
        window.AshtaAuth?.openAuthModal("signin");
        if (status) status.textContent = "Please sign in to continue booking.";
        return;
      }

      const travelers = Number(document.getElementById("bookingTravelers")?.value || 1);
      const baseFare = Number(document.getElementById("bookingTotalPrice")?.value || 0);
      const totalPrice = baseFare + Math.round(baseFare * 0.05);
      
      currentPayload = {
        packageId: packageInput?.value || null,
        aiPlanId: document.getElementById("bookingAIPlanId")?.value || null,
        name: document.getElementById("bookingName")?.value?.trim(),
        email: document.getElementById("bookingEmail")?.value?.trim(),
        phone: document.getElementById("bookingPhone")?.value?.trim(),
        travelers,
        travelDate: document.getElementById("bookingTravelDate")?.value,
        totalPrice,
      };

      // Open the mock payment modal instead of Stripe
      const modal = document.getElementById("mockPaymentModal");
      const totalDisplay = document.getElementById("mockPaymentTotalDisplay");
      if (modal) {
        if (totalDisplay) totalDisplay.textContent = `INR ${totalPrice.toLocaleString("en-IN")}`;
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    });

    // Mock Payment Modal Logic
    const mockModal = document.getElementById("mockPaymentModal");
    const mockClose = document.getElementById("mockPaymentClose");
    const mockForm = document.getElementById("mockPaymentForm");
    const mockStatus = document.getElementById("mockPaymentStatusText");
    const mockPayBtn = document.getElementById("mockPaymentPayBtn");

    function closeMockModal() {
      if (mockModal) mockModal.classList.remove("active");
      document.body.style.overflow = "";
      if (mockStatus) mockStatus.textContent = "";
      if (mockPayBtn) mockPayBtn.disabled = false;
    }

    if (mockClose) mockClose.addEventListener("click", closeMockModal);
    if (mockModal) mockModal.addEventListener("click", (e) => {
      if (e.target === mockModal) closeMockModal();
    });

    if (mockForm) {
      mockForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentPayload) return;

        mockPayBtn.disabled = true;
        mockStatus.textContent = "Processing payment securely...";

        try {
          const bookingResult = await window.AshtaFirebase.createBooking(currentPayload);
          mockStatus.innerHTML = `✅ Payment Successful!<br/>Trip ID: ${bookingResult.bookingId}. Redirecting...`;
          
          setTimeout(() => {
            closeMockModal();
            window.location.href = "/dashboard.html#trips";
          }, 2000);
          
        } catch (error) {
          console.error(error);
          mockStatus.textContent = "Error: " + (error.message || "Payment failed");
          mockPayBtn.disabled = false;
        }
      });
    }
}
