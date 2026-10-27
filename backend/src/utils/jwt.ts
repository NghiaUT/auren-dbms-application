import jwt, { SignOptions, type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/index.js';

interface AccessTokenPayload extends JwtPayload {
  email: string;
  role: AuthUser['role'];
  customerId?: number;
}

export function signAccessToken(payload: AuthUser): string {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      customerId: payload.customerId,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] },
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === 'string' || !decoded.sub) {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }

  const { sub, email, role, customerId } = decoded as AccessTokenPayload;

  const id = Number(sub);
  if (!Number.isInteger(id)) {
    throw new jwt.JsonWebTokenError('Invalid token subject');
  }

  return {
    id,
    email,
    role,
    customerId: customerId != null ? Number(customerId) : undefined,
  };
}
