import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { MeController } from './me.controller.js';
import { SessionGuard } from './session.guard.js';

@Global()
@Module({
  controllers: [AuthController, MeController],
  providers: [SessionGuard],
  exports: [SessionGuard],
})
export class AuthModule {}
