import { IsString } from 'class-validator';

export class PayExpenseDto {
  @IsString()
  competence: string;
}
