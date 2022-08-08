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
export class WanderingMerchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  tokenId?: string;

  @Column({ default: null })
  price?: string;

  @Column({ default: null })
  discountedPrice?: string;

  @Column({ default: 0 })
  status?: number;

  @Column({ default: null })
  imageURL?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
