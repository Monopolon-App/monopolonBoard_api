import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  userName?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  password?: string;

  @ApiProperty({ required: false })
  profileImage?: string;

  @ApiProperty({ required: false })
  walletAddress?: string;

  @ApiProperty({ required: false })
  teamID?: number;

  @ApiProperty({ required: false })
  mgmRewardsAccumulated?: string;

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
  CurrentSelectedNFT?: string;

  @ApiProperty({ required: false })
  gridPosition?: number;

  @ApiProperty({ required: false })
  LastMinTime?: string;
}
