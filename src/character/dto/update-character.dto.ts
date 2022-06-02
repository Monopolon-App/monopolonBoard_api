import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateCharacterDto {
  @ApiProperty({ required: false })
  erc721?: string;

  @ApiProperty({ required: false })
  tokenId?: number;

  @ApiProperty({ required: false })
  helmet?: number;

  @ApiProperty({ required: false })
  armor?: number;

  @ApiProperty({ required: false })
  shoes?: number;

  @ApiProperty({ required: false })
  weapon?: number;

  @ApiProperty({ required: false })
  wings?: number;

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
}
