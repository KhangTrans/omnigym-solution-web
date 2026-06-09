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

export interface Transaction {
  id: number;
  customer_subscription_id: number;
  amount: string | number;
  payment_method: string;
  transaction_status: 'pending' | 'paid' | 'cancelled';
  payment_time?: string;
  checkout_url?: string;
  payment_link_id?: string;
  created_at: string;
  updated_at: string;
  customer_subscription?: CustomerSubscription;
}

export const paymentsApi = {
  checkoutMembership: (packageId: number) => {
    return api.post<CheckoutResponse>('/payments/checkout-membership', { packageId });
  },

  getTransactionStatus: (transactionId: number) => {
    return api.get<Transaction>(`/payments/status/${transactionId}`);
  },
};
