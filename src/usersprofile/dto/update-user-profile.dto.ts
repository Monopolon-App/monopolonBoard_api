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
}
