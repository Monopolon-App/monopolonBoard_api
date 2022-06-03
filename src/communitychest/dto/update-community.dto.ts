import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommunityDto {
  @ApiProperty({ required: false })
  userId?: number;

  @ApiProperty({ required: false })
  slot1?: number;

  @ApiProperty({ required: false })
  slot2?: number;

  @ApiProperty({ required: false })
  slot3?: number;

  @ApiProperty({ required: false })
  slot4?: number;

  @ApiProperty({ required: false })
  slot5?: number;

  @ApiProperty({ required: false })
  totalStr?: string;

  @ApiProperty({ required: false })
  totalDex?: string;

  @ApiProperty({ required: false })
  totalLuk?: string;

  @ApiProperty({ required: false })
  totalPrep?: string;

  @ApiProperty({ required: false })
  totalHp?: string;

  @ApiProperty({ required: false })
  totalMp?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;
}
