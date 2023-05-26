import * as cheerio from 'cheerio';

export const getMaxImagesId = async () => {
	const $ = await cheerioFromUrl('https://dynasty-scans.com/images');

	const first = $('ul#images-lists.thumbnails > li.span2 > a.thumbnail').first();
	const href = first.attr()?.['href'];
	if (href === undefined) {
		throw new ScraperError('getMaxImagesId', 'first image href is empty');
	}

	const id = Number(href.split('/').at(-1)!); // get 26823 part of href="/images/26823"
	if (Number.isNaN(id)) {
		throw new ScraperError('getMaxImagesId', `got invalid id from ${href}`);
	}

	return id;
};

export const getImageUrl = async (id: number) => {
	const $ = await cheerioFromUrl(`https://dynasty-scans.com/images/${id}`);

	const img = $('div#main.images.show > div.image > img');
	const source = img.attr()?.['src'];
	if (source === undefined) {
		throw new ScraperError('getImageUrl', `${id} image source is empty`);
	}

	const url = new URL(source, 'https://dynasty-scans.com');
	url.search = ''; // clear the search params

	return url.href;
};

export const cheerioFromUrl = async (url: string) => {
	while (true) {
		const response = await fetch(url);

		if (response.status === 502) {
			// they randomly send failed response with this status
			continue;
		} else if (!response.ok) {
			throw new ScraperError('fetch', `${url} got response with status ${response.status}`);
		}

		const text = await response.text();
		return cheerio.load(text);
	}
};

export class ScraperError extends Error {
	func: string;

	constructor(func: string, message: string) {
		super(message);
		this.func = func;
	}

	toString() {
		return `${this.func}: ${this.message}`;
	}
}
