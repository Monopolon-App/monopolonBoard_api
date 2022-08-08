import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
  Request,
  Put,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Withdrawal } from './withdrawal.entity';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';

import { WithdrawalService } from './withdrawal.service';

@ApiTags('withdrawal')
@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.withdrawalService.getUserById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createWithdrawal(
    @Body() withdrawal: Withdrawal,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.withdrawalService.createWithdrawal(withdrawal, files);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':walletAddress')
  updateWithdrawal(
    @Param('walletAddress') walletAddress: string,
    @Body() updatewithdrawalDto: UpdateWithdrawalDto
  ) {
    return this.withdrawalService.updateWithdrawal(
      walletAddress,
      updatewithdrawalDto
    );
  }
}
