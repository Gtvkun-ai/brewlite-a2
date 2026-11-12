'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Service Worker registration failed:', error);
          });
      });
    }

    // 2. Check if already running standalone (installed PWA)
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true)
    ) {
      setIsInstalled(true);
    }

    // 3. Listen for PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App successfully installed!');
      setShowInstallBanner(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBanner || isInstalled) {
    return null;
  }

  return (
    <div className="pwa-install-banner" data-testid="pwa-install-banner">
      <div className="pwa-install-banner__content">
        <span className="pwa-install-banner__icon">☕</span>
        <div className="pwa-install-banner__text">
          <strong>Cài đặt Ứng dụng BrewLite</strong>
          <p>Trải nghiệm đặt món nhanh như App điện thoại, mượt mà và tiện lợi.</p>
        </div>
      </div>
      <div className="pwa-install-banner__actions">
        <button
          type="button"
          onClick={() => setShowInstallBanner(false)}
          className="pwa-install-banner__btn pwa-install-banner__btn--dismiss"
        >
          Để sau
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          className="pwa-install-banner__btn pwa-install-banner__btn--install"
        >
          Cài đặt ngay 📲
        </button>
      </div>
    </div>
  );
}

export default PwaRegister;

