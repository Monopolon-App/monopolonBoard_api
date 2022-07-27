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
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { WithdrawalHistory } from './withdrawalHistory.entity';
import { UpdateWithdrawalHistoryDto } from './dto/update-withdrawalHistory.dto';

import { WithdrawalHistoryService } from './withdrawalHistory.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('withdrawalHistory')
@Controller('withdrawalHistory')
export class WithdrawalHistoryController {
  constructor(
    private readonly withdrawalHistoryService: WithdrawalHistoryService
  ) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.withdrawalHistoryService.getWithdrawalHistoryByWalletAddress(
      walletAddress
    );
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  createWithdrawal(@Body() withdrawalHistory: WithdrawalHistory): Promise<any> {
    return this.withdrawalHistoryService.createWithdrawalHistory(
      withdrawalHistory
    );
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':walletAddress')
  updateWithdrawal(
    @Param('walletAddress') walletAddress: string,
    @Body() updateWithdrawalDto: UpdateWithdrawalHistoryDto
  ) {
    return this.withdrawalHistoryService.updateWithdrawalHistory(
      walletAddress,
      updateWithdrawalDto
    );
  }
}
