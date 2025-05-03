import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  // Add other relevant payload properties as needed
}

export const generateToken = (payload: TokenPayload): string => {
  // The original error was likely here due to process.env.JWT_SECRET potentially being undefined
  // We add a fallback '' to ensure it's always a string for jwt.sign
  const secret = process.env.JWT_SECRET || '';

  if (!secret) {
    // Handle the case where the secret is not set (e.g., throw an error or log a warning)
    // For now, we'll just throw an error as it's critical for security
    throw new Error('JWT_SECRET environment variable is not set.');
  }

  // This is the line that needed fixing.
  // The fix is ensuring 'secret' is a string and the options object is correctly typed.
  const token = jwt.sign(payload, secret, { expiresIn: '1h' }); // Example: token expires in 1 hour

  return token;
};

export const verifyToken = (token: string): TokenPayload | null => {
  const secret = process.env.JWT_SECRET || '';

  if (!secret) {
     throw new Error('JWT_SECRET environment variable is not set.');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};