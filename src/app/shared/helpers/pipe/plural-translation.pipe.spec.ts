import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { PluralTranslationPipe } from './plural-translation.pipe';

describe('PluralTranslationPipe', () => {
	let pipe: PluralTranslationPipe;

	beforeEach(() => {
		const translations: Record<string, string> = { 'zero.zero': 'none', 'zero.two': 'pair' };
		TestBed.configureTestingModule({
			providers: [
				PluralTranslationPipe,
				{
					provide: TranslocoService,
					useValue: { getActiveLang: (): string => 'fr', getTranslation: (): object => translations },
				},
			],
		});
		pipe = TestBed.inject(PluralTranslationPipe);
	});

	it('uses the zero key when it exists', () => {
		// Arrange
		const key = 'zero';

		// Act
		const result = pipe.transform(key, 0);

		// Assert
		expect(result).toBe('zero.zero');
	});

	it('falls back to the one key for zero when no zero key exists', () => {
		// Arrange
		const key = 'plain';

		// Act
		const result = pipe.transform(key, []);

		// Assert
		expect(result).toBe('plain.one');
	});

	it('uses the one key for a single element', () => {
		// Arrange
		const key = 'plain';

		// Act
		const result = pipe.transform(key, ['a']);

		// Assert
		expect(result).toBe('plain.one');
	});

	it.each([
		{ name: 'uses the two key when it exists', key: 'zero', expected: 'zero.two' },
		{ name: 'falls back to the few key when the two key is missing', key: 'plain', expected: 'plain.few' },
	])('$name', ({ key, expected }) => {
		// Arrange
		const size = 2;

		// Act
		const result = pipe.transform(key, size);

		// Assert
		expect(result).toBe(expected);
	});

	it.each([
		{ name: 'a larger size', size: 5 },
		{ name: 'an unknown size', size: undefined },
	])('uses the few key for $name', ({ size }) => {
		// Arrange
		const key = 'plain';

		// Act
		const result = pipe.transform(key, size);

		// Assert
		expect(result).toBe('plain.few');
	});
});
