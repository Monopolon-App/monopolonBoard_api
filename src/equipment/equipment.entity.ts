import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Double,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity

export enum EquipmentStatusType {
  EQUIPPED = 'Equipped',
  UNEQUIPPED = 'Unequipped',
  REMOVED = 'Removed',
}

@Entity()
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  erc721?: string;

  @Column({ default: null })
  tokenId?: string;

  @Column({ default: null })
  walletAddress?: string;

  @Column({ default: null })
  charequiped?: string;

  @Column({ default: null })
  category?: string;

  @Column({ default: null })
  str?: string;

  @Column({ default: null })
  dex?: string;

  @Column({ default: null })
  Luk?: string;

  @Column({ default: null })
  prep?: string;

  @Column({ default: null })
  hp?: string;

  @Column({ default: null })
  mp?: string;

  @Column({ default: null })
  status?: string;

  @Column({ default: null })
  thumburl?: string;

  @Column({ default: null })
  logInfo?: string;

  @Column({ default: null })
  characterId?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
