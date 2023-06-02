export enum ScraperErrorKind {
	InvalidHtml,
	ResponseError,
}

export type ScraperErrorBody = (
	| { type: ScraperErrorKind.ResponseError; status: number }
	| { type: ScraperErrorKind.InvalidHtml; detail: string; path: string }
) & { url: string };

export class ScraperError extends Error {
	value: ScraperErrorBody;

	constructor(body: ScraperErrorBody) {
		super();
		this.value = body;
	}

	toString(): string {
		const { value } = this;
		switch (value.type) {
			case ScraperErrorKind.InvalidHtml:
				return `${value.detail} at ${value.path} from ${value.url}`;

			case ScraperErrorKind.ResponseError:
				return `got ${value.status} code while fetching at ${value.url}`;
		}
	}
}
