import { describe, expect, it } from 'vitest';

import { getImageUrl, getMaxImagesId } from '.';

describe('getMaxImagesId', () => {
	it('should works', async () => {
		const ret = await getMaxImagesId();
		expect(ret).not.toBeNaN();
	});
});

describe('getImageUrl', () => {
	it('should works', async () => {
		const ret = await getImageUrl(20000);
		const url = new URL(ret);
		expect(url.origin).toBe('https://dynasty-scans.com');
		expect(url.pathname).not.toBe('/');
	});
});
