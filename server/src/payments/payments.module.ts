import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from './payment-gateway';
import { SimulatedPaymentGateway } from './simulated.gateway';

@Module({
  providers: [
    SimulatedPaymentGateway,
    {
      provide: PAYMENT_GATEWAY,
      useExisting: SimulatedPaymentGateway,
    },
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentsModule {}
