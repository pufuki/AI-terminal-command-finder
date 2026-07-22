import type { CommandEntry, SearchResult } from './types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up',
  'down', 'out', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
  'just', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'and', 'or', 'but',
  'if', 'because', 'as', 'until', 'while', 'also', 'want', 'need',
  'show', 'me', 'how', 'get', 'make', 'find', 'command', 'terminal',
  'shell', 'line', 'run', 'use', 'using',
]);

const SYNONYMS: Record<string, string[]> = {
  delete: ['remove', 'rm', 'drop', 'erase', 'purge'],
  remove: ['delete', 'rm', 'drop', 'erase'],
  copy: ['cp', 'duplicate', 'clone'],
  move: ['mv', 'rename', 'relocate'],
  list: ['ls', 'show', 'display', 'enumerate'],
  search: ['find', 'grep', 'locate', 'lookup'],
  find: ['search', 'locate', 'grep'],
  kill: ['terminate', 'stop', 'end', 'destroy'],
  start: ['launch', 'begin', 'init', 'run'],
  stop: ['halt', 'terminate', 'kill', 'end'],
  restart: ['reboot', 'reload', 'refresh'],
  check: ['verify', 'test', 'inspect', 'examine'],
  show: ['display', 'print', 'echo', 'list'],
  create: ['make', 'new', 'generate', 'build'],
  compress: ['zip', 'archive', 'pack', 'gzip'],
  extract: ['unzip', 'decompress', 'unpack'],
  download: ['fetch', 'get', 'pull', 'wget'],
  upload: ['push', 'send', 'transfer'],
  install: ['add', 'setup', 'deploy'],
  uninstall: ['remove', 'delete', 'purge'],
  count: ['tally', 'number', 'enumerate'],
  sort: ['order', 'arrange', 'organize'],
  merge: ['combine', 'join', 'concatenate'],
  split: ['divide', 'separate', 'partition'],
  empty: ['blank', 'null', 'void', 'zero'],
  directory: ['folder', 'dir'],
  file: ['document', 'data'],
  permission: ['chmod', 'mode', 'access'],
  process: ['task', 'job', 'pid'],
  network: ['connection', 'socket', 'port'],
  large: ['big', 'huge', 'giant'],
  old: ['stale', 'outdated', 'aged'],
  recursive: ['recursively', 'subdirectory', 'nested'],
  empty_folder: ['empty', 'directory', 'folder'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+_-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) syns.forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}

function buildDocumentText(entry: CommandEntry): string {
  const parts = [
    entry.command,
    entry.description,
    entry.category,
    entry.tags.join(' '),
    entry.example,
  ];
  if (entry.explanation) parts.push(entry.explanation);
  if (entry.flags) {
    entry.flags.forEach((f) => parts.push(f.flag, f.description));
  }
  return parts.join(' ');
}

interface IndexedDocument {
  entry: CommandEntry;
  tokens: string[];
  tf: Map<string, number>;
  norm: number;
}

let documents: IndexedDocument[] = [];
let idf: Map<string, number> = new Map();
let initialized = false;

function ensureIndex(): void {
  if (initialized) return;

  const { allCommands } = require('./dataset');
  const N = allCommands.length;
  const df = new Map<string, number>();

  documents = allCommands.map((entry: CommandEntry) => {
    const rawTokens = tokenize(buildDocumentText(entry));
    const tokens = expandTokens(rawTokens);
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    const uniqueTokens = Array.from(new Set(tokens));
    for (const t of uniqueTokens) {
      df.set(t, (df.get(t) || 0) + 1);
    }
    let norm = 0;
    for (const [, freq] of tf) {
      norm += freq * freq;
    }
    norm = Math.sqrt(norm);
    return { entry, tokens, tf, norm };
  });

  idf = new Map();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((N + 1) / (freq + 1)) + 1);
  }

  initialized = true;
}

function cosineSimilarity(
  queryTokens: string[],
  queryTf: Map<string, number>,
  queryNorm: number,
  doc: IndexedDocument,
): number {
  if (queryNorm === 0 || doc.norm === 0) return 0;

  let dot = 0;
  for (const [term, qFreq] of queryTf) {
    const dFreq = doc.tf.get(term);
    if (dFreq === undefined) continue;
    const idfVal = idf.get(term);
    if (idfVal === undefined) continue;
    dot += qFreq * dFreq * idfVal * idfVal;
  }

  return dot / (queryNorm * doc.norm);
}

export function search(
  query: string,
  topK = 5,
  threshold = 0.01,
): SearchResult[] {
  ensureIndex();

  const rawQueryTokens = tokenize(query);
  const queryTokens = expandTokens(rawQueryTokens);

  if (queryTokens.length === 0) return [];

  const queryTf = new Map<string, number>();
  for (const t of queryTokens) {
    queryTf.set(t, (queryTf.get(t) || 0) + 1);
  }

  let queryNorm = 0;
  for (const [, freq] of queryTf) {
    queryNorm += freq * freq;
  }
  queryNorm = Math.sqrt(queryNorm);

  const scored = documents.map((doc) => ({
    entry: doc.entry,
    score: cosineSimilarity(queryTokens, queryTf, queryNorm, doc),
  }));

  return scored
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => ({
      entry: r.entry,
      score: r.score,
      source: 'retrieval' as const,
    }));
}

export function getConfidence(results: SearchResult[]): number {
  if (results.length === 0) return 0;
  return results[0].score;
}

export function shouldUseLLM(results: SearchResult[], threshold = 0.15): boolean {
  return results.length === 0 || getConfidence(results) < threshold;
}

export function getDatasetSize(): number {
  ensureIndex();
  return documents.length;
}
