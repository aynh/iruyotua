import { Env } from '..';

export enum ApplicationCommandType {
	CHAT_INPUT = 1,
	USER = 2,
	MESSAGE = 3,
}

export interface ApplicationCommand {
	name: string;
	type: ApplicationCommandType;
	description: string;
}

export enum InteractionType {
	PING = 1,
	APPLICATION_COMMAND = 2,
	MESSAGE_COMPONENT = 3,
	APPLICATION_COMMAND_AUTOCOMPLETE = 4,
	MODAL_SUBMIT = 5,
}

export interface Interaction {
	type: InteractionType;
	data?: {
		name: string;
	};
}

export enum InteractionCallbackType {
	PONG = 1,
	CHANNEL_MESSAGE_WITH_SOURCE = 4,
	DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
	DEFERRED_UPDATE_MESSAGE = 6,
	UPDATE_MESSAGE = 7,
	APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
}

export interface InteractionResponse {
	type: InteractionCallbackType;
	data?: {
		content?: string;
	};
}

export type InteractionCallback = (interaction: Interaction, env: Env) => Promise<InteractionResponse>;

export interface Command {
	command: ApplicationCommand;
	callback: InteractionCallback;
}
