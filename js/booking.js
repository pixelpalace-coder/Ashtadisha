export function initBooking() {
    const stepBtns = document.querySelectorAll('.step-next, .step-prev');
    const stepIndicators = document.querySelectorAll('.b-step');
    let currentStep = 1;

    function goToStep(n) {
        const currentPanel = document.getElementById('bStep' + currentStep);
        const nextPanel = document.getElementById('bStep' + n);
        if (currentPanel) {
            currentPanel.style.opacity = '0';
            setTimeout(() => {
                currentPanel.classList.remove('active');
                if (nextPanel) {
                    nextPanel.classList.add('active');
                    nextPanel.style.opacity = '0';
                    setTimeout(() => { nextPanel.style.transition = 'opacity 0.4s'; nextPanel.style.opacity = '1'; }, 20);
                }
            }, 200);
        }
        currentStep = n;
        stepIndicators.forEach(ind => {
            const s = parseInt(ind.dataset.step);
            ind.classList.remove('active', 'completed');
            if (s === n) ind.classList.add('active');
            else if (s < n) ind.classList.add('completed');
        });
        if (n === 4) populateReview();
    }

    stepBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const next = btn.dataset.next;
            const prev = btn.dataset.prev;
            if (next) goToStep(parseInt(next));
            if (prev) goToStep(parseInt(prev));
        });
    });

    function populateReview() {
        const pkgLabel = { complete: 'The Complete 7 Sisters (₹85,000)', assam_megh: 'Assam + Meghalaya (₹42,000)', arunachal: 'Arunachal Monastery Trek (₹55,000)', hornbill: 'Hornbill Festival Special (₹38,000)', wildlife: 'Wildlife & Safari Circuit (₹62,000)', custom: 'Custom Journey (On request)' };
        const selectedPkg = document.querySelector('input[name="package"]:checked');
        const adults = parseInt(document.getElementById('adultsCount')?.value || 2);
        const children = parseInt(document.getElementById('childrenCount')?.value || 0);
        const price = selectedPkg ? parseInt(selectedPkg.dataset.price || 0) : 0;
        const total = price * adults;
        const formatted = total ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total) : '—';

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('rv-package', selectedPkg ? pkgLabel[selectedPkg.value] || selectedPkg.value : '—');
        set('rv-date', document.getElementById('departDate')?.value || '—');
        set('rv-travelers', `${adults} Adult${adults > 1 ? 's' : ''} + ${children} Child${children === 1 ? '' : 'ren'}`);
        set('rv-accom', document.getElementById('accommodation')?.value || '—');
        set('rv-name', document.getElementById('fullName')?.value || '—');
        set('rv-total', formatted + (total ? ` (10% advance: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total * 0.1)})` : ''));
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const bookingWrapper = document.querySelector('.booking-wrapper');
            const steps = document.getElementById('bookingSteps');
            const stepPanels = document.querySelectorAll('.booking-step-panel');
            const success = document.getElementById('bookingSuccess');
            const ref = document.getElementById('bookingRef');

            stepPanels.forEach(p => p.style.display = 'none');
            if (steps) steps.style.display = 'none';
            if (success) success.style.display = 'flex';
            if (ref) ref.textContent = 'ASHTA-2026-' + Math.floor(1000 + Math.random() * 9000);

            if (typeof anime !== 'undefined') {
                anime({ targets: '.success-icon', scale: [0, 1.2, 1], duration: 800, easing: 'easeOutElastic(1, .6)' });
            }
        });
    }
}
