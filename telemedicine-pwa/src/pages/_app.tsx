import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../styles/theme';
import { useEffect } from 'react';
import { ChatProvider } from '../contexts/ChatContext';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('ServiceWorker registration successful');
          },
          function(err) {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('../utils/pwaTest').then(({ checkPWASupport }) => {
        checkPWASupport();
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ChatProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default MyApp;