/**
 * @fileoverview Centralized GraphQL query definitions and fragments
 * Eliminates duplication and ensures consistency across API calls
 */

/**
 * GraphQL fragments for reusable field selections
 */
export const FRAGMENTS = {
  /**
   * Core trader fields
   */
  trader: `
    fragment TraderFields on Trader {
      id
      name
      imageLink
    }
  `,

  /**
   * Minimal trader fields for nested usage
   */
  traderRef: `
    fragment TraderRefFields on Trader {
      id
      name
    }
  `,

  /**
   * Quest objective fields
   */
  questObjective: `
    fragment QuestObjectiveFields on TaskObjective {
      id
      description
      type
      maps {
        id
        name
      }
    }
  `,

  /**
   * Complete quest/task fields
   */
  task: `
    fragment TaskFields on Task {
      id
      name
      normalizedName
      kappaRequired
      experience
      minPlayerLevel
      trader {
        ...TraderRefFields
      }
      taskRequirements {
        task {
          id
          name
        }
      }
      objectives {
        ...QuestObjectiveFields
      }
      traderLevelRequirements {
        trader {
          ...TraderRefFields
        }
        level
      }
    }
  `,

  /**
   * Hideout station level fields
   */
  hideoutLevel: `
    fragment HideoutLevelFields on HideoutStationLevel {
      level
      constructionTime
      description
      itemRequirements {
        item {
          id
          name
          iconLink
        }
        count
      }
      stationLevelRequirements {
        station {
          id
          name
        }
        level
      }
      traderRequirements {
        trader {
          ...TraderRefFields
        }
        level
      }
    }
  `,
} as const;

/**
 * Optimized GraphQL queries with fragments
 */
export const QUERIES = {
  /**
   * Fetch all traders
   */
  traders: `
    ${FRAGMENTS.trader}
    
    query GetTraders {
      traders(lang: en) {
        ...TraderFields
      }
    }
  `,

  /**
   * Fetch all tasks/quests with complete information
   * This single query replaces multiple duplicated queries
   */
  allTasks: `
    ${FRAGMENTS.traderRef}
    ${FRAGMENTS.questObjective}
    ${FRAGMENTS.task}
    
    query GetAllTasks {
      tasks(lang: en) {
        ...TaskFields
      }
    }
  `,

  /**
   * Fetch hideout stations
   */
  hideoutStations: `
    ${FRAGMENTS.traderRef}
    ${FRAGMENTS.hideoutLevel}
    
    query GetHideoutStations {
      hideoutStations {
        id
        name
        imageLink
        levels {
          ...HideoutLevelFields
        }
      }
    }
  `,

  /**
   * Lightweight query for just quest IDs and dependencies
   * Useful for dependency graph calculations
   */
  questDependencies: `
    query GetQuestDependencies {
      tasks(lang: en) {
        id
        name
        trader {
          id
        }
        taskRequirements {
          task {
            id
          }
        }
        kappaRequired
      }
    }
  `,
} as const;

/**
 * Query builder utilities for dynamic queries
 */
export const QueryBuilder = {
  /**
   * Build a trader-specific query with field selection
   */
  traderTasks: (fields: string[] = ['id', 'name']): string => {
    const fieldSelection = fields.join('\n        ');
    return `
      query GetTraderTasks($traderId: String!) {
        tasks(lang: en, trader: $traderId) {
          ${fieldSelection}
        }
      }
    `;
  },

  /**
   * Build a conditional query based on filters
   */
  conditionalTasks: (filters: {
    kappa?: boolean;
    trader?: string;
    minLevel?: number;
  }): string => {
    const conditions: string[] = [];
    if (filters.kappa) conditions.push('kappaRequired: true');
    if (filters.trader) conditions.push(`trader: "${filters.trader}"`);
    if (filters.minLevel) conditions.push(`minLevel: ${filters.minLevel}`);

    const conditionStr = conditions.length > 0 ? `(${conditions.join(', ')})` : '';

    return `
      ${FRAGMENTS.traderRef}
      ${FRAGMENTS.questObjective}
      ${FRAGMENTS.task}
      
      query GetConditionalTasks {
        tasks(lang: en ${conditionStr}) {
          ...TaskFields
        }
      }
    `;
  },
} as const;

/**
 * Query validation and optimization utilities
 */
export const QueryUtils = {
  /**
   * Validate a GraphQL query for common issues
   */
  validateQuery: (query: string): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];

    // Check for fragments without definitions
    const fragmentUsages = query.match(/\.\.\.\w+/g) || [];
    const fragmentDefinitions = query.match(/fragment \w+/g) || [];
    
    fragmentUsages.forEach(usage => {
      const fragmentName = usage.replace('...', '');
      if (!fragmentDefinitions.some(def => def.includes(fragmentName))) {
        issues.push(`Fragment ${fragmentName} used but not defined`);
      }
    });

    // Check for potential N+1 issues
    if (query.includes('tasks') && !query.includes('trader {')) {
      issues.push('Consider including trader information to avoid additional queries');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },

  /**
   * Estimate query complexity (simple heuristic)
   */
  estimateComplexity: (query: string): { score: number; level: 'low' | 'medium' | 'high' } => {
    const fieldCount = (query.match(/\w+(?=\s*{|$)/g) || []).length;
    const nestedLevels = (query.match(/{/g) || []).length;
    const score = fieldCount + (nestedLevels * 2);

    let level: 'low' | 'medium' | 'high';
    if (score < 10) level = 'low';
    else if (score < 25) level = 'medium';
    else level = 'high';

    return { score, level };
  },
} as const;