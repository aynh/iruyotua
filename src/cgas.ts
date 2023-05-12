export const uploadToCgas = async (url: string, api_key: string) => {
	if (!url.endsWith('.png') && !url.endsWith('.jpg')) return;

	const response = await fetch(url);
	const blob = await response.blob();

	if (!blob.type.startsWith('image')) return;

	const file = new File([blob], url.split('/').at(-1)!, { type: blob.type });
	const body = new FormData();
	body.set('key', api_key);
	body.set('file', file);

	return fetch('https://cgas.io/api/upload', { body, method: 'POST' })
		.then((response) => (response.ok ? response.json<{ url?: string }>() : undefined))
		.then((cgas) => cgas?.url);
};
