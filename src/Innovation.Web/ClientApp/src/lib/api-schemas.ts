import { z } from 'zod';

// --- Shared schemas ---

export const TranslatedFieldSchema = z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        page: z.number(),
        pageSize: z.number(),
        totalCount: z.number(),
        totalPages: z.number(),
        hasNextPage: z.boolean(),
        hasPreviousPage: z.boolean(),
    });

// --- Challenge schemas ---

export const ChallengeListResponseSchema = z.object({
    id: z.number(),
    publicUlid: z.string(),
    title: z.string(),
    slug: z.string().optional(),
    status: z.string(),
    difficulty: z.string().optional(),
    organizer: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    featured: z.boolean(),
    urgent: z.boolean(),
    isPublic: z.boolean(),
    maxParticipants: z.number().optional(),
    createdAt: z.string(),
});

export const ChallengeEditResponseSchema = z.object({
    id: z.number(),
    title: TranslatedFieldSchema,
    slug: TranslatedFieldSchema.optional(),
    description: TranslatedFieldSchema.optional(),
    organizer: TranslatedFieldSchema.optional(),
    location: TranslatedFieldSchema.optional(),
    status: z.string(),
    categoryId: z.number().optional(),
    innovationTypeId: z.number().optional(),
    difficulty: z.string().optional(),
    participationType: z.string().optional(),
    submissionType: z.string().optional(),
    winnerSelectionMethod: z.string().optional(),
    maxParticipants: z.number().optional(),
    teamSizeMin: z.number().optional(),
    teamSizeMax: z.number().optional(),
    minEvaluatorsPerIdea: z.number().optional(),
    language: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    featured: z.boolean(),
    urgent: z.boolean(),
    isPublic: z.boolean(),
    enableComments: z.boolean(),
    autoTransitionEnabled: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    submissionDeadline: z.string().optional(),
    evaluationStartDate: z.string().optional(),
    evaluationEndDate: z.string().optional(),
});

export const PaginatedChallengesSchema = paginatedResponseSchema(ChallengeListResponseSchema);

// Inferred types — use these at API boundaries instead of generated.ts imports
export type ChallengeListResponse = z.infer<typeof ChallengeListResponseSchema>;
export type ChallengeEditResponse = z.infer<typeof ChallengeEditResponseSchema>;
