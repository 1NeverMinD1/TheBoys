import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { ClubsModule } from '../clubs/clubs.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ClubAdminGuard } from './club-admin.guard';

@Module({
  imports: [ClubsModule, BookingsModule],
  controllers: [AdminController],
  providers: [AdminService, ClubAdminGuard],
})
export class AdminModule {}
