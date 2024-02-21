import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Expense, ExpenseDocument } from 'src/schemas/expense.schema';
import mongoose, { Model } from 'mongoose';
import * as csv from 'csvtojson';
import { format, lastDayOfMonth } from 'date-fns';
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
      { new: true },
    );
  }

  async remove(id: string, userId: string) {
    const expense = await this.findOne(id, userId);
    await this.expensesModel.deleteOne({ _id: expense._id });
  }

  async uploadFile(userId: string, file: Express.Multer.File) {
    const data = await csv({ delimiter: ',' }).fromString(
      file.buffer.toString(),
    );

    for (const item of data) {
      const amount = Number(item.Valor);
      if (amount > 0) continue;

      const rawDate: string = item.Data;
      const formatedDate = rawDate.split('/').reverse().join('-');

      const date = new Date(formatedDate + ' 00:00:00');

      await this.expensesModel.updateOne(
        { externalId: item.Identificador },
        {
          user: userId,
          type: 'SINGLE',
          amount: -amount,
          description: item['Descrição'],
          date,
          externalId: item.Identificador,
          payments: [{ date }],
        },
        { upsert: true },
      );
    }
  }

  async resume(
    userId: string,
    competence: string = format(new Date(), 'yyyy-MM'),
  ) {
    console.log(competence);

    const firstDayOfCompetence = new Date(competence + '-01 00:00:00');
    const lastDayOfCompetence = lastDayOfMonth(
      new Date(competence + '-01 00:00:00').setHours(59, 59, 59, 999),
    );

    const user = new mongoose.Types.ObjectId(userId);

    const totalSingle: number = await this.expensesModel
      .aggregate([
        {
          $match: {
            date: { $gte: firstDayOfCompetence, $lte: lastDayOfCompetence },
            type: 'SINGLE',
            user,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ])
      .then((result) => result[0]?.total || 0);

    const totalFixed: number = await this.expensesModel
      .aggregate([
        {
          $match: {
            $or: [
              { endedAt: { $exists: false } },
              {
                endedAt: {
                  $gte: firstDayOfCompetence,
                },
              },
            ],
            active: true,
            type: 'FIXED',
            user,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$amount',
            },
          },
        },
      ])
      .then((result) => result[0]?.total || 0);

    return {
      totalFixed,
      totalSingle,
      total: totalFixed + totalSingle,
    };
  }
}
