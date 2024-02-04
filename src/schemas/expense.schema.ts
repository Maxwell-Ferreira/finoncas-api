import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';

export type ExpenseDocument = HydratedDocument<Expense>;

export type ExpenseType = 'FIXED' | 'SINGLE';

@Schema()
export class Expense {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: String, enum: ['FIXED', 'SINGLE'], required: true })
  type: ExpenseType;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop([{ date: Date }])
  payments: { date: Date }[];
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense).index({
  type: 1,
  active: 1,
});
