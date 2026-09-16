import { Injectable } from '@nestjs/common';
import { type MailOptions, pwaInstallUrl, sendMail } from './send-mail.js';

/**
 * Nest-facing entry point for outbound email.
 *
 * The implementation lives in send-mail.ts because ported internals that are
 * not Nest providers (notifications/transport) call it too, and one
 * implementation with two access paths beats two implementations.
 */
@Injectable()
export class MailService {
  send(opts: MailOptions) {
    return sendMail(opts);
  }

  /** Where to send someone to install the PWA. */
  pwaInstallUrl(): string {
    return pwaInstallUrl();
  }
}
