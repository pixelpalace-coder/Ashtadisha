/* ============================================================
   ASHTADISHA — Clerk Authentication
   js/auth.js

   Uses Clerk JS SDK loaded via CDN (window.Clerk).
   Exposes window.AshtaAuth for use by other modules.

   ⚠️  REPLACE pk_test_XXXXXXXXXXXXXXXX with your real key from:
   https://dashboard.clerk.com
   ============================================================ */

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────
  // ⚠️  Replace with your real Clerk Publishable Key
  const CLERK_PUBLISHABLE_KEY = 'pk_test_ZGFybGluZy10YWRwb2xlLTk4LmNsZXJrLmFjY291bnRzLmRldiQ';

  // ── State ─────────────────────────────────────────────────
  let clerkInstance = null;
  let currentMode   = 'signin'; // 'signin' | 'signup'

  // ── DOM References (resolved after DOMContentLoaded) ──────
  let overlay, authCard, tabSignIn, tabSignUp,
      signInMount, signUpMount,
      closeBtn, authPre, authPost,
      userAvatarEl, userNameEl, dropdownMenu, userChip;

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    if (!window.Clerk) {
      console.warn('[AshtaAuth] Clerk SDK not available.');
      return;
    }

    resolveDOM();

    try {
      await window.Clerk.load({
        publishableKey: CLERK_PUBLISHABLE_KEY,
      });
      clerkInstance = window.Clerk;
      console.log('[AshtaAuth] Clerk loaded ✓');

      // Restore session if user is already signed in
      if (clerkInstance.user) {
        onSignedIn(clerkInstance.user);
      }

      // Listen for auth state changes
      clerkInstance.addListener(({ user }) => {
        if (user) {
          onSignedIn(user);
        } else {
          onSignedOut();
        }
      });

    } catch (e) {
      console.error('[AshtaAuth] Clerk load error:', e);
    }

    bindEvents();
  }

  // ── Resolve DOM elements ──────────────────────────────────
  function resolveDOM() {
    overlay      = document.getElementById('authOverlay');
    authCard     = document.getElementById('authCard');
    tabSignIn    = document.getElementById('authTabSignIn');
    tabSignUp    = document.getElementById('authTabSignUp');
    signInMount  = document.getElementById('clerk-signin-mount');
    signUpMount  = document.getElementById('clerk-signup-mount');
    closeBtn     = document.getElementById('authClose');
    authPre      = document.getElementById('navAuthPre');
    authPost     = document.getElementById('navAuthPost');
    userAvatarEl = document.getElementById('navUserAvatar');
    userNameEl   = document.getElementById('navUserName');
    dropdownMenu = document.getElementById('navUserDropdown');
    userChip     = document.getElementById('navUserChip');
  }

  // ── Bind UI events ────────────────────────────────────────
  function bindEvents() {
    // Close button
    closeBtn?.addEventListener('click', closeAuthModal);

    // Click outside card = close
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });

    // Tab switcher
    tabSignIn?.addEventListener('click', () => switchTab('signin'));
    tabSignUp?.addEventListener('click', () => switchTab('signup'));

    // Social buttons (Clerk handles the redirect)
    document.getElementById('authGoogleBtn')?.addEventListener('click', () => {
      clerkInstance?.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.href,
        redirectUrlComplete: window.location.href,
      });
    });

    document.getElementById('authFacebookBtn')?.addEventListener('click', () => {
      clerkInstance?.authenticateWithRedirect({
        strategy: 'oauth_facebook',
        redirectUrl: window.location.href,
        redirectUrlComplete: window.location.href,
      });
    });

    // Avatar dropdown toggle
    userChip?.addEventListener('click', toggleDropdown);
    document.addEventListener('click', (e) => {
      if (dropdownMenu?.classList.contains('open') &&
          !userChip?.contains(e.target) &&
          !dropdownMenu?.contains(e.target)) {
        closeDropdown();
      }
    });

    // Dropdown items
    document.getElementById('ddDashboard')?.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
    document.getElementById('ddBookings')?.addEventListener('click', () => {
      window.location.href = 'dashboard.html#my-trips';
    });
    document.getElementById('ddSignOut')?.addEventListener('click', signOut);

    // Mobile nav sign-in
    document.getElementById('mobileSignInBtn')?.addEventListener('click', () => {
      // Close mobile nav first
      document.getElementById('mobileNavOverlay')?.classList.remove('open');
      openAuthModal('signin');
    });

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('active')) {
        closeAuthModal();
      }
    });

    // Trigger from "Sign In" nav button
    document.getElementById('navSignInBtn')?.addEventListener('click', () =>
      openAuthModal('signin')
    );

    // Trigger from "Book Now" nav button (for users not logged in)
    document.getElementById('navBookNowBtn')?.addEventListener('click', () => {
      if (!clerkInstance?.user) {
        openAuthModal('signin');
      } else {
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ── Open Auth Modal ───────────────────────────────────────
  function openAuthModal(mode = 'signin') {
    if (!overlay) resolveDOM();
    currentMode = mode;

    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';

    switchTab(mode);

    // Mount Clerk component into the designated div
    mountClerkComponent(mode);
  }

  // ── Close Auth Modal ──────────────────────────────────────
  function closeAuthModal() {
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Switch Tab ────────────────────────────────────────────
  function switchTab(mode) {
    currentMode = mode;
    const isSignIn = mode === 'signin';

    tabSignIn?.classList.toggle('active', isSignIn);
    tabSignUp?.classList.toggle('active', !isSignIn);

    if (signInMount) signInMount.style.display = isSignIn ? 'block' : 'none';
    if (signUpMount) signUpMount.style.display = isSignIn ? 'none' : 'block';

    mountClerkComponent(mode);
  }

  // ── Mount Clerk Component ──────────────────────────────────
  function mountClerkComponent(mode) {
    if (!clerkInstance) return;
    const mountEl = mode === 'signin' ? signInMount : signUpMount;
    if (!mountEl) return;

    // Clear previous mount
    mountEl.innerHTML = '';

    try {
      if (mode === 'signin') {
        clerkInstance.mountSignIn(mountEl, {
          routing: 'virtual',
          afterSignInUrl: window.location.href,
        });
      } else {
        clerkInstance.mountSignUp(mountEl, {
          routing: 'virtual',
          afterSignUpUrl: window.location.href,
        });
      }
    } catch (e) {
      // Clerk may throw if not initialized with real key (test placeholder)
      console.warn('[AshtaAuth] Could not mount Clerk component:', e.message);
      mountEl.innerHTML = `
        <div style="padding:1rem;text-align:center;color:var(--color-muted);font-size:0.85rem;line-height:1.7;">
          <p>⚠️ Auth not configured yet.</p>
          <p>Replace the Clerk key in <code>js/auth.js</code> with your real publishable key.</p>
        </div>`;
    }
  }

  // ── On Signed In ──────────────────────────────────────────
  function onSignedIn(user) {
    console.log('[AshtaAuth] Signed in:', user.fullName || user.primaryEmailAddress?.emailAddress);
    closeAuthModal();
    updateNavbar(user);

    // Save user to Firebase
    if (window.AshtaFirebase?.saveUser) {
      window.AshtaFirebase.saveUser(user);
    }

    // If there's a pending booking, open it now
    if (window._pendingCheckoutData) {
      const data = window._pendingCheckoutData;
      window._pendingCheckoutData = null;
      setTimeout(() => window.AshtaCheckout?.open(data), 300);
    }
  }

  // ── On Signed Out ─────────────────────────────────────────
  function onSignedOut() {
    console.log('[AshtaAuth] Signed out.');
    resetNavbar();
  }

  // ── Update Navbar (post-login) ────────────────────────────
  function updateNavbar(user) {
    if (!authPre || !authPost) resolveDOM();

    const firstName = user.firstName || user.fullName?.split(' ')[0] || 'Traveler';
    const photoURL  = user.imageUrl || '';
    const initials  = (firstName[0] || 'T').toUpperCase();

    // Avatar element
    if (userAvatarEl) {
      if (photoURL) {
        userAvatarEl.innerHTML = `<img src="${photoURL}" alt="${firstName}" loading="lazy">`;
      } else {
        userAvatarEl.textContent = initials;
      }
    }

    if (userNameEl) userNameEl.textContent = firstName;

    // Swap visibility
    authPre?.classList.remove('visible');
    authPre && (authPre.style.display = 'none');
    authPost?.classList.add('visible');
  }

  // ── Reset Navbar (post-logout) ────────────────────────────
  function resetNavbar() {
    if (!authPre) resolveDOM();
    authPost?.classList.remove('visible');
    authPre && (authPre.style.display = '');
    closeDropdown();
  }

  // ── Dropdown ─────────────────────────────────────────────
  function toggleDropdown() {
    const isOpen = dropdownMenu?.classList.contains('open');
    isOpen ? closeDropdown() : openDropdown();
  }

  function openDropdown() {
    dropdownMenu?.classList.add('open');
    userChip?.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    dropdownMenu?.classList.remove('open');
    userChip?.setAttribute('aria-expanded', 'false');
  }

  // ── Sign Out ──────────────────────────────────────────────
  async function signOut() {
    closeDropdown();
    try {
      await clerkInstance?.signOut();
      // If on dashboard page, redirect home
      if (window.location.pathname.includes('dashboard')) {
        window.location.href = 'index.html';
      }
    } catch (e) {
      console.error('[AshtaAuth] Sign out error:', e);
    }
  }

  // ── Expose Public API ─────────────────────────────────────
  window.AshtaAuth = {
    init,
    openAuthModal,
    closeAuthModal,
    signOut,
    getUser: () => clerkInstance?.user || null,
    isSignedIn: () => !!clerkInstance?.user,
  };

  // ── Auto-init ─────────────────────────────────────────────
  // Clerk CDN adds window.Clerk; we wait for it
  function waitForClerk(retries = 20) {
    if (window.Clerk) {
      init();
    } else if (retries > 0) {
      setTimeout(() => waitForClerk(retries - 1), 200);
    } else {
      console.warn('[AshtaAuth] Clerk SDK did not load in time.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForClerk());
  } else {
    waitForClerk();
  }

})();
