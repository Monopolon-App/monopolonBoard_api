import { ApiProperty } from '@nestjs/swagger';

export class CreateUserTreeDto {
  @ApiProperty({ name: 'walletAddress' })
  walletAddress: string;

  @ApiProperty({ name: 'parentId' })
  parentId?: number;
}
