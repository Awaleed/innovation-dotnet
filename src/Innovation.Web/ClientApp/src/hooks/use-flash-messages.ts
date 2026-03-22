import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Listens to flash messages from server (props.flash)
 * and displays them as sonner toasts.
 *
 * Matches Laravel's session flash pattern:
 *   session()->flash('success', 'Done!')
 *   session()->flash('error', 'Failed!')
 *
 * In .NET: Inertia.Share("flash", new { success = "...", error = "..." })
 */
export function useFlashMessages() {
  const { flash } = usePage<SharedData>().props;

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash?.success, flash?.error]);
}
