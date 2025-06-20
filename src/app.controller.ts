import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('zalo_verifierO_so6QFj9qvvvubsXUuaJcBRj52EhM89DZGt')
  getZaloVerifierWithoutExtension(@Res() res: Response) {
    const filePath = path.join(
      __dirname,
      'asset',
      'zalo_verifierO_so6QFj9qvvvubsXUuaJcBRj52EhM89DZGt.html',
    );

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } else {
      res.status(404).send('File not found');
    }
  }

  @Get('zalo_verifierO_so6QFj9qvvvubsXUuaJcBRj52EhM89DZGt.html')
  getZaloVerifier(@Res() res: Response) {
    const filePath = path.join(
      __dirname,
      'asset',
      'zalo_verifierO_so6QFj9qvvvubsXUuaJcBRj52EhM89DZGt.html',
    );

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } else {
      res.status(404).send('File not found');
    }
  }
}
