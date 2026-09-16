import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { auth } from './auth.js';

/**
 * Mounts Better Auth's own handler at /api/auth/*.
 *
 * Deliberately NOT behind any guard. These are the endpoints a signed-out
 * person uses to become signed in, so gating them is a redirect loop — and
 * "/api/auth/* accidentally gated" is one of the three loop conditions
 * docs/02-auth.md names.
 *
 * Better Auth speaks the Web Fetch API; Nest on Express does not. The bridge
 * below is the whole reason this controller exists.
 */
@Controller('api/auth')
export class AuthController {
  @All('*path')
  async handle(@Req() req: Request, @Res() res: Response) {
    const url = new URL(
      req.originalUrl,
      `${req.protocol}://${req.get('host')}`,
    );

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else if (value) headers.set(key, value);
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const request = new Request(url, {
      method: req.method,
      headers,
      // express.json() has already consumed the stream, so re-serialise rather
      // than piping it. Better Auth only ever receives JSON here.
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    const response = await auth.handler(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      // set-cookie must be appended, not set: a sign-in commonly returns more
      // than one, and collapsing them silently drops all but the last.
      if (key.toLowerCase() === 'set-cookie') res.append(key, value);
      else res.setHeader(key, value);
    });
    res.send(response.body ? Buffer.from(await response.arrayBuffer()) : null);
  }
}
