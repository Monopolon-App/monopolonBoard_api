import { UsersModule } from '../grid.module';
import { GridService } from '../grid.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grid } from '../grid.entity';

describe('', () => {
  let userService: GridService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forFeature([Grid])],
    }).compile();

    userService = moduleRef.get<GridService>(GridService);
  });

  it('monthToDays', () => {
    const result = userService.monthToDays(12);
    expect(result).toBe(360);
  });
});
