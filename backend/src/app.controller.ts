import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  @Redirect('/api/docs', 302)
  root() {
    // Redirects to API documentation
  }

  @Get('api')
  getApiInfo() {
    return {
      name: 'Zharqyn Bala API',
      version: '1.0.0',
      description: 'Онлайн-платформа психологической диагностики детей',
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        tests: '/api/v1/tests',
        results: '/api/v1/results',
        payments: '/api/v1/payments',
        health: '/health',
      },
    };
  }
}
