import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string) {
    const user = await this.userModel.findOne({ email });

    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }

    return {
      access_token: await this.jwtService.signAsync(user.toJSON(), {
        secret: process.env.APP_KEY,
      }),
    };
  }
}
