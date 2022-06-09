import { UsersModule } from '../equipment.module';
import { TeamService } from '../fortune-card.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../equipment.entity';

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
