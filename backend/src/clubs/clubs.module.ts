import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { Club } from './entities/club.entity';
import { Seat } from './entities/seat.entity';
import { Tariff } from './entities/tariff.entity';
import { Zone } from './entities/zone.entity';
import { OccupancyService } from './occupancy.service';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Club, Zone, Tariff, Seat])],
  controllers: [ClubsController, SeatsController],
  providers: [ClubsService, SeatsService, OccupancyService],
  exports: [ClubsService, OccupancyService, TypeOrmModule],
})
export class ClubsModule {}
