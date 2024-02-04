import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion() {
    return {
      name: 'finonças 🐆',
      version: '1.0.0',
    };
  }
}
