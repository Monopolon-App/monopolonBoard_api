import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ErrorEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ default: null })
  errorCode?: string;

  @Column({ type: 'timestamp' })
  timeStamp?: Date;

  @Column({ default: null })
  message?: string;

  @Column({ default: null })
  stackTrace?: string;
}
