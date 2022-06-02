import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Double,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

@Entity()
export class EnterGame {
  @PrimaryGeneratedColumn()
  id: number;

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
