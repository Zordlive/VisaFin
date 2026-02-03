import { Controller, Get } from '@nestjs/common';
import { SocialLinksService } from './social-links.service';

@Controller('api/social-links')
export class SocialLinksController {
  constructor(private socialLinksService: SocialLinksService) {}

  @Get()
  async get() {
    return this.socialLinksService.getLinks();
  }
}
