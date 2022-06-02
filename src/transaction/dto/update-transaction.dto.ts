import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateTransactionDto {
  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  amount?: string;

  @ApiProperty({ required: false })
  userId?: number;
}
