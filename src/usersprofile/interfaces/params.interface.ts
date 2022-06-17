import { ApiProperty } from '@nestjs/swagger';

export class IWalletAddress {
  @ApiProperty({
    name: 'walletAddress',
    example: '0x467aC5BA181b7ef22c654C5523B32B765443ac5E',
  })
  walletAddress?: string;
}

export class IUserId {
  @ApiProperty({ name: 'userId', example: 1 })
  userId?: number;
}
export class IReservedNFTBody {
  @ApiProperty({ required: true })
  reservedNFT: boolean;
}

export class IMythicNFTBody {
  @ApiProperty({ required: true })
  mythicNFT: number;
}

export class IPaginationParams {
  @ApiProperty({ default: 0 })
  offset?: number;

  @ApiProperty({ default: 10 })
  limit?: number;

  @ApiProperty({
    name: 'sort',
    enum: ['DESC', 'ASC'],
    required: false,
    default: 'ASC',
  })
  sort?: string;
}

export class IFilterParams {
  @ApiProperty({ name: 'userId', required: false })
  userId?: number;

  @ApiProperty({ name: 'referralCode', required: false })
  referralCode?: string;

  @ApiProperty({ name: 'walletAddress', required: false })
  walletAddress?: string;

  @ApiProperty({ name: 'createdAt', required: false })
  createdAt?: string;
}

export class registerUserParams {
  @ApiProperty({
    name: 'walletAddress',
    example: '0x467aC5BA181b7ef22c654C5523B32B765443ac5E',
    required: true,
  })
  walletAddress: string;

  @ApiProperty({ required: true })
  tokenId: number;
}
