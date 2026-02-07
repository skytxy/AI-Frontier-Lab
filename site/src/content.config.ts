import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const topics = defineCollection({
  loader: glob({ pattern: '[0-9]*/README.md', base: '../topics' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.coerce.date(),
    status: z.enum(['draft', 'in-progress', 'published', 'completed']),
  }),
});

const experiments = defineCollection({
  loader: glob({ pattern: '**/experiments/*/README.md', base: '../topics' }),
  schema: z.object({
    title: z.string(),
    experiment: z.coerce.number(),
    parent: z.string(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    prerequisites: z.array(z.string()).optional(),
  }),
});

export const collections = { topics, experiments };
