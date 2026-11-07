import { describe, expect, it } from 'vitest';

interface FsApi {
	readdirSync: (path: string, options: { withFileTypes: true }) => { name: string; isDirectory: () => boolean }[];
	readFileSync: (path: string, encoding: 'utf8') => string;
}

interface TemplateTag {
	tag: string;
	attributes: string;
}

const TEST_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)+$/;
const INTERACTIVE_TAGS: ReadonlySet<string> = new Set([
	'sgdf-button',
	'sgdf-icon-button',
	'sgdf-input',
	'sgdf-select',
	'sgdf-textarea',
	'sgdf-date-time-picker',
	'sgdf-switch',
	'sgdf-checkbox',
	'sgdf-radio-group',
	'sgdf-radio',
	'sgdf-number-input',
	'sgdf-duration-picker',
	'sgdf-copy-button',
	'sgdf-nav-item',
	'sgdf-menu-item',
	'sgdf-tab',
	'sgdf-tile',
	'sgdf-dialog',
	'sgdf-drawer',
	'form',
	'button',
	'app-list',
	'app-section-error',
	'app-load-more',
	'app-form-dialog',
	'app-form-actions',
	'app-element-actions',
	'app-favorite-toggle',
	'app-select-elements-field',
	'app-number-range-field',
]);

function processCwd(): string {
	return (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
}

async function templatePaths(fs: FsApi, directory: string): Promise<string[]> {
	const entries = fs.readdirSync(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const path = `${directory}/${entry.name}`;
			if (entry.isDirectory()) return templatePaths(fs, path);
			return entry.name.endsWith('.html') && !entry.name.endsWith('.spec.html') ? [path] : [];
		}),
	);
	return nested.flat();
}

function tagsOf(template: string): TemplateTag[] {
	const tags: TemplateTag[] = [];
	for (const match of template.matchAll(/<([a-z][a-z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
		tags.push({ tag: match[1], attributes: match[2] });
	}
	return tags;
}

function testIdsOf(tags: TemplateTag[]): string[] {
	return tags
		.map((it) => /\sdata-testid="([^"]+)"/.exec(it.attributes)?.[1])
		.filter((it): it is string => it !== undefined);
}

describe('data-testid of the templates', () => {
	let templates: Record<string, string>;

	async function load(): Promise<Record<string, string>> {
		const fs = (await import(/* @vite-ignore */ 'node:fs' as string)) as unknown as FsApi;
		const paths = await templatePaths(fs, `${processCwd()}/src`);
		return Object.fromEntries(paths.map((path) => [path, fs.readFileSync(path, 'utf8')]));
	}

	it('marks every interactive element', async () => {
		// Arrange
		templates = await load();

		// Act
		const missing = Object.entries(templates).flatMap(([path, template]) =>
			tagsOf(template)
				.filter((it) => INTERACTIVE_TAGS.has(it.tag) && !/\sdata-testid="/.test(it.attributes))
				.map((it) => `${path} <${it.tag}>`),
		);

		// Assert
		expect(Object.keys(templates).length).toBeGreaterThan(50);
		expect(missing).toEqual([]);
	});

	it('never repeats a test id inside a template', async () => {
		// Arrange
		templates = await load();

		// Act
		const duplicated = Object.entries(templates).flatMap(([path, template]) => {
			const ids = testIdsOf(tagsOf(template));
			return ids.filter((id, index) => ids.indexOf(id) !== index).map((id) => `${path} ${id}`);
		});

		// Assert
		expect(duplicated).toEqual([]);
	});

	it('writes every test id as lowercase kebab words', async () => {
		// Arrange
		templates = await load();

		// Act
		const invalid = Object.values(templates)
			.flatMap((template) => testIdsOf(tagsOf(template)))
			.filter((id) => !TEST_ID_PATTERN.test(id));

		// Assert
		expect(invalid).toEqual([]);
	});
});
