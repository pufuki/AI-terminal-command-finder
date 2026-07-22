import type { CommandEntry } from '@/lib/types';
import { fileSystemCommands } from './filesystem';
import { textProcessingCommands } from './textproc';
import { networkCommands } from './network';
import { processCommands } from './process';
import { gitCommands } from './git';
import { systemCommands } from './system';
import { devCommands } from './dev';
import { miscCommands } from './misc';

export const allCommands: CommandEntry[] = [
  ...fileSystemCommands,
  ...textProcessingCommands,
  ...networkCommands,
  ...processCommands,
  ...gitCommands,
  ...systemCommands,
  ...devCommands,
  ...miscCommands,
];

export const categories = Array.from(
  new Set(allCommands.map((c) => c.category)),
).sort();
