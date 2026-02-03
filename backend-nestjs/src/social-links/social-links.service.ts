import { Injectable } from '@nestjs/common';

@Injectable()
export class SocialLinksService {
  async getLinks() {
    return {
      id: 1,
      whatsapp_channel: null,
      whatsapp_group: null,
      telegram_channel: null,
      telegram_group: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}
