import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ChargeInput, ChargeResult, PaymentGateway } from './payment-gateway';

/**
 * Dev/test payment provider. Always succeeds unless amountCents === 13
 * (use $0.13 to simulate a decline in demos).
 */
@Injectable()
export class SimulatedPaymentGateway implements PaymentGateway {
  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (input.amountCents === 13) {
      return {
        success: false,
        paymentRef: '',
        message: 'Simulated payment declined',
      };
    }

    return {
      success: true,
      paymentRef: `sim_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      message: 'Simulated payment succeeded',
    };
  }
}
