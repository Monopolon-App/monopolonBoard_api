import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

@Entity()
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  userId?: string;

  @Column({ default: null })
  amount?: string;

  @Column({ default: null })
  status?: string;

  @Column({ default: null })
  walletAddress?: string;

  // @Column({ default: null })
  // reason?: string;

  @Column({ default: null })
  hash?: string;
}
