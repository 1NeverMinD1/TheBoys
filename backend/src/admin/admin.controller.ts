import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { AdminService } from './admin.service';
import { ClubAdminGuard } from './club-admin.guard';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { UpdateClubDto } from './dto/club.dto';
import { UpdateLayoutDto } from './dto/layout.dto';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';
import { CreateZoneDto, UpdateZoneDto } from './dto/zone.dto';

/**
 * Кабинет клуба. Guards выполняются по порядку:
 *  JwtAuthGuard  — пользователь вошёл
 *  ClubAdminGuard — он админ именно клуба :clubId
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ClubAdminGuard)
@Controller('admin/clubs')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Клубы, которыми управляет текущий админ */
  @Get()
  myClubs(@CurrentUser() user: User) {
    return this.admin.myClubs(user);
  }

  @Patch(':clubId')
  updateClub(@Param('clubId') clubId: string, @Body() dto: UpdateClubDto) {
    return this.admin.updateClub(clubId, dto);
  }

  // --- Зоны ---
  @Post(':clubId/zones')
  createZone(@Param('clubId') clubId: string, @Body() dto: CreateZoneDto) {
    return this.admin.createZone(clubId, dto);
  }

  @Patch(':clubId/zones/:zoneId')
  updateZone(@Param('clubId') clubId: string, @Param('zoneId') zoneId: string, @Body() dto: UpdateZoneDto) {
    return this.admin.updateZone(clubId, zoneId, dto);
  }

  @Delete(':clubId/zones/:zoneId')
  deleteZone(@Param('clubId') clubId: string, @Param('zoneId') zoneId: string) {
    return this.admin.deleteZone(clubId, zoneId);
  }

  // --- Тарифы ---
  @Post(':clubId/zones/:zoneId/tariffs')
  createTariff(@Param('clubId') clubId: string, @Param('zoneId') zoneId: string, @Body() dto: CreateTariffDto) {
    return this.admin.createTariff(clubId, zoneId, dto);
  }

  @Patch(':clubId/zones/:zoneId/tariffs/:tariffId')
  updateTariff(
    @Param('clubId') clubId: string,
    @Param('zoneId') zoneId: string,
    @Param('tariffId') tariffId: string,
    @Body() dto: UpdateTariffDto,
  ) {
    return this.admin.updateTariff(clubId, zoneId, tariffId, dto);
  }

  @Delete(':clubId/zones/:zoneId/tariffs/:tariffId')
  deleteTariff(@Param('clubId') clubId: string, @Param('zoneId') zoneId: string, @Param('tariffId') tariffId: string) {
    return this.admin.deleteTariff(clubId, zoneId, tariffId);
  }

  // --- Места / схема зала ---
  @Get(':clubId/zones/:zoneId/layout')
  getLayout(@Param('clubId') clubId: string, @Param('zoneId') zoneId: string) {
    return this.admin.getLayout(clubId, zoneId);
  }

  @Put(':clubId/zones/:zoneId/layout')
  updateLayout(@Param('clubId') clubId: string, @Param('zoneId') zoneId: string, @Body() dto: UpdateLayoutDto) {
    return this.admin.updateLayout(clubId, zoneId, dto);
  }

  // --- Брони ---
  /** ?date=2026-10-15&status=confirmed — оба фильтра необязательны */
  @Get(':clubId/bookings')
  bookings(@Param('clubId') clubId: string, @Query() query: AdminBookingsQueryDto) {
    return this.admin.listBookings(clubId, query);
  }

  /** Подтвердить без онлайн-оплаты (оплатили на кассе) */
  @Post(':clubId/bookings/:bookingId/confirm')
  @HttpCode(200)
  confirm(@Param('clubId') clubId: string, @Param('bookingId') bookingId: string) {
    return this.admin.confirmBooking(clubId, bookingId);
  }

  @Post(':clubId/bookings/:bookingId/cancel')
  @HttpCode(200)
  cancel(@Param('clubId') clubId: string, @Param('bookingId') bookingId: string) {
    return this.admin.cancelBooking(clubId, bookingId);
  }
}
