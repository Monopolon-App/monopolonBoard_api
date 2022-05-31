import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class hqDto {
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
  str?: Double;

  @ApiProperty({ required: false })
  dex?: Double;

  @ApiProperty({ required: false })
  Luk?: Double;

  @ApiProperty({ required: false })
  prep?: Double;

  @ApiProperty({ required: false })
  hp?: Double;

  @ApiProperty({ required: false })
  mp?: Double;
}
