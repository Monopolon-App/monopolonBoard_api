import { ApiProperty } from '@nestjs/swagger';

export class UpdateWithdrawalHistoryDto {
  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  amount?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;

  @ApiProperty({ required: false })
  logInfo?: string;
}
