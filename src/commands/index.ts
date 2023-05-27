import { random } from './random';
import { Command } from './types';

export const commands: Record<string, Command> = Object.fromEntries(
	[random].map((value) => [value.command.name, value]),
);
