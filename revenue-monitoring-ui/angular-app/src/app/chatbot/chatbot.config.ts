/**
 * Route-aware chatbot configuration.
 * Each route maps to a page-specific title, opening message, and suggestion chips.
 * Pages without explicit config fall back to DEFAULT_CHATBOT_CONFIG.
 */

export interface ChatbotPageConfig {
  title: string;
  openingMessage: string;
  suggestions: string[];
}

export const DEFAULT_CHATBOT_CONFIG: ChatbotPageConfig = {
  title: 'Control Tower Assistant',
  openingMessage:
    'Currently, I can help you with dashboard access requests — like requesting access, checking your current roles, or getting help with the access process. More assistant features for this page are coming soon.',
  suggestions: [
    'I need access to a dashboard',
    'What access do I have?',
    'What does this dashboard show?',
  ],
};

export const CHATBOT_ROUTE_CONFIG: Record<string, ChatbotPageConfig> = {
  '/period-close-tracking': {
    title: 'Period Close Assistant',
    openingMessage:
      'The Period Close assistant is under development. It will help you track period close statuses, identify blockers, and surface key exceptions.',
    suggestions: [
      'Show period close status',
      'What are the open exceptions?',
      'Summarize close progress',
    ],
  },
  '/invoice-to-cash': {
    title: 'Invoice to Cash Assistant',
    openingMessage:
      'The Invoice to Cash assistant is under development. It will help you analyze billing exceptions, track error trends, and suggest resolutions.',
    suggestions: [
      'Show top billing errors',
      'Summarize I2C exceptions',
      'What needs attention?',
    ],
  },
  '/revenue-accounting': {
    title: 'Revenue Accounting Assistant',
    openingMessage:
      'The Revenue Accounting assistant is under development. It will assist with reconciliation insights, standard revenue tracking, and anomaly detection.',
    suggestions: [
      'Show reconciliation status',
      'Any revenue anomalies?',
      'Summarize open items',
    ],
  },
  '/gl-posting': {
    title: 'General Ledger Assistant',
    openingMessage:
      'The General Ledger assistant is under development. It will help you monitor GL posting statuses and identify posting failures.',
    suggestions: [
      'Show posting errors',
      'GL status summary',
      'What failed today?',
    ],
  },
  '/case-iq': {
    title: 'CaseIQ Assistant',
    openingMessage:
      'The CaseIQ assistant is under development. It will provide insights on case resolution, agent performance, and automation rates across components.',
    suggestions: [
      'Show automation rate',
      'Top components by volume',
      'Agent vs Ops breakdown',
    ],
  },
  '/order-management': {
    title: 'Order Management Assistant',
    openingMessage:
      'The Order Management assistant is under development. It will help you track import errors, order exceptions, and processing trends.',
    suggestions: [
      'Show import errors',
      'Order exception summary',
      'What needs attention?',
    ],
  },
  '/business-insights': {
    title: 'Business Insights Assistant',
    openingMessage:
      'The Business Insights assistant is under development. It will help you explore large deal tracking, midclose status, and active incidents.',
    suggestions: [
      'Show large deal summary',
      'Midclose status overview',
      'Active incidents count',
    ],
  },
  '/operations-dashboard': {
    title: 'Operations Dashboard Assistant',
    openingMessage:
      'The Operations Dashboard assistant is under development. It will provide cross-functional insights and operational health metrics.',
    suggestions: [
      'Show ops health summary',
      'Key metrics overview',
      'Any critical issues?',
    ],
  },
  '/i2c-case-analyzer': {
    title: 'Case Analyzer Assistant',
    openingMessage:
      'The I2C Case Analyzer assistant is under development. It will help you analyze case categorization accuracy and validation results.',
    suggestions: [
      'Show accuracy metrics',
      'Category breakdown',
      'Validation summary',
    ],
  },
  '/identity-access-management': {
    title: 'IAM Assistant',
    openingMessage:
      'I can help you request access to dashboards, check your current access, and answer questions about the platform. Other assistant features are under development.',
    suggestions: [
      'I need access to a dashboard',
      'What access do I have?',
      'Help me with access requests',
    ],
  },
};

/**
 * Resolves chatbot config for a given route URL.
 * Matches the longest prefix to handle nested routes.
 */
export function getChatbotConfig(url: string): ChatbotPageConfig {
  // Try exact match first
  if (CHATBOT_ROUTE_CONFIG[url]) {
    return CHATBOT_ROUTE_CONFIG[url];
  }
  // Try prefix match (for routes with query params or nested paths)
  for (const route of Object.keys(CHATBOT_ROUTE_CONFIG)) {
    if (url.startsWith(route)) {
      return CHATBOT_ROUTE_CONFIG[route];
    }
  }
  return DEFAULT_CHATBOT_CONFIG;
}
