/**
 * pwaInstallManager.js — Centralized PWA Installation Architecture
 *
 * Implements:
 * - Cross-platform detection (Android, iPhone, iPad, iPadOS Safari, Desktop, iOS browsers)
 * - Standalone / Installed state detection
 * - beforeinstallprompt capture and management
 * - appinstalled event handling
 * - Dismissal cooldown persistence (7d -> 14d -> 30d)
 * - Smart trigger coordination
 * - Event subscriber mechanism for UI synchronization
 */

const STORAGE_KEY = 'pwa-install-prompt';

export const PWA_STATE = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  NOT_INSTALLABLE: 'NOT_INSTALLABLE',
  READY_TO_INSTALL: 'READY_TO_INSTALL',
  IOS_INSTRUCTIONS: 'IOS_INSTRUCTIONS',
  PROMPT_OPEN: 'PROMPT_OPEN',
  INSTALLING: 'INSTALLING',
  INSTALL_ACCEPTED: 'INSTALL_ACCEPTED',
  INSTALL_DISMISSED: 'INSTALL_DISMISSED',
  INSTALLED: 'INSTALLED',
  ERROR: 'ERROR',
};

class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.listeners = new Set();
    this.state = PWA_STATE.NOT_INSTALLABLE;
    this.platform = this.detectPlatform();
    this.browser = this.detectBrowser();
    this.smartTriggerTimeout = null;
    this.isSmartTriggerArmed = false;

    // Initial check
    if (this.isAppInstalled()) {
      this.state = PWA_STATE.INSTALLED;
      this.markInstalledInStorage();
    } else if (this.platform === 'ios') {
      this.state = PWA_STATE.READY_TO_INSTALL;
    }

    if (typeof window !== 'undefined') {
      this.initEventListeners();
    }
  }

  // ─── Platform Detection ─────────────────────────────────────────────────────

  detectPlatform() {
    if (typeof window === 'undefined' || !navigator) return 'unsupported';

    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // iPadOS 13+ desktop-mode Safari spoofing as MacIntel
    const isIPadOSDesktop = platform === 'MacIntel' && maxTouchPoints > 1 && !window.MSStream;

    // Standard iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

    if (isIOSDevice || isIPadOSDesktop) {
      return 'ios';
    }

    if (/Android/i.test(ua)) {
      return 'android';
    }

    // Desktop platforms
    if (/Win|Mac|Linux|X11|CrOS/i.test(platform) || /Windows|Macintosh|Linux/i.test(ua)) {
      return 'desktop';
    }

    return 'unsupported';
  }

  detectBrowser() {
    if (typeof window === 'undefined' || !navigator) {
      return { name: 'unknown', isSafari: false, isChrome: false, isFirefox: false, isEdge: false, isInApp: false };
    }

    const ua = navigator.userAgent || '';

    const isChromeIOS = /CriOS/i.test(ua);
    const isFirefoxIOS = /FxiOS/i.test(ua);
    const isEdgeIOS = /EdgiOS/i.test(ua);
    const isSafariIOS = /Safari/i.test(ua) && !isChromeIOS && !isFirefoxIOS && !isEdgeIOS;

    // In-App browser detection (Instagram, Facebook, Twitter, WhatsApp, etc.)
    const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|WhatsApp/i.test(ua);

    const isChrome = /Chrome/i.test(ua) && !/Edge|Edg|OPR/i.test(ua);
    const isEdge = /Edge|Edg/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua);

    return {
      name: isEdge ? 'edge' : isChrome ? 'chrome' : isFirefox ? 'firefox' : isSafari ? 'safari' : 'other',
      isSafari: this.platform === 'ios' ? isSafariIOS : isSafari,
      isChrome: this.platform === 'ios' ? isChromeIOS : isChrome,
      isFirefox: this.platform === 'ios' ? isFirefoxIOS : isFirefox,
      isEdge: this.platform === 'ios' ? isEdgeIOS : isEdge,
      isInApp,
    };
  }

  // ─── Installed State Detection ──────────────────────────────────────────────

  isAppInstalled() {
    if (typeof window === 'undefined') return false;

    // 1. Standalone display mode match
    const isStandaloneDisplay = window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    );

    // 2. iOS Safari standalone property
    const isIOSStandalone = window.navigator && window.navigator.standalone === true;

    // 3. Android TWA / PWA referrer
    const isReferrerAndroidApp = typeof document !== 'undefined' &&
      document.referrer && document.referrer.startsWith('android-app://');

    // 4. Stored persistent install flag
    const stored = this.getStorageData();
    const isStoredInstalled = !!stored.installed;

    return Boolean(isStandaloneDisplay || isIOSStandalone || isReferrerAndroidApp || isStoredInstalled);
  }

  // ─── Storage & Cooldown Management ─────────────────────────────────────────

  getStorageData() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { dismissedAt: 0, shownCount: 0, dismissCount: 0, installed: false };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { dismissedAt: 0, shownCount: 0, dismissCount: 0, installed: false };
      const parsed = JSON.parse(raw);
      return {
        dismissedAt: typeof parsed.dismissedAt === 'number' ? parsed.dismissedAt : 0,
        shownCount: typeof parsed.shownCount === 'number' ? parsed.shownCount : 0,
        dismissCount: typeof parsed.dismissCount === 'number' ? parsed.dismissCount : 0,
        installed: Boolean(parsed.installed),
      };
    } catch (e) {
      console.warn('[PWA] Error reading install storage, returning defaults:', e);
      return { dismissedAt: 0, shownCount: 0, dismissCount: 0, installed: false };
    }
  }

  saveStorageData(data) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const current = this.getStorageData();
      const updated = { ...current, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[PWA] Error writing install storage:', e);
    }
  }

  markInstalledInStorage() {
    this.saveStorageData({ installed: true });
  }

  recordDismissal() {
    const data = this.getStorageData();
    const newDismissCount = data.dismissCount + 1;
    this.saveStorageData({
      dismissedAt: Date.now(),
      dismissCount: newDismissCount,
    });
  }

  incrementShownCount() {
    const data = this.getStorageData();
    this.saveStorageData({
      shownCount: (data.shownCount || 0) + 1,
    });
  }

  isCooldownActive() {
    const data = this.getStorageData();
    if (!data.dismissedAt || data.dismissCount === 0) {
      return false;
    }

    const now = Date.now();
    const elapsed = now - data.dismissedAt;

    // Cooldown duration based on dismissal count:
    // 1st dismissal: 7 days
    // 2nd dismissal: 14 days
    // 3rd+ dismissal: 30 days
    let cooldownMs = 7 * 24 * 60 * 60 * 1000;
    if (data.dismissCount === 2) {
      cooldownMs = 14 * 24 * 60 * 60 * 1000;
    } else if (data.dismissCount >= 3) {
      cooldownMs = 30 * 24 * 60 * 60 * 1000;
    }

    return elapsed < cooldownMs;
  }

  // ─── Event Listeners ────────────────────────────────────────────────────────

  initEventListeners() {
    // 1. Android / Chromium beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      this.deferredPrompt = e;

      if (!this.isAppInstalled()) {
        this.setState(PWA_STATE.READY_TO_INSTALL);
      }
    });

    // 2. appinstalled event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.markInstalledInStorage();
      this.setState(PWA_STATE.INSTALLED);
    });

    // 3. Display mode changes (user installs from address bar while page is open)
    try {
      const matchStandalone = window.matchMedia('(display-mode: standalone)');
      matchStandalone.addEventListener('change', (e) => {
        if (e.matches) {
          this.markInstalledInStorage();
          this.setState(PWA_STATE.INSTALLED);
        }
      });
    } catch {
      // Fallback for older browsers
    }
  }

  // ─── Smart Trigger Coordination ─────────────────────────────────────────────

  canShowSmartPrompt(currentPath = window.location.pathname) {
    // Never show if already installed
    if (this.isAppInstalled()) return false;

    // Respect dismissal cooldown
    if (this.isCooldownActive()) return false;

    // Avoid sensitive authentication or SOS pages
    const blockedPaths = ['/login', '/reset-password', '/complete-profile', '/splash'];
    if (blockedPaths.some((p) => currentPath.startsWith(p))) {
      return false;
    }

    // Must have a valid installation method
    if (this.platform === 'ios') {
      return true; // iOS Safari guide is supported
    }

    // On Android/Desktop, must have received beforeinstallprompt
    return Boolean(this.deferredPrompt);
  }

  armSmartTrigger(onTrigger, delayMs = 10000) {
    if (typeof window === 'undefined' || this.isSmartTriggerArmed) return;
    this.isSmartTriggerArmed = true;

    // Wait initial delay (8-15 seconds recommended; 10s default)
    this.smartTriggerTimeout = setTimeout(() => {
      if (this.canShowSmartPrompt()) {
        onTrigger();
        this.incrementShownCount();
      }
    }, delayMs);
  }

  disarmSmartTrigger() {
    if (this.smartTriggerTimeout) {
      clearTimeout(this.smartTriggerTimeout);
      this.smartTriggerTimeout = null;
    }
    this.isSmartTriggerArmed = false;
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  async install() {
    if (this.platform === 'ios') {
      this.setState(PWA_STATE.IOS_INSTRUCTIONS);
      return { outcome: 'instructions_shown' };
    }

    if (!this.deferredPrompt) {
      console.warn('[PWA] No deferred beforeinstallprompt available.');
      return { outcome: 'unavailable' };
    }

    try {
      this.setState(PWA_STATE.INSTALLING);
      // Trigger native browser prompt
      const promptEvent = this.deferredPrompt;
      await promptEvent.prompt();

      const choiceResult = await promptEvent.userChoice;
      this.deferredPrompt = null; // Clear consumed prompt immediately

      if (choiceResult.outcome === 'accepted') {
        this.markInstalledInStorage();
        this.setState(PWA_STATE.INSTALL_ACCEPTED);
        return { outcome: 'accepted' };
      } else {
        this.recordDismissal();
        this.setState(PWA_STATE.INSTALL_DISMISSED);
        return { outcome: 'dismissed' };
      }
    } catch (err) {
      console.error('[PWA] Installation failed:', err);
      this.setState(PWA_STATE.ERROR);
      return { outcome: 'error', error: err };
    }
  }

  dismiss(recordCooldown = true) {
    if (recordCooldown) {
      this.recordDismissal();
    }
    this.setState(this.isAppInstalled() ? PWA_STATE.INSTALLED : PWA_STATE.READY_TO_INSTALL);
  }

  // ─── State & Subscribers ────────────────────────────────────────────────────

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  getState() {
    return {
      state: this.state,
      canInstall: this.canInstall(),
      isInstalled: this.isAppInstalled(),
      platform: this.platform,
      browser: this.browser,
      hasDeferredPrompt: Boolean(this.deferredPrompt),
    };
  }

  canInstall() {
    if (this.isAppInstalled()) return false;
    if (this.platform === 'ios') return true;
    return Boolean(this.deferredPrompt);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Send immediate initial state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[PWA] Subscriber error:', err);
      }
    });
  }
}

// Export singleton instance
export const pwaManager = new PWAInstallManager();
