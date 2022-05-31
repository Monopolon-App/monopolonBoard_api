import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateTransactionDto {
  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  amount?: Double;

  @ApiProperty({ required: false })
  userId?: number;
}
