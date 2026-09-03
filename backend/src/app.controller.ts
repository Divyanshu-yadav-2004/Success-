import { Controller, Get } from '@nestjs/common';

/**
 * Root controller — handles GET / outside the global api/v1 prefix.
 * This is the health/status endpoint visible at the deployed API root URL.
 */
@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'success',
      message: 'Success MP Online API is running',
    };
  }
}
