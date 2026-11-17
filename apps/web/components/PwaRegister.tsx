'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Apple, Monitor, X, Check, HelpCircle, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // 1. Detect operating system
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/android/i.test(ua)) {
        setActiveTab('android');
      } else if (/iphone|ipad|ipod/i.test(ua)) {
        setActiveTab('ios');
      } else {
        setActiveTab('desktop');
      }
    }

    // 2. Register Service Worker reliably (whether document is loading or already loaded)
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Service Worker registration failed:', error);
          });
      }
    };

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }
    }

    // 3. Check if already running standalone (installed PWA)
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true)
    ) {
      setIsInstalled(true);
    } else {
      // If not standalone and not dismissed this session, show the prompt banner
      const isDismissed = typeof window !== 'undefined' && sessionStorage.getItem('brewlite_pwa_dismissed') === '1';
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    }

    // 4. Capture native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
      console.log('[PWA] Native beforeinstallprompt captured');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed!');
      setShowInstallBanner(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
    };

    // 5. Global trigger event for external buttons (Footer, menu, etc.)
    const handleOpenInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt().then(() => {
          return deferredPrompt.userChoice;
        }).then((choice) => {
          if (choice?.outcome === 'accepted') {
            setShowInstallBanner(false);
          }
          setDeferredPrompt(null);
        }).catch(() => {
          setShowGuideModal(true);
        });
      } else {
        setShowGuideModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('brewlite:install-pwa', handleOpenInstall);

    return () => {
      window.removeEventListener('load', registerServiceWorker);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('brewlite:install-pwa', handleOpenInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt');
          setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[PWA] Prompt call error:', err);
        setShowGuideModal(true);
      }
    } else {
      // If deferredPrompt is not available (common in iOS or prior to Chrome heuristic trigger), show guide modal
      setShowGuideModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('brewlite_pwa_dismissed', '1');
    }
  };

  return (
    <>
      {/* 1. Top Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="pwa-install-banner" data-testid="pwa-install-banner">
          <div className="pwa-install-banner__content">
            <span className="pwa-install-banner__icon">☕</span>
            <div className="pwa-install-banner__text">
              <strong>Cài đặt Ứng dụng BrewLite</strong>
              <p>Trải nghiệm đặt món siêu tốc, dùng offline mượt mà như App điện thoại.</p>
            </div>
          </div>
          <div className="pwa-install-banner__actions">
            <button
              type="button"
              onClick={handleDismissBanner}
              className="pwa-install-banner__btn pwa-install-banner__btn--dismiss"
              data-testid="pwa-dismiss-btn"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="pwa-install-banner__btn pwa-install-banner__btn--install"
              data-testid="pwa-install-btn"
            >
              <Download size={15} className="inline mr-1" />
              Cài đặt ngay
            </button>
          </div>
        </div>
      )}

      {/* 2. Step-by-Step Installation Modal Guide */}
      {showGuideModal && (
        <div className="pwa-modal-backdrop" onClick={() => setShowGuideModal(false)}>
          <div
            className="pwa-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-modal-title"
          >
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="pwa-modal__close"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="pwa-modal__header">
              <div className="pwa-modal__icon-wrap">☕</div>
              <div>
                <h3 id="pwa-modal-title" className="pwa-modal__title">
                  Cài đặt BrewLite lên màn hình chính
                </h3>
                <p className="pwa-modal__subtitle">
                  Ứng dụng PWA nhẹ &lt; 2MB, không cần tải qua App Store / Google Play
                </p>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="pwa-modal__tabs">
              <button
                type="button"
                className={`pwa-modal__tab ${activeTab === 'android' ? 'pwa-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('android')}
              >
                <Smartphone size={16} />
                <span>Android (Chrome)</span>
              </button>
              <button
                type="button"
                className={`pwa-modal__tab ${activeTab === 'ios' ? 'pwa-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('ios')}
              >
                <Apple size={16} />
                <span>iPhone / iPad</span>
              </button>
              <button
                type="button"
                className={`pwa-modal__tab ${activeTab === 'desktop' ? 'pwa-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('desktop')}
              >
                <Monitor size={16} />
                <span>Máy tính / PC</span>
              </button>
            </div>

            {/* Platform Instructions */}
            <div className="pwa-modal__body">
              {activeTab === 'android' && (
                <div className="pwa-modal__steps">
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">1</span>
                    <div className="pwa-modal__step-content">
                      <strong>Mở menu trình duyệt Chrome</strong>
                      <p>
                        Nhấn vào biểu tượng <strong>3 chấm dọc (⋮)</strong> ở góc trên cùng bên phải màn hình điện thoại.
                      </p>
                    </div>
                  </div>
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">2</span>
                    <div className="pwa-modal__step-content">
                      <strong>Chọn Cài đặt ứng dụng</strong>
                      <p>
                        Nhấn chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> (hoặc <strong>&quot;Thêm vào Màn hình chính&quot;</strong> / <em>Install app</em>).
                      </p>
                    </div>
                  </div>
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">3</span>
                    <div className="pwa-modal__step-content">
                      <strong>Xác nhận cài đặt</strong>
                      <p>
                        Nhấn <strong>&quot;Cài đặt&quot;</strong> ở bảng thông báo xác nhận. Icon BrewLite sẽ xuất hiện trên màn hình chính của bạn ngay lập tức!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="pwa-modal__steps">
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">1</span>
                    <div className="pwa-modal__step-content">
                      <strong>Mở bằng trình duyệt Safari</strong>
                      <p>
                        Đảm bảo bạn đang mở website BrewLite trên trình duyệt <strong>Safari</strong> của iPhone/iPad.
                      </p>
                    </div>
                  </div>
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">2</span>
                    <div className="pwa-modal__step-content">
                      <strong>Nhấn nút Chia sẻ (Share)</strong>
                      <p>
                        Nhấn vào biểu tượng <strong>Chia sẻ (hình vuông mũi tên hướng lên ⎋)</strong> ở thanh công cụ phía dưới cùng màn hình.
                      </p>
                    </div>
                  </div>
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">3</span>
                    <div className="pwa-modal__step-content">
                      <strong>Thêm vào Màn hình chính</strong>
                      <p>
                        Cuộn danh sách xuống và chọn <strong>&quot;Thêm vào MH chính&quot;</strong> (<em>Add to Home Screen</em>), sau đó bấm <strong>&quot;Thêm&quot;</strong> ở góc trên phải.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'desktop' && (
                <div className="pwa-modal__steps">
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">1</span>
                    <div className="pwa-modal__step-content">
                      <strong>Thanh địa chỉ URL</strong>
                      <p>
                        Nhấn vào biểu tượng <strong>Cài đặt (⊕ hoặc hình máy tính)</strong> ở góc phải thanh nhập địa chỉ trình duyệt Chrome / Edge.
                      </p>
                    </div>
                  </div>
                  <div className="pwa-modal__step">
                    <span className="pwa-modal__step-num">2</span>
                    <div className="pwa-modal__step-content">
                      <strong>Xác nhận cài đặt</strong>
                      <p>
                        Bấm <strong>&quot;Cài đặt&quot;</strong> để mở BrewLite trong cửa sổ ứng dụng riêng biệt, tiện lợi như phần mềm desktop.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pwa-modal__footer">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="pwa-modal__confirm-btn"
              >
                <Check size={16} className="inline mr-1" />
                Đã hiểu, đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PwaRegister;
