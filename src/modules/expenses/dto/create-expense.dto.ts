import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ExpenseType } from 'src/schemas/expense.schema';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsEnum(['FIXED', 'SINGLE'])
  type: ExpenseType;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;
}
