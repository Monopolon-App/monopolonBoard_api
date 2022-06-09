import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class EquipmentDto {
  @ApiProperty({ required: false })
  erc721?: string;

  @ApiProperty({ required: false })
  tokenId?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;

  @ApiProperty({ required: false })
  charequiped?: string;

  @ApiProperty({ required: false })
  str?: string;

  @ApiProperty({ required: false })
  dex?: string;

  @ApiProperty({ required: false })
  Luk?: string;

  @ApiProperty({ required: false })
  prep?: string;

  @ApiProperty({ required: false })
  hp?: string;

  @ApiProperty({ required: false })
  mp?: string;

  @ApiProperty({ required: false })
  status?: string;
}
