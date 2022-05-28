import { PlayEarningModule } from '../playerearning.module';
import { PlayerEarningService } from '../playerearning.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEarning } from '../playerearning.entity';

describe('', () => {
  let playseearningService: PlayerEarningService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PlayEarningModule, TypeOrmModule.forFeature([PlayerEarning])],
    }).compile();

    playseearningService = moduleRef.get<PlayerEarningService>(PlayerEarningService);
  });

  it('monthToDays', () => {
    const result = playseearningService.monthToDays(12);
    expect(result).toBe(360);
  });
});
