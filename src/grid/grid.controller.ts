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

import { Grid } from './grid.entity';
import { UpdateGridDto } from './dto/update-grid.dto';

import { GridService } from './grid.service';

@ApiTags('grid')
@Controller('grid')
export class GridController {
  constructor(private readonly gridService: GridService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getUserById')
  getUserById(@Query('id') id: number): Promise<any> {
    return this.gridService.getUserById(id);
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

  @Patch(':id')
  updateGrid(
    @Param('id') userId: number,
    @Body() updategridDto: UpdateGridDto
  ) {
    return this.gridService.updateGrid(userId, updategridDto);
  }
}
