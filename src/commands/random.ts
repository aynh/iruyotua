import { getImageUrl, getMaxImagesId } from '../scraper';
import { Command, ApplicationCommandType, InteractionCallbackType } from './types';

export const random = {
	command: {
		name: 'random',
		type: ApplicationCommandType.CHAT_INPUT,
		description: 'Get a random dynasty-scans.com image',
	},
	callback: async () => {
		const maxImagesId = await getMaxImagesId();
		const randomImageId = Math.floor(Math.random() * (maxImagesId + 1));

		const content = await getImageUrl(randomImageId);

		return {
			type: InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: { content },
		};
	},
} satisfies Command;
