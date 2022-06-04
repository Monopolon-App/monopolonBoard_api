import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity
import { UsersProfile } from '../usersprofile/usersprofile.entity';

@Entity()
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  walletAddress?: string;

  // TODO: put all the contrac address
  @Column({ default: null })
  erc721?: string;

  @Column({ default: null })
  tokenId?: number;

  @Column({ default: null })
  helmet?: number;

  @Column({ default: null })
  armor?: number;

  @Column({ default: null })
  shoes?: number;

  @Column({ default: null })
  weapon?: number;

  @Column({ default: null })
  wings?: number;

  @Column({ default: null })
  str?: string;

  @Column({ default: null })
  dex?: string;

  @Column({ default: null })
  Luk?: string;

  @Column({ default: null })
  prep?: string;

  @Column({ default: null })
  hp?: string;

  @Column({ default: null })
  MarektPlaceID?: string;

  @Column({ default: null })
  ImageURL?: string;

  @Column({ default: null })
  ObjectURL?: string;

  @Column({ default: null })
  mp?: string;

  @Column({ default: null })
  usersProfileId?: number;

  @ManyToOne(() => UsersProfile, (usersProfile) => usersProfile.character)
  usersProfile?: UsersProfile;
}
