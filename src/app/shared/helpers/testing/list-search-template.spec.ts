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
		expect(Object.keys(templates).length).toBe(16);
		expect(offenders).toEqual([]);
	});

	it('searches right away when Enter is pressed or the focus leaves the text field, and labels the mobile Enter key as search', async () => {
		// Arrange
		const templates = await loadSearchTemplates();

		// Act
		const inputs = Object.values(templates).flatMap(
			(template): string[] => template.match(/<sgdf-input\s+data-testid="[^"]*-q-input"[^>]*>/g) ?? [],
		);
		const unwired = inputs.filter(
			(input) =>
				!input.includes('(keydown.enter)="searchQuery.submit()"') ||
				!input.includes('(focusout)="searchQuery.submit()"') ||
				!input.includes('enterkeyhint="search"'),
		);

		// Assert
		expect(inputs.length).toBe(12);
		expect(unwired).toEqual([]);
	});
});
