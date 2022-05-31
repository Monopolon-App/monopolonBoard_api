import { UsersModule } from '../team.module';
import { TeamService } from '../team.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../team.entity';

describe('', () => {
  let userService: TeamService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forFeature([Character])],
    }).compile();

    userService = moduleRef.get<TeamService>(TeamService);
  });

  it('monthToDays', () => {
    const result = userService.monthToDays(12);
    expect(result).toBe(360);
  });
});
