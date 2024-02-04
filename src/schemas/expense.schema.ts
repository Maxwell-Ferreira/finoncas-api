import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema()
export class Expense {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;

  @Prop({ type: String, enum: ['FIXED', 'SINGLE'] })
  type: 'FIXED' | 'SINGLE';

  @Prop()
  amount: number;

  @Prop({ type: String })
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
