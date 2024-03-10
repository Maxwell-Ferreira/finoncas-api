import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ExpenseType } from 'src/@types/expense-type.type';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsEnum(Object.keys(ExpenseType))
  type: ExpenseType;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsDate()
  endedAt?: Date;
}
