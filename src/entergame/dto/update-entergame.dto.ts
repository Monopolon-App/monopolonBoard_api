import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class UpdateEnterGameDto {
  @ApiProperty({ required: false })
  walletAddress?: string;

  @ApiProperty({ required: false })
  teamID?: number;

  @ApiProperty({ required: false })
  mgmRewardsAccumulated?: Double;

  @ApiProperty({ required: false })
  lastRollTimeStamp?: Date;

  @ApiProperty({ required: false })
  noOfRoll?: number;

  @ApiProperty({ required: false })
  lastActionTimeStamp?: Date;

  @ApiProperty({ required: false })
  cCEffect?: number;

  @ApiProperty({ required: false })
  fEffect?: number;

  @ApiProperty({ required: false })
  enterGameStatus?: number;

  @ApiProperty({ required: false })
  gridPosition?: number;
}
