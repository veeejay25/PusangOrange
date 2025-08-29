/**
 * @fileoverview Testing utilities and mock data for Tarkov API
 * Provides comprehensive mocking infrastructure and test boundaries
 */

import type {
  Trader,
  Quest,
  HideoutStation,
  Item,
  PlayerSettings,
  ExtendedPlayerSettings,
  QuestObjective,
  HideoutStationLevel,
} from './tarkovTypes';

/**
 * Mock data generators for testing
 */
export const MockDataGenerators = {
  /**
   * Generate a mock trader with optional overrides
   */
  createTrader(overrides: Partial<Trader> = {}): Trader {
    return {
      id: `trader-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Trader',
      imageLink: 'https://example.com/trader.png',
      ...overrides,
    };
  },

  /**
   * Generate a mock quest with optional overrides
   */
  createQuest(overrides: Partial<Quest> = {}): Quest {
    const defaultTrader = this.createTrader();
    
    return {
      id: `quest-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Quest',
      normalizedName: 'test-quest',
      kappaRequired: false,
      trader: defaultTrader,
      taskRequirements: [],
      objectives: [this.createQuestObjective()],
      experience: 3000,
      traderLevelRequirements: [],
      minPlayerLevel: 1,
      ...overrides,
    };
  },

  /**
   * Generate a mock quest objective
   */
  createQuestObjective(overrides: Partial<QuestObjective> = {}): QuestObjective {
    return {
      id: `objective-${Math.random().toString(36).substr(2, 9)}`,
      description: 'Test objective description',
      type: 'findInRaid',
      maps: [],
      ...overrides,
    };
  },

  /**
   * Generate a mock hideout station
   */
  createHideoutStation(overrides: Partial<HideoutStation> = {}): HideoutStation {
    return {
      id: `station-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Station',
      imageLink: 'https://example.com/station.png',
      levels: [
        this.createHideoutStationLevel({ level: 1 }),
        this.createHideoutStationLevel({ level: 2 }),
        this.createHideoutStationLevel({ level: 3 }),
      ],
      ...overrides,
    };
  },

  /**
   * Generate a mock hideout station level
   */
  createHideoutStationLevel(overrides: Partial<HideoutStationLevel> = {}): HideoutStationLevel {
    return {
      level: 1,
      constructionTime: 3600, // 1 hour
      description: 'Test level description',
      itemRequirements: [],
      stationLevelRequirements: [],
      traderRequirements: [],
      ...overrides,
    };
  },

  /**
   * Generate a mock item
   */
  createItem(overrides: Partial<Item> = {}): Item {
    return {
      id: `item-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Item',
      iconLink: 'https://example.com/item.png',
      totalQuantity: 1,
      foundInRaid: false,
      source: 'quest',
      usages: [],
      ...overrides,
    };
  },

  /**
   * Generate mock player settings
   */
  createPlayerSettings(overrides: Partial<PlayerSettings> = {}): PlayerSettings {
    return {
      level: 15,
      faction: 'USEC',
      playerName: 'TestPlayer',
      completedQuestIds: [],
      traderLevels: {
        'prapor': 2,
        'therapist': 1,
        'skier': 1,
      },
      gameEdition: 'Standard',
      ...overrides,
    };
  },

  /**
   * Generate mock extended player settings
   */
  createExtendedPlayerSettings(overrides: Partial<ExtendedPlayerSettings> = {}): ExtendedPlayerSettings {
    const base = this.createPlayerSettings(overrides);
    return {
      ...base,
      hideoutModuleLevels: {
        'stash': 1,
        'generator': 0,
        'heating': 0,
      },
      ...overrides,
    };
  },

  /**
   * Generate a realistic quest dependency tree
   */
  createQuestTree(depth: number = 3, branching: number = 2): Quest[] {
    const quests: Quest[] = [];
    const createWithDeps = (level: number, parentIds: string[] = []): Quest[] => {
      if (level >= depth) return [];
      
      const levelQuests: Quest[] = [];
      for (let i = 0; i < branching; i++) {
        const quest = this.createQuest({
          name: `Quest Level ${level}-${i}`,
          taskRequirements: parentIds.map(id => ({
            task: { id, name: `Parent Quest ${id}` },
          })),
          experience: (level + 1) * 1000,
          minPlayerLevel: Math.max(1, level * 5),
        });
        
        levelQuests.push(quest);
        quests.push(quest);
        
        // Create children
        const children = createWithDeps(level + 1, [quest.id]);
        quests.push(...children);
      }
      
      return levelQuests;
    };
    
    createWithDeps(0);
    return quests;
  },

  /**
   * Generate realistic hideout progression data
   */
  createHideoutProgression(): HideoutStation[] {
    const stations = [
      'Stash', 'Generator', 'Heating', 'Water Collector', 'Medstation',
      'Nutrition Unit', 'Workbench', 'Intelligence Center', 'Security',
      'Lavatory', 'Vents', 'Booze Generator', 'Bitcoin Farm', 'Library',
    ];

    return stations.map(name => this.createHideoutStation({
      name,
      levels: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => 
        this.createHideoutStationLevel({
          level: i + 1,
          constructionTime: (i + 1) * 3600, // Hours to seconds
        })
      ),
    }));
  },
} as const;

/**
 * Test scenarios for different use cases
 */
export const TestScenarios = {
  /**
   * New player scenario (level 1, no progress)
   */
  newPlayer: (): ExtendedPlayerSettings => ({
    level: 1,
    faction: 'USEC',
    playerName: 'NewPlayer',
    completedQuestIds: [],
    traderLevels: {},
    gameEdition: 'Standard',
    hideoutModuleLevels: {},
  }),

  /**
   * Mid-game player scenario
   */
  midGamePlayer: (): ExtendedPlayerSettings => ({
    level: 25,
    faction: 'USEC',
    playerName: 'MidGamePlayer',
    completedQuestIds: MockDataGenerators.createQuestTree(2, 3).map(q => q.id),
    traderLevels: {
      'prapor': 3,
      'therapist': 2,
      'skier': 2,
      'peacekeeper': 2,
      'mechanic': 2,
      'ragman': 1,
      'jaeger': 1,
    },
    gameEdition: 'Prepare for Escape',
    hideoutModuleLevels: {
      'stash': 3,
      'generator': 2,
      'heating': 1,
      'water-collector': 1,
      'medstation': 1,
    },
  }),

  /**
   * End-game player scenario
   */
  endGamePlayer: (): ExtendedPlayerSettings => ({
    level: 62,
    faction: 'BEAR',
    playerName: 'EndGamePlayer',
    completedQuestIds: MockDataGenerators.createQuestTree(4, 4).map(q => q.id),
    traderLevels: {
      'prapor': 4,
      'therapist': 4,
      'skier': 4,
      'peacekeeper': 4,
      'mechanic': 4,
      'ragman': 4,
      'jaeger': 4,
    },
    gameEdition: 'Edge of Darkness',
    hideoutModuleLevels: {
      'stash': 4,
      'generator': 3,
      'heating': 3,
      'water-collector': 3,
      'medstation': 3,
      'nutrition-unit': 3,
      'workbench': 3,
      'intelligence-center': 3,
      'security': 3,
      'lavatory': 3,
      'vents': 3,
      'booze-generator': 1,
      'bitcoin-farm': 3,
    },
  }),

  /**
   * Edge of Darkness edition player (premium bonuses)
   */
  eodPlayer: (): ExtendedPlayerSettings => ({
    level: 15,
    faction: 'USEC',
    playerName: 'EODPlayer',
    completedQuestIds: [],
    traderLevels: {},
    gameEdition: 'Edge of Darkness',
    hideoutModuleLevels: {
      'stash': 0, // Will be boosted to 4 by edition bonus
    },
  }),
} as const;

/**
 * Mock API responses for testing
 */
export const MockApiResponses = {
  /**
   * Mock successful trader response
   */
  tradersSuccess: () => ({
    data: {
      traders: [
        MockDataGenerators.createTrader({ id: 'prapor', name: 'Prapor' }),
        MockDataGenerators.createTrader({ id: 'therapist', name: 'Therapist' }),
        MockDataGenerators.createTrader({ id: 'skier', name: 'Skier' }),
      ],
    },
  }),

  /**
   * Mock GraphQL error response
   */
  graphqlError: () => ({
    errors: [
      {
        message: 'Field "invalidField" must not have a selection since type "String" has no subfields.',
        locations: [{ line: 3, column: 5 }],
        path: ['invalidField'],
      },
    ],
  }),

  /**
   * Mock network timeout (for testing)
   */
  networkTimeout: () => {
    throw new Error('Network timeout');
  },

  /**
   * Mock rate limit response
   */
  rateLimited: () => ({
    error: {
      message: 'Rate limit exceeded',
      statusCode: 429,
      retryAfter: 60,
    },
  }),
} as const;

/**
 * Test utilities for mocking and assertions
 */
export const TestUtils = {
  /**
   * Create a mock fetch function for testing (framework agnostic)
   */
  createMockFetch: (responses: Array<{ url?: string; response: any; delay?: number }>) => {
    let callCount = 0;
    
    const mockFn = async (url: string, options?: any) => {
      const responseConfig = responses[callCount % responses.length];
      callCount++;

      if (responseConfig.delay) {
        await new Promise(resolve => setTimeout(resolve, responseConfig.delay));
      }

      if (responseConfig.url && !url.includes(responseConfig.url)) {
        throw new Error(`Unexpected URL: ${url}`);
      }

      if (responseConfig.response instanceof Error) {
        throw responseConfig.response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => responseConfig.response,
        text: async () => JSON.stringify(responseConfig.response),
      };
    };
    
    // Add call tracking for testing frameworks
    (mockFn as any).mock = {
      calls: [] as any[][],
      results: [] as any[],
    };
    
    const originalMockFn = mockFn;
    const wrappedMockFn = async (...args: Parameters<typeof originalMockFn>) => {
      (wrappedMockFn as any).mock.calls.push([...args]);
      try {
        const result = await originalMockFn(...args);
        (wrappedMockFn as any).mock.results.push({ type: 'return', value: result });
        return result;
      } catch (error) {
        (wrappedMockFn as any).mock.results.push({ type: 'throw', value: error });
        throw error;
      }
    };
    
    (wrappedMockFn as any).mock = (mockFn as any).mock;
    return wrappedMockFn;
  },

  /**
   * Assert that two objects are structurally similar (ignoring IDs)
   */
  assertStructuralSimilarity: <T extends Record<string, any>>(
    actual: T,
    expected: Partial<T>,
    ignoreFields: (keyof T)[] = ['id']
  ) => {
    const actualFiltered = { ...actual };
    const expectedFiltered = { ...expected };
    
    ignoreFields.forEach(field => {
      delete actualFiltered[field];
      delete expectedFiltered[field];
    });

    // Framework-agnostic assertion - adapt to your testing framework
    const hasTestingFramework = typeof globalThis !== 'undefined' && 
      (globalThis as any).expect && 
      typeof (globalThis as any).expect === 'function';
      
    if (hasTestingFramework) {
      const expect = (globalThis as any).expect;
      expect(actualFiltered).toMatchObject(expectedFiltered);
    } else {
      // Simple deep comparison for environments without testing framework
      const expected = { ...actualFiltered, ...expectedFiltered };
      if (JSON.stringify(actualFiltered) !== JSON.stringify(expected)) {
        throw new Error(`Objects do not match structurally:\nActual: ${JSON.stringify(actualFiltered)}\nExpected: ${JSON.stringify(expected)}`);
      }
    }
  },

  /**
   * Measure execution time of async function
   */
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
    const start = performance.now();
    const result = await fn();
    const timeMs = performance.now() - start;
    return { result, timeMs };
  },

  /**
   * Create a delayed promise (for testing timeouts)
   */
  delay: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate deterministic test data (same seed = same data)
   */
  generateDeterministicData: <T>(generator: () => T, seed: string): T => {
    // Simple deterministic random based on seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Mock Math.random with seeded version
    const originalRandom = Math.random;
    Math.random = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
    
    try {
      return generator();
    } finally {
      Math.random = originalRandom;
    }
  },
} as const;

/**
 * Integration test helpers
 */
export const IntegrationTestHelpers = {
  /**
   * Set up a complete mock environment
   */
  setupMockEnvironment: () => {
    const mockFetch = TestUtils.createMockFetch([
      {
        url: 'traders',
        response: MockApiResponses.tradersSuccess(),
      },
      {
        url: 'tasks',
        response: {
          data: {
            tasks: MockDataGenerators.createQuestTree(2, 2),
          },
        },
      },
    ]);

    // Mock global fetch
    global.fetch = mockFetch as any;

    return {
      mockFetch,
      cleanup: () => {
        delete (global as any).fetch;
      },
    };
  },

  /**
   * Create a test database state
   */
  createTestState: (scenario: keyof typeof TestScenarios = 'midGamePlayer') => {
    const playerSettings = TestScenarios[scenario]();
    const traders = [
      MockDataGenerators.createTrader({ id: 'prapor', name: 'Prapor' }),
      MockDataGenerators.createTrader({ id: 'therapist', name: 'Therapist' }),
    ];
    const quests = MockDataGenerators.createQuestTree(3, 2);
    const hideoutStations = MockDataGenerators.createHideoutProgression();

    return {
      playerSettings,
      traders,
      quests,
      hideoutStations,
    };
  },

  /**
   * Validate API contract compliance
   */
  validateApiContract: (response: any, expectedStructure: any): boolean => {
    const validate = (actual: any, expected: any, path = ''): boolean => {
      if (expected === null || expected === undefined) {
        return actual === expected;
      }

      if (typeof expected === 'object' && !Array.isArray(expected)) {
        if (typeof actual !== 'object' || actual === null) {
          console.error(`Contract violation at ${path}: expected object, got ${typeof actual}`);
          return false;
        }

        return Object.keys(expected).every(key => {
          return validate(actual[key], expected[key], `${path}.${key}`);
        });
      }

      if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) {
          console.error(`Contract violation at ${path}: expected array, got ${typeof actual}`);
          return false;
        }

        if (expected.length > 0) {
          return actual.every((item, index) => 
            validate(item, expected[0], `${path}[${index}]`)
          );
        }
      }

      if (typeof expected === 'string' && expected.startsWith('__type:')) {
        const expectedType = expected.replace('__type:', '');
        if (typeof actual !== expectedType) {
          console.error(`Contract violation at ${path}: expected ${expectedType}, got ${typeof actual}`);
          return false;
        }
      }

      return true;
    };

    return validate(response, expectedStructure);
  },
} as const;