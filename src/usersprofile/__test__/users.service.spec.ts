import { UsersProfileModule } from '../usersprofile.module';
import { UsersProfileService } from '../usersprofile.service';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersProfile } from '../usersprofile.entity';

describe('', () => {
  let userProfileService: UsersProfileService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersProfileModule, TypeOrmModule.forFeature([UsersProfile])],
    }).compile();

    userProfileService =
      moduleRef.get<UsersProfileService>(UsersProfileService);
  });

  it('monthToDays', () => {
    //
  });
});
