import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateWithdrawalDto {
  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  amount?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;
}
