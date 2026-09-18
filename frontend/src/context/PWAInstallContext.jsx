import { useState, useEffect, useCallback, useMemo } from 'react';
import { pwaManager, PWA_STATE } from '../services/pwaInstallManager.js';
import { PWAInstallContext } from './pwaContext.js';

export function PWAInstallProvider({ children }) {
  const [managerState, setManagerState] = useState(() => pwaManager.getState());
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  // Subscribe to manager updates
  useEffect(() => {
    const unsubscribe = pwaManager.subscribe((latest) => {
      setManagerState(latest);
    });
    return unsubscribe;
  }, []);

  // Arm smart trigger on mount after initial user presence
  useEffect(() => {
    if (managerState.isInstalled) return;

    pwaManager.armSmartTrigger(() => {
      setIsPromptOpen(true);
    }, 10000); // 10 seconds delay

    return () => {
      pwaManager.disarmSmartTrigger();
    };
  }, [managerState.isInstalled]);

  const showInstallPrompt = useCallback(() => {
    if (managerState.isInstalled) return;

    if (managerState.platform === 'ios') {
      setIsIOSGuideOpen(true);
      setIsPromptOpen(true);
    } else {
      setIsPromptOpen(true);
    }
  }, [managerState.isInstalled, managerState.platform]);

  const dismissInstallPrompt = useCallback((recordCooldown = true) => {
    setIsPromptOpen(false);
    setIsIOSGuideOpen(false);
    pwaManager.dismiss(recordCooldown);
  }, []);

  const install = useCallback(async () => {
    if (managerState.platform === 'ios') {
      setIsIOSGuideOpen(true);
      return { outcome: 'instructions_shown' };
    }

    const result = await pwaManager.install();
    if (result.outcome === 'accepted' || result.outcome === 'dismissed') {
      setIsPromptOpen(false);
    }
    return result;
  }, [managerState.platform]);

  const openIOSInstructions = useCallback(() => {
    setIsIOSGuideOpen(true);
    setIsPromptOpen(true);
  }, []);

  const closeIOSInstructions = useCallback(() => {
    setIsIOSGuideOpen(false);
    setIsPromptOpen(false);
    pwaManager.dismiss(true);
  }, []);

  const contextValue = useMemo(() => ({
    canInstall: managerState.canInstall,
    isInstalled: managerState.isInstalled,
    platform: managerState.platform,
    browser: managerState.browser,
    installState: managerState.state,
    isPromptOpen,
    isIOSGuideOpen,
    showInstallPrompt,
    dismissInstallPrompt,
    install,
    openIOSInstructions,
    closeIOSInstructions,
    PWA_STATE,
  }), [
    managerState,
    isPromptOpen,
    isIOSGuideOpen,
    showInstallPrompt,
    dismissInstallPrompt,
    install,
    openIOSInstructions,
    closeIOSInstructions,
  ]);

  return (
    <PWAInstallContext.Provider value={contextValue}>
      {children}
    </PWAInstallContext.Provider>
  );
}
