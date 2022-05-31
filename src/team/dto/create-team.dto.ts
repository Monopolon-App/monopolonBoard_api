import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class TeamDto {
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
  totalStr?: Double;

  @ApiProperty({ required: false })
  totalDex?: Double;

  @ApiProperty({ required: false })
  totalLuk?: Double;

  @ApiProperty({ required: false })
  totalPrep?: Double;

  @ApiProperty({ required: false })
  totalHp?: Double;

  @ApiProperty({ required: false })
  totalMp?: Double;
}
