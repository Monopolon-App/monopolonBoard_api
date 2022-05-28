import { UsersModule } from '../usersprofile.module';
import { UsersProfileService } from '../usersprofile.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersProfile } from '../usersprofile.entity';

describe('', () => {
  let userService: UsersProfileService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forFeature([UsersProfile])],
    }).compile();

    userService = moduleRef.get<UsersProfileService>(UsersProfileService);
  });

  it('monthToDays', () => {
    const result = userService.monthToDays(12);
    expect(result).toBe(360);
  });
});
