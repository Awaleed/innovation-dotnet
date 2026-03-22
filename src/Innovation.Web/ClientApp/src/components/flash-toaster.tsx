import { Toaster } from 'sonner';
import { useFlashMessages } from '@/hooks/use-flash-messages';

/**
 * Renders the sonner Toaster and listens for flash messages from the server.
 * Add this component once in the app setup (App.tsx or layout).
 */
export function FlashToaster() {
  useFlashMessages();

  return <Toaster position="top-right" richColors closeButton duration={5000} />;
}
