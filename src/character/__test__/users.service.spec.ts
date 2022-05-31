import { UsersModule } from '../character.module';
import { CharacterService } from '../character.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../character.entity';

describe('', () => {
  let userService: CharacterService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forFeature([Character])],
    }).compile();

    userService = moduleRef.get<CharacterService>(CharacterService);
  });

  it('monthToDays', () => {
    const result = userService.monthToDays(12);
    expect(result).toBe(360);
  });
});
