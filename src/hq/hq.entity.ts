import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Double,
  OneToMany,
} from 'typeorm';
import { Team } from '../team/team.entity';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

@Entity()
export class Hq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  userId?: number;

  @Column({ default: null })
  hqGridPosition?: number;

  @Column({ default: null })
  status?: number;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  logInfo?: string;

  @OneToMany(() => Team, (team) => team.hq)
  team?: Team[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
