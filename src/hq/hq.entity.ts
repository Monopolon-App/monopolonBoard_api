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
}
