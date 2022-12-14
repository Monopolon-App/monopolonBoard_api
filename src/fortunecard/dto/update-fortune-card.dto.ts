import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateFortuneDto {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;

  @ApiProperty({ required: false })
  logInfo?: string;
}
