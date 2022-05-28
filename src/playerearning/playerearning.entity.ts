import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// this is need to be relative since after compile it will have different path: https://stackoverflow.com/questions/63865678/nestjs-test-suite-failed-to-run-cannot-find-module-src-article-article-entity


@Entity()
export class PlayerEarning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: null })
  goldcoins?: string;

  @Column({ default: null })
  silvercoins?: string;

  @Column({ default: null })
  coppercoins?: string;

  @Column({ default: null })
  totalpoints?: number;

  @Column({ default: null })
  locationofplayer?: string;

  @Column({ default: null })
  numberofdice?: string;

  @Column({ default: null })
  numberoinvaded?: string;

  @Column({ default: null })
  invadedcoins?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
  
}
