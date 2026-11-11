import { Signal, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SelectOptionModel } from '@shared/models/model/select-option.model';

import { GenericFacade } from './generic.facade';

class TestFacade extends GenericFacade {
	public label(label: string | undefined): string | undefined {
		return this.translateLabel(label);
	}

	public options(
		source: Signal<SelectOptionModel<boolean | undefined>[]>,
	): Signal<SelectOptionModel<boolean | undefined>[]> {
		return this.translatedOptions(source);
	}
}

describe('GenericFacade', () => {
	const translate: Mock<(key: string) => string> = vi.fn((key: string) => `translated:${key}`);
	let facade: TestFacade;

	beforeEach(() => {
		translate.mockClear();
		TestBed.configureTestingModule({ providers: [{ provide: TranslocoService, useValue: { translate } }] });
		facade = TestBed.runInInjectionContext(() => new TestFacade());
	});

	it('translates a label key', () => {
		// Arrange
		const key = 'global.menu.projects';

		// Act
		const result = facade.label(key);

		// Assert
		expect(result).toBe('translated:global.menu.projects');
		expect(translate).toHaveBeenCalledWith(key);
	});

	it('keeps the empty option label untouched', () => {
		// Arrange
		const emptyLabel = '-';

		// Act
		const result = facade.label(emptyLabel);

		// Assert
		expect(result).toBe('-');
		expect(translate).not.toHaveBeenCalled();
	});

	it('keeps a missing label undefined', () => {
		// Arrange
		const missingLabel = undefined;

		// Act
		const result = facade.label(missingLabel);

		// Assert
		expect(result).toBeUndefined();
		expect(translate).not.toHaveBeenCalled();
	});

	it('translates a list of options but its empty option, and follows its changes', () => {
		// Arrange
		const source: WritableSignal<SelectOptionModel<boolean | undefined>[]> = signal([
			{ label: '-', value: undefined },
			{ label: 'yes', value: true },
		]);
		const options = facade.options(source);

		// Act
		source.update((items) => [...items, { label: 'no', value: false }]);

		// Assert
		expect(options().map((option) => option.label)).toEqual(['-', 'translated:yes', 'translated:no']);
	});
});
