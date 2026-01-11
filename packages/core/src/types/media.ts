import { z } from 'zod';
import { presignedUrlRequestSchema, presignedUrlResponseSchema } from '../schemas';

export type PresignedUrlRequestPayload = z.infer<typeof presignedUrlRequestSchema>;
export type PresignedUrlResponsePayload = z.infer<typeof presignedUrlResponseSchema>;
