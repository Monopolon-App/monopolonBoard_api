import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Withdrawal } from '../withdrawal/withdrawal.entity';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

@Entity()
export class WithdrawalHistory {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ default: null })
  userId?: string;

  @Column({ default: null })
  amount?: string;

  @Column({ default: null })
  status?: string;

  @Column({ default: null })
  walletAddress?: string;

  @ManyToOne(() => Withdrawal, (withdrawal) => withdrawal.withdrawalHistory)
  withdrawal?: Withdrawal;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;
}
