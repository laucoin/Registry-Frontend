import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';

describe('BooleanChoicePipe', () => {
	it('gives the option value of each visibility choice', () => {
		// Arrange
		const pipe = TestBed.configureTestingModule({ providers: [BooleanChoicePipe] }).inject(BooleanChoicePipe);

		// Act
		const values: string[] = [undefined, true, false].map((choice): string => pipe.transform(choice));

		// Assert
		expect(values).toEqual(['', 'true', 'false']);
	});
});
