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

import { Transaction, TransactionType } from './transaction.entity';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

import { TeamService } from './transaction.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly hqService: TeamService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/geTransactionById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.hqService.getTransactionById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createTransaction(
    @Body() userprofile: Transaction,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.hqService.createTransaction(userprofile, files);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':walletAddress')
  updateTransaction(
    @Param('walletAddress') walletAddress: string,
    @Body() updatetransactionDto: UpdateTransactionDto
  ) {
    return this.hqService.updateTransaction(
      walletAddress,
      updatetransactionDto
    );
  }

  // @UseGuards(JwtAuthGuard)
  @Get('/getLootingHistoryByWalletAddress')
  getLootingHistoryByWalletAddress(
    @Query('walletAddress') walletAddress: string,
    @Query('type') type: TransactionType
  ): Promise<any> {
    return this.hqService.getLootingHistoryByWalletAddress(walletAddress, type);
  }
}
