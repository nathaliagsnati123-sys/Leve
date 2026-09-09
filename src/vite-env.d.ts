/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  fbq?: (...args: any[]) => void;
  _fbq?: any;
}
