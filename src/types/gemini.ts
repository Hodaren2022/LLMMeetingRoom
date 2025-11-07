// Gemini API related types

export interface GeminiResponse {
  content: string;
  tendencyScore: number;
  reasoning?: {
    analyze: string;
    critique: string;
    strategy: string;
  };
  sources?: SourceReference[];
  searchQueries?: string[];
  error?: string;
  metadata?: {
    searchQueries?: string[];
    groundingMetadata?: GroundingMetadata;
  };
}

export interface SourceReference {
  url: string;
  title: string;
  snippet: string;
  relevanceScore?: number;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  webSearchQueries?: string[];
  [key: string]: unknown;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
    snippet?: string;
  };
}

export interface GroundingSupport {
  segment?: {
    startIndex?: number;
    endIndex?: number;
  };
  groundingChunkIndices?: number[];
}

export interface DebateStateData {
  error?: string;
  currentSpeaker?: string;
  round?: number;
  [key: string]: unknown;
}

export interface PersistedState {
  rooms?: unknown[];
  availablePersonas?: unknown[];
  userPreferences?: unknown;
  debateHistory?: unknown[];
  [key: string]: unknown;
}

// Gemini API response interface compatible with Google Generative AI
export interface GeminiApiResponse {
  response?: {
    text(): string;
    candidates?: Array<{
      groundingMetadata?: GroundingMetadata; // Use any to be compatible with Google's types
    }>;
  };
  [key: string]: unknown;
}