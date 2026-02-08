// .claude/skills/chapter-content-validator/lib/dependency-resolver.ts

import type { DependencyGraph } from './types.js';

export interface ExecutionPlan {
  /** Batches of chapters that can be executed in parallel within each batch */
  batches: string[][];
  /** Chapters skipped because dependencies are not met */
  skipped: Array<{ chapter: string; missing: string[] }>;
}

/**
 * Dependency Resolver - topological sort for chapter execution order.
 *
 * Given a dependency graph and a set of already-completed chapters,
 * produces batches of chapters that can be executed in parallel.
 */
export class DependencyResolver {

  /**
   * Resolve execution order for chapters.
   *
   * @param graph - dependency graph from paradigm
   * @param completed - set of already completed chapter paths
   * @param targets - chapters to execute (empty = all)
   * @returns execution plan with parallel batches
   */
  resolve(
    graph: DependencyGraph,
    completed: Set<string>,
    targets: string[] = []
  ): ExecutionPlan {
    // Build adjacency list: chapter -> its dependencies
    const deps = new Map<string, Set<string>>();
    for (const node of graph.nodes) {
      deps.set(node, new Set());
    }
    for (const edge of graph.edges) {
      if (!deps.has(edge.from)) deps.set(edge.from, new Set());
      deps.get(edge.from)!.add(edge.to);
    }

    // Filter to targets if specified
    const candidates = targets.length > 0
      ? targets
      : Array.from(deps.keys());

    // Remove already completed from candidates
    const remaining = candidates.filter(c => !completed.has(c));

    // Kahn's algorithm for topological sort with batching
    const batches: string[][] = [];
    const skipped: Array<{ chapter: string; missing: string[] }> = [];
    const done = new Set(completed);

    let changed = true;
    const pending = new Set(remaining);

    while (changed && pending.size > 0) {
      changed = false;
      const batch: string[] = [];

      for (const chapter of pending) {
        const chapterDeps = deps.get(chapter) || new Set();
        const unmet = Array.from(chapterDeps).filter(d => !done.has(d));

        if (unmet.length === 0) {
          batch.push(chapter);
        }
      }

      if (batch.length > 0) {
        changed = true;
        for (const c of batch) {
          pending.delete(c);
          done.add(c);
        }
        batches.push(batch);
      }
    }

    // Any remaining chapters have unresolvable dependencies
    for (const chapter of pending) {
      const chapterDeps = deps.get(chapter) || new Set();
      const missing = Array.from(chapterDeps).filter(d => !done.has(d));
      skipped.push({ chapter, missing });
    }

    return { batches, skipped };
  }

  /**
   * Check if a single chapter's dependencies are met.
   */
  canExecute(
    chapter: string,
    graph: DependencyGraph,
    completed: Set<string>
  ): { ready: boolean; missing: string[] } {
    const chapterDeps = graph.edges
      .filter(e => e.from === chapter)
      .map(e => e.to);

    const missing = chapterDeps.filter(d => !completed.has(d));
    return { ready: missing.length === 0, missing };
  }
}
