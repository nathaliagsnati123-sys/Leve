// ============================================================================
// Meta (Facebook) Pixel Helper - LEVE
// Pixel ID: 1455824446406523
// ============================================================================

export const META_PIXEL_ID = '1455824446406523';

/**
 * Dispara evento padrão do Meta Pixel com segurança
 */
export function trackPixelEvent(
  eventName: 'PageView' | 'InitiateCheckout' | 'Purchase' | 'Lead' | 'CompleteRegistration' | 'ViewContent' | 'Contact' | string,
  parameters?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.fbq === 'function') {
      if (parameters) {
        window.fbq('track', eventName, parameters);
      } else {
        window.fbq('track', eventName);
      }
    }
  } catch (error) {
    console.debug('[Pixel] Failed to track event:', eventName, error);
  }
}

/**
 * Dispara evento customizado do Meta Pixel
 */
export function trackPixelCustom(
  customEventName: string,
  parameters?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.fbq === 'function') {
      if (parameters) {
        window.fbq('trackCustom', customEventName, parameters);
      } else {
        window.fbq('trackCustom', customEventName);
      }
    }
  } catch (error) {
    console.debug('[Pixel] Failed to track custom event:', customEventName, error);
  }
}

/**
 * Dispara visualização de tela / aba no app
 */
export function trackPixelPageView(viewName?: string): void {
  if (viewName) {
    trackPixelEvent('PageView', { content_name: viewName });
    trackPixelCustom('ScreenView', { screen: viewName });
  } else {
    trackPixelEvent('PageView');
  }
}
