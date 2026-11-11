import { describe, expect, it } from 'vitest';

interface FsApi {
	readdirSync: (path: string, options: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[];
	readFileSync: (path: string, encoding: 'utf8') => string;
}

const SEARCH_TEMPLATE_MARKER = 'appTemplate="search"';

function processCwd(): string {
	return (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
}

function templatePaths(fs: FsApi, directory: string): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = `${directory}/${entry.name}`;
		if (entry.isDirectory()) return templatePaths(fs, path);
		return entry.name.endsWith('.html') && !entry.name.endsWith('.spec.html') ? [path] : [];
	});
}

const SEARCH_FIELDS_SUFFIX = '-search-fields.component.html';

async function loadSearchTemplates(): Promise<Record<string, string>> {
	const fs = (await import(/* @vite-ignore */ 'node:fs' as string)) as unknown as FsApi;
	const entries: [string, string][] = templatePaths(fs, `${processCwd()}/src/app`).map((path): [string, string] => [
		path,
		fs.readFileSync(path, 'utf8'),
	]);
	return Object.fromEntries(
		entries.filter(([, template]: [string, string]) => template.includes(SEARCH_TEMPLATE_MARKER)),
	);
}

async function loadSearchFieldTemplates(): Promise<string[]> {
	const fs = (await import(/* @vite-ignore */ 'node:fs' as string)) as unknown as FsApi;
	const searchTemplates = Object.values(await loadSearchTemplates());
	const fieldTemplates = templatePaths(fs, `${processCwd()}/src/app`)
		.filter((path) => path.endsWith(SEARCH_FIELDS_SUFFIX))
		.map((path) => fs.readFileSync(path, 'utf8'));
	return [...searchTemplates, ...fieldTemplates];
}

function submitsSearch(input: string): boolean {
	return (
		(input.includes('(keydown.enter)="searchQuery.submit()"') &&
			input.includes('(focusout)="searchQuery.submit()"')) ||
		(input.includes('(keydown.enter)="searched.emit()"') && input.includes('(focusout)="searched.emit()"'))
	);
}

describe('search template of the lists', () => {
	it('has no search button and never submits the form on its own', async () => {
		// Arrange
		const templates = await loadSearchTemplates();

		// Act
		const offenders = Object.entries(templates)
			.filter(
				([, template]) => template.includes('-search-submit') || /\(submit\)="[^"]*\bsearch\(\)/.test(template),
			)
			.map(([path]) => path);

		// Assert
		expect(Object.keys(templates).length).toBe(14);
		expect(offenders).toEqual([]);
	});

	it('searches right away when Enter is pressed or the focus leaves the text field, and labels the mobile Enter key as search', async () => {
		// Arrange
		const templates = await loadSearchFieldTemplates();

		// Act
		const inputs = templates.flatMap(
			(template): string[] => template.match(/<sgdf-input\s+data-test-id="[^"]*-q-input"[^>]*>/g) ?? [],
		);
		const unwired = inputs.filter((input) => !submitsSearch(input) || !input.includes('enterkeyhint="search"'));

		// Assert
		expect(inputs.length).toBe(10);
		expect(unwired).toEqual([]);
	});
});
