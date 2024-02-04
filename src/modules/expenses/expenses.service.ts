import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Expense, ExpenseDocument } from 'src/schemas/expense.schema';
import { Model } from 'mongoose';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expensesModel: Model<ExpenseDocument>,
  ) {}

  create(createExpenseDto: CreateExpenseDto, userId: string) {
    return this.expensesModel.create({ ...createExpenseDto, user: userId });
  }

  findAll() {
    return this.expensesModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string, userId: string) {
    const expense = await this.expensesModel.findOne({ _id: id, user: userId });
    if (!expense) throw new NotFoundException();
    return expense;
  }

  async update(id: string, userId: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id, userId);
    return this.expensesModel.findOneAndUpdate(
      { _id: expense._id },
      updateExpenseDto,
    );
  }

  remove(id: number) {
    return `This action removes a #${id} expense`;
  }
}
