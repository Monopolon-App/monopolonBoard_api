import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

export enum TransferType {
  NFT_TRANSFER = 'nftTransfer',
}

@Entity()
export class TransferLogs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  description?: string;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  fromAddress?: string;

  @Column({
    type: 'enum',
    enum: TransferType,
  })
  type: TransferType;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
