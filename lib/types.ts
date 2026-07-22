export type SafetyLevel = 'safe' | 'warning' | 'dangerous';

export interface CommandFlag {
  flag: string;
  description: string;
}

export interface CommandEntry {
  id: string;
  command: string;
  description: string;
  category: string;
  tags: string[];
  example: string;
  safety: SafetyLevel;
  flags?: CommandFlag[];
  explanation?: string;
}

export interface SearchResult {
  entry: CommandEntry;
  score: number;
  source: 'retrieval' | 'llm';
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  llmUsed: boolean;
  latencyMs: number;
}

export interface LLMGeneratedCommand {
  command: string;
  explanation: string;
  flags: CommandFlag[];
  example: string;
  safety: SafetyLevel;
}
