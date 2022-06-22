import { ApiProperty } from '@nestjs/swagger';

export class WithdrawalHistoryDto {
  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  amount?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;

  @ApiProperty({ required: true })
  withdrawal: number;
}
