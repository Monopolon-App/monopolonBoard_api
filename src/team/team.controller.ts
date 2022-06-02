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

import { Team } from './team.entity';
import { UpdateTeamDto } from './dto/update-team.dto';

import { TeamService } from './team.service';

@ApiTags('Team')
@Controller('Team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // @UseGuards(JwtAuthGuard)
  @Get('/getTeamById')
  getTeamById(@Query('id') id: number): Promise<any> {
    return this.teamService.getTeamById(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/create')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FilesInterceptor('file'))
  createTeam(
    @Body() team: Team,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    return this.teamService.createTeam(team, files);
  }

  @Patch(':id')
  updateTeam(
    @Param('id') userId: number,
    @Body() updateteamDto: UpdateTeamDto
  ) {
    return this.teamService.updateTeam(userId, updateteamDto);
  }
}
