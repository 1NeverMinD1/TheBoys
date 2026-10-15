import { IsIn, IsOptional, Matches } from 'class-validator';

export class AdminBookingsQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date должен быть в формате YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsIn(['pending_payment', 'confirmed', 'cancelled', 'expired'])
  status?: string;
}
