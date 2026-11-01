import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import {
  ReturnRequest,
  ReturnRequestSchema,
} from './schemas/return-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
