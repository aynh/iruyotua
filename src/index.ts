import { uploadToCgas } from './cgas';
import { getImageUrl, getMaxImagesId } from './scraper';

export interface Env {
	CGAS_API_KEY?: string;
	DISCORD_WEBHOOK_URL: string;
}

const scheduled = (async (_controller, env, ctx) => {
	const maxImagesId = await getMaxImagesId();
	const randomImageId = Math.floor(Math.random() * (maxImagesId + 1));

	const imageUrl = await getImageUrl(randomImageId).then(async (url) => {
		if (env.CGAS_API_KEY !== undefined) {
			const cgasUrl = await uploadToCgas(url, env.CGAS_API_KEY);
			return cgasUrl ?? url;
		}

		return url;
	});

	const payload = { content: imageUrl };
	ctx.waitUntil(
		fetch(env.DISCORD_WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}),
	);
}) satisfies ExportedHandlerScheduledHandler<Env>;

export default { scheduled } satisfies ExportedHandler<Env>;
