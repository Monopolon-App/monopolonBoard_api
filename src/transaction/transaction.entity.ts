import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

export enum TransactionType {
  WITHDRAWAL = 'withdrawal',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  description?: string;

  @Column({ default: null })
  amount?: string;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  fromAddress?: string;

  @Column({ default: null })
  userId?: number;

  /**
   * either it can be withrawal or any other in the future
   */
  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.WITHDRAWAL,
  })
  type: TransactionType;

  @Column({ default: null })
  hash?: string;

  @Column({ default: null })
  logInfo?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
