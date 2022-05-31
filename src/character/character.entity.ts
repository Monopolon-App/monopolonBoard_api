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
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  erc721?: string;

  @Column({ default: null })
  tokenId?: number;

  @Column({ default: null })
  helmet?: number;

  @Column({ default: null })
  armor?: number;

  @Column({ default: null })
  shoes?: number;

  @Column({ default: null })
  weapon?: number;

  @Column({ default: null })
  wings?: number;

  @Column({ default: null })
  str?: Double;

  @Column({ default: null })
  dex?: Double;

  @Column({ default: null })
  Luk?: Double;

  @Column({ default: null })
  prep?: Double;

  @Column({ default: null })
  hp?: Double;

  @Column({ default: null })
  mp?: Double;
}
