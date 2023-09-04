import * as cheerio from 'cheerio';

import { ScraperError, ScraperErrorKind } from './error';

export const downloadImage = async (id: number) => {
	const url = await getImageUrl(id);
	const response = await globalThis.fetch(url);
	const blob = await response.blob();

	return new File([blob], url.split('/').at(-1)!, { type: blob.type });
};

export const getMaxImagesId = async () => {
	const url = 'https://dynasty-scans.com/images';
	const $ = await cheerioFromUrl(url);

	const path = 'ul#images-lists.thumbnails > li.span2 > a.thumbnail';
	const first = $(path).first();
	const href = first.attr()?.['href'];
	if (href === undefined) {
		throw new ScraperError({ type: ScraperErrorKind.InvalidHtml, detail: 'first image href is empty', path, url });
	}

	const id = Number(href.split('/').at(-1)!); // get 26823 part of href="/images/26823"
	if (Number.isNaN(id)) {
		throw new ScraperError({
			type: ScraperErrorKind.InvalidHtml,
			detail: 'id from the first image href is not a number',
			path,
			url,
		});
	}

	return id;
};

export const getImageUrl = async (id: number) => {
	const url = `https://dynasty-scans.com/images/${id}`;
	const $ = await cheerioFromUrl(url);

	const path = 'div#main.images.show > div.image > img';
	const img = $(path);
	const source = img.attr()?.['src'];
	if (source === undefined) {
		throw new ScraperError({ type: ScraperErrorKind.InvalidHtml, detail: 'image source is empty', path, url });
	}

	const url_ = new URL(source, 'https://dynasty-scans.com');
	url_.search = ''; // clear the search params

	return url_.href;
};

export const cheerioFromUrl = async (url: string) => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new ScraperError({ type: ScraperErrorKind.ResponseError, status: response.status, url });
	}

	const text = await response.text();
	return cheerio.load(text);
};
