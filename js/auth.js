/* ============================================================
   ASHTADISHA — Custom Firebase Authentication
   js/auth.js

   Handles Login, Signup, Social Auth, and User State via Firebase.
   Exposes window.AshtaAuth for use by other modules.
   ============================================================ */

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  let currentUser = null;
  let currentMode = 'signin'; // 'signin' | 'signup'

  // ── DOM References ────────────────────────────────────────
  let overlay, authCard, authForm, authMsg, authSubmitBtn,
      tabSignIn, tabSignUp, closeBtn, authPre, authPost,
      userAvatarEl, userNameEl, dropdownMenu, userChip,
      passwordInput, passwordToggle, forgotBtn, nameFieldRow;

  async function loadAuthMarkupIfNeeded() {
    const el = document.getElementById('authOverlay');
    if (!el || document.getElementById('authCard')) return;
    try {
      const r = await fetch('components/auth-inner.html');
      if (!r.ok) return;
      el.classList.add('auth-overlay');
      el.innerHTML = await r.text();
    } catch (e) {
      console.warn('[AshtaAuth] Could not load auth-inner.html (planner / partial pages).', e);
    }
  }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    await loadAuthMarkupIfNeeded();
    resolveDOM();
    bindEvents();

    // Listen for Firebase Auth changes
    if (window.firebase && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
          onSignedIn(user);
        } else {
          onSignedOut();
        }
      });
    } else {
      console.error('[AshtaAuth] Firebase Auth SDK not found.');
    }

    const wantsLogin = new URLSearchParams(window.location.search).get('login') === '1';
    const path = window.location.pathname.toLowerCase();
    const onHomePage = path === '/' || path === '' || path.endsWith('/index.html');
    const onPlannerPage = path.endsWith('planner.html');
    if (wantsLogin && (onHomePage || onPlannerPage)) {
      setTimeout(() => openAuthModal('signin'), 250);
    }
  }

  // ── Resolve DOM elements ──────────────────────────────────
  function resolveDOM() {
    overlay       = document.getElementById('authOverlay');
    authCard      = document.getElementById('authCard');
    authForm      = document.getElementById('authForm');
    authMsg       = document.getElementById('authMsg');
    authSubmitBtn = document.getElementById('authSubmitBtn');
    tabSignIn     = document.getElementById('authTabSignIn');
    tabSignUp     = document.getElementById('authTabSignUp');
    closeBtn      = document.getElementById('authClose');
    authPre       = document.getElementById('navAuthPre');
    authPost      = document.getElementById('navAuthPost');
    userAvatarEl  = document.getElementById('navUserAvatar');
    userNameEl    = document.getElementById('navUserName');
    dropdownMenu  = document.getElementById('navUserDropdown');
    userChip      = document.getElementById('navUserChip');
    passwordInput = document.getElementById('authPassword');
    passwordToggle = document.getElementById('passwordToggle');
    forgotBtn      = document.getElementById('authForgotBtn');
    nameFieldRow   = document.querySelector('.signup-only');
  }

  // ── Bind UI events ────────────────────────────────────────
  function bindEvents() {
    // Modal controls
    closeBtn?.addEventListener('click', closeAuthModal);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeAuthModal();
    });

    // Tab switcher
    tabSignIn?.addEventListener('click', () => switchMode('signin'));
    tabSignUp?.addEventListener('click', () => switchMode('signup'));

    // Form submission
    authForm?.addEventListener('submit', handleFormSubmit);

    // Password visibility
    passwordToggle?.addEventListener('click', togglePasswordVisibility);

    // Social buttons
    document.getElementById('authGoogleBtn')?.addEventListener('click', () => socialSignIn('google'));
    document.getElementById('authFacebookBtn')?.addEventListener('click', () => socialSignIn('facebook'));

    // Forgot password
    forgotBtn?.addEventListener('click', handleForgotPassword);

    // Navbar interactions
    userChip?.addEventListener('click', toggleDropdown);
    document.addEventListener('click', (e) => {
      if (dropdownMenu?.classList.contains('open') &&
          !userChip?.contains(e.target) &&
          !dropdownMenu?.contains(e.target)) {
        closeDropdown();
      }
    });

    document.getElementById('ddDashboard')?.addEventListener('click', () => {
      window.location.href = '/dashboard.html';
    });
    document.getElementById('ddBookings')?.addEventListener('click', () => {
      window.location.href = '/dashboard.html#trips';
    });
    document.getElementById('ddSignOut')?.addEventListener('click', signOut);

    // Navigation trigger
    document.getElementById('navSignInBtn')?.addEventListener('click', () => openAuthModal('signin'));
    document.getElementById('mobileSignInBtn')?.addEventListener('click', () => {
      document.getElementById('mobileNavOverlay')?.classList.remove('open');
      document.getElementById('hamburger')?.classList.remove('open');
      document.body.style.overflow = '';
      openAuthModal('signin');
    });

    // "Book Now" gate
    document.getElementById('navBookNowBtn')?.addEventListener('click', (e) => {
      if (!currentUser) {
        e.preventDefault();
        openAuthModal('signin');
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('active')) closeAuthModal();
    });
  }

  // ── Mode Switcher ─────────────────────────────────────────
  function switchMode(mode) {
    currentMode = mode;
    clearMessage();

    const isSignIn = mode === 'signin';
    tabSignIn?.classList.toggle('active', isSignIn);
    tabSignUp?.classList.toggle('active', !isSignIn);

    // Toggle name field
    if (nameFieldRow) {
      nameFieldRow.style.display = isSignIn ? 'none' : 'block';
    }

    // Update submit button
    const btnText = authSubmitBtn?.querySelector('.btn-text');
    if (btnText) btnText.textContent = isSignIn ? 'Sign In' : 'Create Account';

    // Show/hide forgot password
    const signinOnlys = document.querySelectorAll('.signin-only');
    signinOnlys.forEach(el => el.style.display = isSignIn ? '' : 'none');
  }

  // ── Form Handling ─────────────────────────────────────────
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (authSubmitBtn?.classList.contains('loading')) return;

    const email = document.getElementById('authEmail').value.trim();
    const pass  = document.getElementById('authPassword').value;
    const name  = document.getElementById('authName')?.value.trim();

    if (!email || !pass) return showMessage('error', 'Please fill in all fields.');
    if (currentMode === 'signup' && !name) return showMessage('error', 'Please enter your name.');

    setLoading(true);
    clearMessage();

    try {
      if (currentMode === 'signin') {
        // LOGIN
        await firebase.auth().signInWithEmailAndPassword(email, pass);
      } else {
        // SIGNUP
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        // Update profile with Name (Auth)
        await cred.user.updateProfile({ displayName: name });
        // Force sync to Firestore with the name
        if (window.AshtaFirebase?.saveUser) {
           await window.AshtaFirebase.saveUser(cred.user, name);
        }
        onSignedIn(cred.user);
      }
    } catch (err) {
      console.error('[AshtaAuth] Auth error:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Social Sign In ────────────────────────────────────────
  async function socialSignIn(providerName) {
    let provider;
    if (providerName === 'google') {
      provider = new firebase.auth.GoogleAuthProvider();
    } else {
      provider = new firebase.auth.FacebookAuthProvider();
    }

    try {
      setLoading(true);
      await firebase.auth().signInWithPopup(provider);
    } catch (err) {
      console.error('[AshtaAuth] Social error:', err);
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot Password ───────────────────────────────────────
  async function handleForgotPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email) return showMessage('error', 'Enter your email to reset password.');

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      showMessage('success', 'Reset link sent to your email!');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // ── Error Handling ────────────────────────────────────────
  function handleAuthError(err) {
    let msg = 'An unexpected error occurred.';
    switch (err.code) {
      case 'auth/email-already-in-use':
        msg = 'Email already registered. Please sign in instead.';
        switchMode('signin');
        break;
      case 'auth/invalid-email':
        msg = 'Invalid email address.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        msg = 'Incorrect email or password. Please check and try again.';
        break;
      case 'auth/weak-password':
        msg = 'Password should be at least 6 characters.';
        break;
      case 'auth/operation-not-allowed':
        msg = 'Email/Password disabled in Firebase! Go to Firebase Console -> Authentication -> Sign-in Method and enable "Email/Password".';
        break;
      default:
        msg = err.message;
    }
    showMessage('error', msg);
  }

  // ── State Changes ─────────────────────────────────────────
  function onSignedIn(user) {
    console.log('[AshtaAuth] User session:', user.email);
    closeAuthModal();
    updateNavbar(user);

    // Save/Update user in Firestore
    if (window.AshtaFirebase?.saveUser) {
      window.AshtaFirebase.saveUser(user);
    }

    // Resume pending booking
    if (window._pendingCheckoutData) {
      const data = window._pendingCheckoutData;
      window._pendingCheckoutData = null;
      setTimeout(() => window.AshtaCheckout?.open(data), 500);
    }
  }

  function onSignedOut() {
    console.log('[AshtaAuth] No active session.');
    resetNavbar();
  }

  // ── UI Helpers ────────────────────────────────────────────
  function openAuthModal(mode = 'signin') {
    if (!overlay) resolveDOM();
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchMode(mode);
  }

  function closeAuthModal() {
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
    clearMessage();
  }

  function togglePasswordVisibility() {
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';
    passwordToggle.classList.toggle('visible', isPass);
  }

  function setLoading(loading) {
    authSubmitBtn?.classList.toggle('loading', loading);
    authForm?.querySelectorAll('input, button').forEach(el => el.disabled = loading);
  }

  function showMessage(type, text) {
    if (!authMsg) return;
    authMsg.textContent = text;
    authMsg.className = `auth-message show ${type}`;
  }

  function clearMessage() {
    if (authMsg) {
      authMsg.textContent = '';
      authMsg.className = 'auth-message';
    }
  }

  // ── Navbar ────────────────────────────────────────────────
  function updateNavbar(user) {
    if (!authPre || !authPost) resolveDOM();

    const name = user.displayName || user.email.split('@')[0];
    const initials = name[0].toUpperCase();

    if (userNameEl) userNameEl.textContent = name;
    if (userAvatarEl) {
      if (user.photoURL) {
        userAvatarEl.innerHTML = `<img src="${user.photoURL}" alt="${name}">`;
      } else {
        userAvatarEl.textContent = initials;
      }
    }

    authPre?.classList.add('hidden');
    authPost?.classList.remove('hidden');
    authPost?.classList.add('visible');
  }

  function resetNavbar() {
    if (!authPre) resolveDOM();
    authPost?.classList.add('hidden');
    authPost?.classList.remove('visible');
    authPre?.classList.remove('hidden');
    closeDropdown();
  }

  function toggleDropdown() {
    dropdownMenu?.classList.toggle('open');
    userChip?.setAttribute('aria-expanded', dropdownMenu?.classList.contains('open'));
  }

  function closeDropdown() {
    dropdownMenu?.classList.remove('open');
    userChip?.setAttribute('aria-expanded', 'false');
  }

  async function signOut() {
    closeDropdown();
    try {
      await firebase.auth().signOut();
      if (window.location.pathname.includes('dashboard')) {
        window.location.href = '/';
      }
    } catch (e) {
      console.error('[AshtaAuth] Sign out error:', e);
    }
  }

  // ── Public API ────────────────────────────────────────────
  window.AshtaAuth = {
    init,
    openAuthModal,
    closeAuthModal,
    signOut,
    getUser: () => currentUser,
    isSignedIn: () => !!currentUser,
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
