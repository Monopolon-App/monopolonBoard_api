import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateGridDto {
  @ApiProperty({ required: false })
  gameID?: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;
}
