import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component';
import { LoadMoreHarness } from '@shared/ui/common/load-more/testing/load-more.harness';

describe('LoadMoreComponent', () => {
	let callback: IntersectionObserverCallback;
	let observe: Mock<(target: Element) => void>;
	let fixture: ComponentFixture<LoadMoreComponent>;
	let harness: LoadMoreHarness;
	let emitted: number;

	const intersect = (isIntersecting: boolean): void =>
		callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

	const setInput = async (name: string, value: unknown): Promise<void> => {
		fixture.componentRef.setInput(name, value);
		await fixture.whenStable();
	};

	beforeEach(async () => {
		observe = vi.fn();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(cb: IntersectionObserverCallback) {
					callback = cb;
				}
				public observe: Mock<(target: Element) => void> = observe;
				public unobserve: Mock<() => void> = vi.fn();
				public disconnect: Mock<() => void> = vi.fn();
			},
		);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
		fixture = TestBed.createComponent(LoadMoreComponent);
		fixture.componentRef.setInput('loadedCount', 20);
		fixture.componentRef.setInput('total', 50);
		emitted = 0;
		fixture.componentInstance.loadMore.subscribe(() => emitted++);
		harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, LoadMoreHarness);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('asks for the next batch when the sentinel becomes visible', () => {
		// Arrange

		// Act
		intersect(true);

		// Assert
		expect(emitted).toBe(1);
	});

	it('does nothing when the sentinel is not visible', () => {
		// Arrange

		// Act
		intersect(false);

		// Assert
		expect(emitted).toBe(0);
	});

	it.each([
		{ name: 'while a batch is loading', input: 'loading', value: true },
		{ name: 'when auto load is disabled', input: 'autoLoad', value: false },
	])('does not ask $name', async ({ input, value }) => {
		// Arrange
		await setInput(input, value);

		// Act
		intersect(true);

		// Assert
		expect(emitted).toBe(0);
	});

	it('asks when the button is clicked even without auto load', async () => {
		// Arrange
		await setInput('autoLoad', false);

		// Act
		await harness.loadMore();

		// Assert
		expect(emitted).toBe(1);
	});

	it('watches the sentinel again once a batch is loaded, so a still visible sentinel asks for the next one', async () => {
		// Arrange
		await setInput('loading', true);
		const watched = observe.mock.calls.length;

		// Act
		await setInput('loading', false);

		// Assert
		expect(observe.mock.calls.length).toBe(watched + 1);
	});

	it('shows the loaded count and the loading state of the button', async () => {
		// Arrange
		await setInput('loading', true);

		// Act
		const shown = [await harness.countText(), await harness.loading()];

		// Assert
		expect(shown).toEqual(['fr.global.list.loaded-count', true]);
	});
});
