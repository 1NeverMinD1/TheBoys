import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { MockPaymentProvider } from './providers/mock.provider';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { RefundService } from './refund.service';

/** «Низкоуровневая» часть оплаты: провайдер + возвраты. Без зависимостей от броней. */
@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      // Здесь выбирается провайдер по PAYMENT_PROVIDER из .env.
      // Подключая реальный — добавь сюда case 'kaspi': return new KaspiProvider(...)
      useFactory: (config: ConfigService) => {
        const name = config.get('PAYMENT_PROVIDER', 'mock');
        switch (name) {
          case 'mock':
            return new MockPaymentProvider();
          default:
            throw new Error(`Неизвестный PAYMENT_PROVIDER: ${name}`);
        }
      },
    },
    RefundService,
  ],
  exports: [PAYMENT_PROVIDER, RefundService, TypeOrmModule],
})
export class PaymentsCoreModule {}
