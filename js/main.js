import { ComponentLoader } from './componentLoader.js';
import { initAnimations } from './animations.js';
import { initUI } from './ui.js';
import { initBooking } from './booking.js';
import { initPopularPackages } from './popular-packages.js';

/**
 * Main Application Entrance
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 0. Protocol Check: Modular code requires a server!
    if (window.location.protocol === 'file:') {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;inset:0;background:#1a1a1a;color:white;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;font-family:sans-serif;';
        errorDiv.innerHTML = `
            <h1 style="color:#ff4d4d">Error: Local Server Required</h1>
            <p style="font-size:18px;margin:15px 0">Modular websites cannot be opened directly by double-clicking index.html.</p>
            <div style="background:#333;padding:15px;border-radius:8px;text-align:left;max-width:500px">
                <p><strong>To run the website:</strong></p>
                <ol style="line-height:1.6">
                    <li>Go to your folder: <code>7 sisters</code></li>
                    <li>Double-click <b>run_website.bat</b></li>
                    <li>The website will open automatically at <code>http://localhost:8000</code></li>
                </ol>
            </div>
            <p style="margin-top:20px;opacity:0.7">This is a security restriction in modern browsers for modular files.</p>
        `;
        document.body.appendChild(errorDiv);
        return;
    }

    // 1. Initialize Loader
    const loader = new ComponentLoader();
    
    // 2. Load Components into the DOM
    await loader.loadAll();

    const checkoutMount = document.getElementById('checkoutMount');
    if (checkoutMount) {
        try {
            const res = await fetch('components/checkout.html');
            if (res.ok) checkoutMount.innerHTML = await res.text();
        } catch (e) {
            console.error('[main] Checkout inject failed', e);
        }
    }

    // Do not bulk-preload every image — that caused long freezes and scroll jank.
    // Hero/above-fold assets stay in HTML; other images use lazy loading in markup where possible.

    // 3. Initialize App Logic after components are injected
    initAnimations();
    initUI();
    initBooking();
    initPopularPackages();
});
