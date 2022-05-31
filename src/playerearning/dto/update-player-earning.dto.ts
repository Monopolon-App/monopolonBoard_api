import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlayerEarningDto {
  @ApiProperty({ default: null })
  goldcoins?: string;

  @ApiProperty({ default: null })
  silvercoins?: string;

  @ApiProperty({ default: null })
  coppercoins?: string;

  @ApiProperty({ default: null })
  totalpoints?: number;

  @ApiProperty({ default: null })
  locationofplayer?: string;

  @ApiProperty({ default: null })
  numberofdice?: string;

  @ApiProperty({ default: null })
  numberoinvaded?: string;

  @ApiProperty({ default: null })
  invadedcoins?: string;
}
