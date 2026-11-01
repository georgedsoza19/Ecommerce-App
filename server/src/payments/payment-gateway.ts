export type ChargeInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
};

export type ChargeResult = {
  success: boolean;
  paymentRef: string;
  message?: string;
};

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
