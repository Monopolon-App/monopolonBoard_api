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
  Generated,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity
import { Character } from '../character/character.entity';
import { Hq } from '../hq/hq.entity';

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

  @Column({ unique: true })
  walletAddress?: string;

  // increase the TeamId by 1
  @Column()
  teamId?: number;

  @Column({ default: 0 })
  mlonRewardsAccumulated?: string;

  @Column({ type: 'timestamp' })
  lastRollTimeStamp?: Date;

  @Column({ default: 1 })
  noOfRoll?: number;

  @Column({ type: 'timestamp' })
  lastActionTimeStamp?: Date;

  @Column({ default: 0 })
  cCEffect?: number;

  @Column({ default: 0 })
  fEffect?: number;

  @Column({ default: null })
  enterGameStatus?: number;

  @Column({ default: 0 })
  gridPosition?: number;

  @Column({ default: null })
  CurrentSelectedNFT?: string;

  @Column({ default: null })
  LastMinTime?: string;

  @Column({ default: 1, nullable: true })
  noOfLastAction?: number;

  @OneToMany(() => Character, (character) => character.usersProfile)
  character: Character[];

  @Column({
    nullable: true,
    default: null,
  })
  public currentHashedRefreshToken?: string;

  @Column({ default: null })
  logInfo?: string;

  @ManyToOne(() => Hq, (hq) => hq.team)
  hq?: Hq;

  @Column({ default: null })
  gameType?: string;

  @Column({ default: 0 })
  noOfLooting?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({
    nullable: true,
    default: null,
  })
  public lastLoginAttemptToken?: string;
}
