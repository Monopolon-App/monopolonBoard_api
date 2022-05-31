import { UsersModule } from '../transaction.module';
import { TeamService } from '../transaction.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transaction.entity';

describe('', () => {
  let userService: TeamService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forFeature([Transaction])],
    }).compile();

    userService = moduleRef.get<TeamService>(TeamService);
  });

  it('monthToDays', () => {
    const result = userService.monthToDays(12);
    expect(result).toBe(360);
  });
});
