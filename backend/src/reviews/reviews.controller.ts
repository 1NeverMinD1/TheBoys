import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('clubs/:clubId/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@Param('clubId') clubId: string) {
    return this.reviews.list(clubId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Param('clubId') clubId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user, clubId, dto);
  }

  /** Удалить свой отзыв (например, чтобы написать заново) */
  @Delete('my')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  removeMy(@CurrentUser() user: User, @Param('clubId') clubId: string) {
    return this.reviews.removeMy(user, clubId);
  }
}
