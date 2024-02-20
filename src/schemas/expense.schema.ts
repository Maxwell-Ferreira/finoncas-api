import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';
import { ExpenseType } from 'src/@types/expense-type.type';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: String, enum: Object.keys(ExpenseType), required: true })
  type: ExpenseType;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Date, required: true, default: new Date() })
  date: Date;

  @Prop({ type: String })
  externalId: string;

  @Prop([{ date: Date }])
  payments: { date: Date }[];
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense).index({
  type: 1,
  active: 1,
});
