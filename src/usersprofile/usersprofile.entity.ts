import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity
import { Character } from '../character/character.entity';

@Entity()
export class UsersProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  firstName?: string;

  @Column({ default: null })
  lastName?: string;

  @Column({ default: null })
  userName?: string;

  @Column({ default: null })
  email?: string;

  @Column({ default: null })
  password?: string;

  @Column({ default: null })
  profileImage?: string;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  teamID?: number;

  @Column({ default: null })
  mgmRewardsAccumulated?: string;

  @Column({ type: 'timestamp' })
  lastRollTimeStamp?: Date;

  @Column({ default: null })
  noOfRoll?: number;

  @Column({ type: 'timestamp' })
  lastActionTimeStamp?: Date;

  @Column({ default: null })
  cCEffect?: number;

  @Column({ default: null })
  fEffect?: number;

  @Column({ default: null })
  enterGameStatus?: number;

  @Column({ default: null })
  gridPosition?: number;

  @OneToMany(() => Character, (character) => character.usersProfile)
  character: Character[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
