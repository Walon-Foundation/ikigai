import { Global, Module } from '@nestjs/common';
import { ActorService } from './actor.service.js';

// Global: every domain module needs to know who is acting and what they are
// allowed to be.
@Global()
@Module({
  providers: [ActorService],
  exports: [ActorService],
})
export class CommonModule {}
