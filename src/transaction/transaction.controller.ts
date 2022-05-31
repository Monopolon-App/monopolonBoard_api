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

import { Transaction } from './transaction.entity';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

import { TeamService } from './transaction.service';

@ApiTags('transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly hqService: TeamService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/geTransactionById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.hqService.getTransactionById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createTransaction(
    @Body() userprofile: Transaction,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    console.log('files==========', files);
    return this.hqService.createTransaction(userprofile, files);
  }

  @Patch(':id')
  updateTransaction(
    @Param('id') userId: number,
    @Body() updatetransactionDto: UpdateTransactionDto
  ) {
    return this.hqService.updateTransaction(userId, updatetransactionDto);
  }
}
