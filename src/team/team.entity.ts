import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Double,
  ManyToOne,
} from 'typeorm';
import { Hq } from '../hq/hq.entity';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({ default: null })
  // userId?: number;

  // TODO: User walletAddress
  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  slot1?: number;

  @Column({ default: null })
  slot2?: number;

  @Column({ default: null })
  slot3?: number;

  @Column({ default: null })
  slot4?: number;

  @Column({ default: null })
  slot5?: number;

  @Column({ default: null })
  totalStr?: string;

  @Column({ default: null })
  totalDex?: string;

  @Column({ default: null })
  totalLuk?: string;

  @Column({ default: null })
  totalPrep?: string;

  @Column({ default: null })
  totalHp?: string;

  @Column({ default: null })
  totalMp?: string;

  @Column({ default: null })
  logInfo?: string;

  @ManyToOne(() => Hq, (hq) => hq.team)
  hq?: Hq;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
