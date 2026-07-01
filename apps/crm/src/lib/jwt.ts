// Path: lib/jwt.ts
import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// Ensure secret exists and is typed
const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY as string);

// Define your payload type (custom claims)
export interface AuthPayload extends JWTPayload {
  id: number;
  email: string;
  role: string;
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('3h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify<AuthPayload>(token, secret);
    return payload;
  } catch (err) {
    console.error('[JWT verify error]:', err);
    return null;
  }
}
