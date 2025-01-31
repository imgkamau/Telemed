export const checkPWASupport = () => {
  // Check if service worker is supported
  if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker is supported');
  } else {
    console.warn('❌ Service Worker is not supported');
  }

  // Check if app can be installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ App is already installed');
  } else {
    console.log('📱 App can be installed');
  }
}; 