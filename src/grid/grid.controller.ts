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
  Inject,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Grid } from './grid.entity';
import { UpdateGridDto } from './dto/update-grid.dto';

import { GridService } from './grid.service';
import { WanderingMerchantService } from 'src/WanderingMerchant/wanderingMerchant.service';

@ApiTags('grid')
@Controller('grid')
export class GridController {
  @Inject(WanderingMerchantService)
  private wanderingMerchantService: WanderingMerchantService;

  constructor(private readonly gridService: GridService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('walletAddress') walletAddress: string): Promise<any> {
    return this.gridService.getUserById(walletAddress);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createGrid(
    @Body() grid: Grid,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.gridService.createGrid(grid, files);
  }

  @Patch(':walletAddress')
  updateGrid(
    @Param('walletAddress') walletAddress: string,
    @Body() updategridDto: UpdateGridDto
  ) {
    return this.gridService.updateGrid(walletAddress, updategridDto);
  }

  @Get('/getEventById')
  getEventByGridId(@Query('id') id: number): Promise<any> {
    return this.gridService.getEventByGridId(id);
  }
}
