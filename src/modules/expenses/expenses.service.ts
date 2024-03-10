import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Expense, ExpenseDocument } from 'src/schemas/expense.schema';
import mongoose, { Model } from 'mongoose';
import * as csv from 'csvtojson';
import { format, lastDayOfMonth } from 'date-fns';
import { QueryFilter } from 'src/utils/query-filter/query-filter';
@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expensesModel: Model<ExpenseDocument>,
    private readonly queryFilter: QueryFilter,
  ) {}

  private handleCompetence(competence: string) {
    const firstDayOfCompetence = new Date(competence + '-01 00:00:00');
    const lastDayOfCompetence = lastDayOfMonth(
      new Date(competence + '-01 00:00:00').setHours(59, 59, 59, 999),
    );

    return { firstDayOfCompetence, lastDayOfCompetence };
  }

  create(createExpenseDto: CreateExpenseDto, userId: string) {
    return this.expensesModel.create({ ...createExpenseDto, user: userId });
  }

  findAll(userId: string, filters: any, queryParams: any) {
    const user = new mongoose.Types.ObjectId(userId);

    return this.queryFilter.findAll({
      queryParams,
      model: this.expensesModel,
      filters: { ...filters, user },
      searchFields: ['description'],
    });
  }

  async allSingle(userId: string, competence: string, queryParams: any) {
    const { firstDayOfCompetence, lastDayOfCompetence } =
      this.handleCompetence(competence);

    const filters = {
      date: { $gte: firstDayOfCompetence, $lte: lastDayOfCompetence },
      type: 'SINGLE',
    };

    const result = await this.findAll(userId, filters, queryParams);
    result.data = result.data.map((item: any) => ({ ...item, status: 'PAID' }));
    return result;
  }

  async allFixed(
    userId: string,
    competence = format(new Date(), 'yyyy-MM'),
    queryParams: any,
  ) {
    const { firstDayOfCompetence, lastDayOfCompetence } =
      this.handleCompetence(competence);

    const filters = {
      $or: [
        { endedAt: { $exists: false } },
        { endedAt: { $gte: firstDayOfCompetence } },
      ],
      date: { $lte: lastDayOfCompetence },
      active: true,
      type: 'FIXED',
    };

    const result = await this.findAll(userId, filters, queryParams);
    for (const item of result.data) {
      const hasPayment = item.payments.find(
        (payment) =>
          payment.date >= firstDayOfCompetence &&
          payment.date <= lastDayOfCompetence,
      );

      console.log(hasPayment);

      item.status = hasPayment ? 'PAID' : 'PENDING';
    }

    return result;
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
    const user = new mongoose.Types.ObjectId(userId);
    const { firstDayOfCompetence, lastDayOfCompetence } =
      this.handleCompetence(competence);

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

  async pay(id: string, userId: string, competence: string) {
    const expense = await this.findOne(id, userId);
    const { firstDayOfCompetence, lastDayOfCompetence } =
      this.handleCompetence(competence);
    const hasPayment = expense.payments.find(
      (payment) =>
        payment.date >= firstDayOfCompetence &&
        payment.date < lastDayOfCompetence,
    );

    if (hasPayment) {
      throw new HttpException(
        'Esta despesa já foi paga no mês informado.',
        HttpStatus.FORBIDDEN,
      );
    }

    expense.payments.push({ date: firstDayOfCompetence });
    await expense.save();

    return expense;
  }
}
