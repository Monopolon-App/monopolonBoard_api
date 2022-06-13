import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ObjectWithWalletAddress {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    required: true,
    description: 'Wallet address',
    example: '0x264D6BF791f6Be6F001A95e895AE0a904732d473',
  })
  walletAddress: string;
}
