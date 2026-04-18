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
            if (next) {
                const nextStep = parseInt(next);
                if (!validateStep(currentStep)) return;
                goToStep(nextStep);
            }
            if (prev) goToStep(parseInt(prev));
        });
    });

    function validateStep(step) {
        if (step === 2) {
            const departDate = document.getElementById('departDate')?.value;
            const adults = parseInt(document.getElementById('adultsCount')?.value || 0);
            if (!departDate) {
                alert('Please select a departure date to continue.');
                return false;
            }
            if (!adults || adults < 1) {
                alert('At least one adult traveler is required.');
                return false;
            }
        }

        if (step === 3) {
            const fullName = document.getElementById('fullName')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            if (!fullName || !email || !phone) {
                alert('Please fill your name, email, and phone number.');
                return false;
            }
        }

        return true;
    }

    function populateReview() {
        const pkgLabel = {
            'complete-7-sisters': 'The Complete 7 Sisters (₹89,000)',
            'assam-meghalaya': 'Assam + Meghalaya Escape (₹42,500)',
            'arunachal-deep-dive': 'Arunachal Deep Dive (₹58,500)',
            'hornbill-festival': 'Hornbill Festival Special (₹36,000)',
            'wildlife-circuit': 'Wildlife & Safari Circuit (₹52,000)',
            'sikkim-darjeeling': 'Sikkim & Darjeeling Retreat (₹38,000)',
            'custom': 'Custom Journey (On request)'
        };
        const selectedPkg = document.querySelector('input[name="package"]:checked');
        const adults = parseInt(document.getElementById('adultsCount')?.value || 2);
        const children = parseInt(document.getElementById('childrenCount')?.value || 0);
        const price = selectedPkg ? parseInt(selectedPkg.dataset.price || 0) : 0;
        const base = price * adults;
        const gst = Math.round(base * 0.05);
        const total = base + gst;
        const formatted = total ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total) : '—';

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('rv-package', selectedPkg ? pkgLabel[selectedPkg.value] || selectedPkg.value : '—');
        set('rv-date', document.getElementById('departDate')?.value || '—');
        set('rv-travelers', `${adults} Adult${adults > 1 ? 's' : ''} + ${children} Child${children === 1 ? '' : 'ren'}`);
        set('rv-accom', document.getElementById('accommodation')?.value || '—');
        set('rv-name', document.getElementById('fullName')?.value || '—');
        set('rv-base', base ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(base) : '—');
        set('rv-gst', gst ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(gst) : '—');
        set('rv-total', formatted + (total ? ` (10% advance: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total * 0.1)})` : ''));
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (!validateStep(3)) return;

            const selectedPkg = document.querySelector('input[name="package"]:checked');
            if (!selectedPkg) {
                alert('Please select a package.');
                return;
            }

            const packageCard = selectedPkg.closest('.pkg-card');
            const packageName = packageCard?.querySelector('h4')?.textContent?.trim() || 'Custom Journey';
            const pricePerPerson = parseInt(selectedPkg.dataset.price || '0');
            const adults = parseInt(document.getElementById('adultsCount')?.value || 1);
            const departDate = document.getElementById('departDate')?.value || '';
            const durationMatch = packageCard?.querySelector('.pkg-features li')?.textContent?.match(/\d+\s*Days/i);

            const checkoutData = {
                id: selectedPkg.value,
                title: packageName,
                source: 'PREDEFINED',
                destination: packageCard?.querySelector('.pkg-state-tags')?.textContent?.trim() || 'Northeast India',
                duration: durationMatch ? durationMatch[0] : 'Custom Duration',
                pricePerPerson: pricePerPerson || 25000,
                image: packageCard?.querySelector('img')?.src || '',
                travelDate: departDate,
                travelers: adults
            };

            if (window.AshtaCheckout) {
                window.AshtaCheckout.open(checkoutData);
            } else {
                alert('Checkout is loading. Please try again in a moment.');
            }
        });
    }
}
