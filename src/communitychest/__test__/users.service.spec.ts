import { UsersModule } from '../community.module';
import { TeamService } from '../community.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from '../community.entity';

describe('', () => {
  let userService: TeamService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forFeature([Community])],
    }).compile();

    userService = moduleRef.get<TeamService>(TeamService);
  });

  it('monthToDays', () => {
    const result = userService.monthToDays(12);
    expect(result).toBe(360);
  });
});
