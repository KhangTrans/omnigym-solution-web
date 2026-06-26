import api from './axios';

export interface CheckoutResponse {
  message: string;
  checkoutUrl: string;
  transactionId: number;
  orderCode: number;
}

export interface CustomerSubscription {
  id: number;
  customer_id: number;
  membership_id: number;
  status: 'pending' | 'active' | 'cancelled';
  start_date?: string;
  end_date?: string;
}

export interface CustomerTrainerPackage {
  id: number;
  customer_id: number;
  trainer_package_id: number;
  trainer_id: number;
  total_sessions: number;
  remaining_sessions: number;
  status: string;
  trainer_package?: {
    id: number;
    package_name: string;
    session_count: number;
  };
  trainer?: {
    id: number;
    user?: {
      full_name: string;
    };
  };
}

export interface Transaction {
  id: number;
  customer_subscription_id?: number;
  customer_trainer_package_id?: number;
  amount: string | number;
  payment_method: string;
  transaction_status: 'pending' | 'paid' | 'cancelled';
  payment_time?: string;
  checkout_url?: string;
  payment_link_id?: string;
  created_at: string;
  updated_at: string;
  customer_subscription?: CustomerSubscription;
  customer_trainer_package?: CustomerTrainerPackage;
}

export const paymentsApi = {
  checkoutMembership: (packageId: number) => {
    return api.post<CheckoutResponse>('/payments/checkout-membership', { packageId });
  },

  checkoutTrainerPackage: (trainerId: number, packageId: number) => {
    return api.post<CheckoutResponse>('/payments/checkout-trainer-package', { trainerId, packageId });
  },

  checkoutSlot: (trainerId: number, date: string, time: string) => {
    return api.post<CheckoutResponse>('/payments/checkout-slot', { trainerId, date, time });
  },

  getTransactionStatus: (transactionId: number) => {
    return api.get<Transaction>(`/payments/status/${transactionId}`);
  },
};
