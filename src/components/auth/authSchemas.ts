
import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }).optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  // terms: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions." }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

