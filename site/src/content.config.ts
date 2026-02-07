import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Agent Collection - for agent infrastructure topics
const agent = defineCollection({
  loader: glob({ pattern: 'agent-*/README.md', base: '../agent' }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.coerce.date(),
    status: z.enum(['draft', 'in-progress', 'published', 'completed']),
    sort: z.number().optional(),
  }),
});

// Algo Collection - for algorithm and model topics
const algo = defineCollection({
  loader: glob({ pattern: '**/README.md', base: '../algo' }),
  schema: z.object({
    // Common fields (same as agent)
    title: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    date: z.coerce.date(),
    status: z.enum(['draft', 'in-progress', 'published', 'completed']),
    sort: z.number().optional(),

    // Algo-specific fields (optional)
    paper_title: z.string().optional(),
    paper_arxiv: z.string().optional(),
    paper_year: z.number().optional(),
    type: z.enum(['classic', 'survey', 'implementation', 'application']).optional(),
    prerequisites: z.array(z.string()).optional(),
    papers: z.array(z.string()).optional(),
  }),
});

// Legacy experiments collection (still works with agent topics)
const experiments = defineCollection({
  loader: glob({ pattern: '**/experiments/*/README.md', base: '../agent' }),
  schema: z.object({
    title: z.string(),
    experiment: z.coerce.number(),
    parent: z.string(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    prerequisites: z.array(z.string()).optional(),
  }),
});

// Legacy concepts collection (still works with agent topics)
const concepts = defineCollection({
  loader: glob({ pattern: '**/concepts/*.md', base: '../agent' }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = { agent, algo, experiments, concepts };
