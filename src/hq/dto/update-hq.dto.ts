import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateHqDto {
  @ApiProperty({ required: false })
  userId?: number;

  @ApiProperty({ required: false })
  hqGridPosition?: number;

  @ApiProperty({ required: false })
  status?: number;

  @ApiProperty({ required: false })
  walletAddress?: string;
}
