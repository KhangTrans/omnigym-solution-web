import { toast } from "sonner";

/**
 * OmniGym Notification System
 * Centralized way to show messages to users
 */
export const notify = {
  /**
   * Show a success message (Green)
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description: description,
    });
  },

  /**
   * Show an error message (Red)
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description: description,
    });
  },

  /**
   * Show an information message (Blue)
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description: description,
    });
  },

  /**
   * Show a warning message (Yellow)
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description: description,
    });
  },

  /**
   * Show a loading toast that returns an ID to update later
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Update or dismiss a specific toast (useful for promises/loading)
   */
  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  }
};
