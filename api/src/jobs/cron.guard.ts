import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { env } from '../env.js';

/**
 * Shared secret for the scheduled endpoints.
 *
 * FAILS CLOSED. With no CRON_SECRET configured these refuse to run at all
 * rather than running unauthenticated — one of them deletes people's data, and
 * an open endpoint there is not a thing that should be reachable by forgetting
 * an environment variable. The other can push a notification to every user on
 * the platform, which is why it uses the same guard rather than a weaker one.
 */
@Injectable()
export class CronGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!env.cronSecret) {
      throw new ServiceUnavailableException('CRON_SECRET is not configured');
    }
    const request = context.switchToHttp().getRequest<Request>();
    if (request.header('authorization') !== `Bearer ${env.cronSecret}`) {
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }
}
