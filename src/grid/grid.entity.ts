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
export class Grid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  gameID?: number;

  @Column({ default: null })
  description?: string;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  logInfo?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
