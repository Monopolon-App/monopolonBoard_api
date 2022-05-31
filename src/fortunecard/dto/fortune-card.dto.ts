import { ApiProperty } from '@nestjs/swagger';
import { Double } from 'typeorm';

export class TeamDto {
  @ApiProperty({ required: false })
  description?: string;
}
