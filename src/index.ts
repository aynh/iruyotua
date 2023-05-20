import { uploadToCgas } from './cgas';
import { ScraperError, getImageUrl, getMaxImagesId } from './scraper';

export interface Env {
	CGAS_API_KEY?: string;
	DISCORD_WEBHOOK_URL: string;
}

const scheduled = (async (_controller, env, ctx) => {
	let content: string | undefined = undefined;

	try {
		const maxImagesId = await getMaxImagesId();
		const randomImageId = Math.floor(Math.random() * (maxImagesId + 1));

		content = await getImageUrl(randomImageId).then(async (url) => {
			if (env.CGAS_API_KEY !== undefined) {
				const cgasUrl = await uploadToCgas(url, env.CGAS_API_KEY);
				return cgasUrl ?? url;
			}

			return url;
		});
	} catch (error) {
		if (error instanceof ScraperError) {
			content = error.toString();
		}
	}

	if (content !== undefined) {
		ctx.waitUntil(
			fetch(env.DISCORD_WEBHOOK_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content }),
			}),
		);
	}
}) satisfies ExportedHandlerScheduledHandler<Env>;

export default { scheduled } satisfies ExportedHandler<Env>;
