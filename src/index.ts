// @ts-expect-error upstream type issue
import verifyInteractionSignature from '@discord-interactions/verify';

import { uploadToCgas } from './cgas';
import { commands } from './commands';
import { Interaction, InteractionCallbackType, InteractionResponse, InteractionType } from './commands/types';
import { getImageUrl, getMaxImagesId } from './scraper';
import { ScraperError, ScraperErrorKind } from './scraper/error';

export interface Env {
	CGAS_API_KEY?: string;
	DISCORD_WEBHOOK_URL: string;
	DISCORD_APPLICATION_ID?: string;
	DISCORD_APPLICATION_PUBLIC_KEY?: string;
	DISCORD_APPLICATION_TOKEN?: string;
}

const fetch = (async (request, env, _ctx) => {
	if (
		env.DISCORD_APPLICATION_ID === undefined ||
		env.DISCORD_APPLICATION_PUBLIC_KEY === undefined ||
		env.DISCORD_APPLICATION_TOKEN === undefined
	) {
		return new Response('NOOP');
	}

	const url = new URL(request.url);
	switch (url.pathname) {
		case '/interactions': {
			if (request.method !== 'POST') {
				return new Response(undefined, { status: 405 });
			}

			const signature = request.headers.get('X-Signature-Ed25519')!;
			const timestamp = request.headers.get('X-Signature-Timestamp')!;
			const body = await request.text();
			const isValidRequest: boolean = await verifyInteractionSignature(
				env.DISCORD_APPLICATION_PUBLIC_KEY,
				signature,
				timestamp,
				body,
			);

			if (!isValidRequest) {
				return new Response(undefined, { status: 401 });
			}

			const interaction = JSON.parse(body) as Interaction;
			switch (interaction.type) {
				case InteractionType.PING: {
					const payload = { type: InteractionCallbackType.PONG } satisfies InteractionResponse;
					return new Response(JSON.stringify(payload), {
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case InteractionType.APPLICATION_COMMAND: {
					const command = commands[interaction.data!.name];
					if (command !== undefined) {
						const payload = await command.callback(interaction, env);
						return new Response(JSON.stringify(payload), {
							headers: { 'Content-Type': 'application/json' },
						});
					}
				}
			}

			return new Response(undefined, { status: 400 });
		}

		case '/register': {
			// must use the application token in the search query to register the commands
			if (url.searchParams.get('token') !== env.DISCORD_APPLICATION_TOKEN) {
				return new Response(undefined, { status: 400 });
			}

			const endpoint = `https://discord.com/api/v10/applications/${env.DISCORD_APPLICATION_ID}/commands`;
			const responses = await Promise.all(
				Object.values(commands).map(async ({ command }) => {
					const response = await globalThis.fetch(endpoint, {
						method: 'POST',
						headers: {
							Authorization: `Bot ${env.DISCORD_APPLICATION_TOKEN}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(command),
					});

					return { name: command.name, response };
				}),
			);

			if (responses.every(({ response }) => response.ok)) {
				return new Response('Registered');
			} else {
				const errors = await Promise.all(
					responses.map(async ({ name, response }) => [name, await response.text()]),
				).then(Object.fromEntries);
				return new Response(JSON.stringify({ errors }), {
					headers: { 'Content-Type': 'application/json' },
					status: 500,
				});
			}
		}

		default:
			return new Response(undefined, { status: 404 });
	}
}) satisfies ExportedHandlerFetchHandler<Env>;

const scheduled = (async (_controller, env, ctx) => {
	let content: string | undefined = undefined;

	while (content === undefined) {
		try {
			const maxImagesId = await getMaxImagesId();
			const randomImageId = Math.floor(Math.random() * (maxImagesId + 1));

			const url = await getImageUrl(randomImageId);
			if (env.CGAS_API_KEY !== undefined) {
				const cgasUrl = await uploadToCgas(url, env.CGAS_API_KEY);
				content = cgasUrl ?? url;
			} else {
				content = url;
			}
		} catch (error) {
			if (!(error instanceof ScraperError)) {
				// ignore unknown errors
				throw error;
			} else {
				switch (error.value.type) {
					case ScraperErrorKind.InvalidHtml: {
						content = error.toString();
						break;
					}

					case ScraperErrorKind.ResponseError: {
						if (error.value.status === 502) {
							// they randomly send response with this status
							// so we sleep for 5 seconds
							await new Promise((resolve) => setTimeout(resolve, 5000));
						}

						break;
					}
				}
			}
		}
	}

	ctx.waitUntil(
		globalThis.fetch(env.DISCORD_WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content }),
		}),
	);
}) satisfies ExportedHandlerScheduledHandler<Env>;

export default { fetch, scheduled } satisfies ExportedHandler<Env>;
