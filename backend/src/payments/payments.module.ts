import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentsController } from './payments.controller';
import { PaymentsCoreModule } from './payments-core.module';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PaymentsCoreModule, BookingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
