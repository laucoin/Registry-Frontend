import { TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { TestPageBlock, TestPageStore } from '@shared/helpers/store/testing/test-page.store';
import { PageSlice, trackPage } from '@shared/helpers/store/track-page.operator';
import { ErrorModel } from '@shared/models/model/error.model';

describe('track-page operator', () => {
	let store: InstanceType<typeof TestPageStore>;
	let slice: PageSlice<TestPageBlock>;

	beforeEach(() => {
		store = TestBed.inject(TestPageStore);
		slice = store.itemsSlice();
	});

	it('reads and writes the targeted block of the store', () => {
		// Arrange
		const block: TestPageBlock = { ...slice.read(), loading: true };

		// Act
		slice.write(block);

		// Assert
		expect(store.items().loading).toBe(true);
		expect(slice.read()).toEqual(block);
	});

	it('flags the block as loading while the request is in flight', () => {
		// Arrange
		const source = new Subject<string>();
		source.pipe(trackPage(slice)).subscribe();

		// Act
		const loadingWhileInFlight = store.items().loading;
		source.complete();

		// Assert
		expect(loadingWhileInFlight).toBe(true);
		expect(store.items().loading).toBe(false);
	});

	it('clears the previous error when a new request starts', () => {
		// Arrange
		slice.write({ ...slice.read(), error: { summary: 'Old', detail: 'Old' } });
		const source = new Subject<string>();

		// Act
		source.pipe(trackPage(slice)).subscribe();

		// Assert
		expect(store.items().error).toBeUndefined();
	});

	it('stores an error in the block and completes without emitting', () => {
		// Arrange
		const source = new Subject<string>();
		const emitted: string[] = [];
		const completed: Mock<() => void> = vi.fn();
		source.pipe(trackPage(slice)).subscribe({ next: (value) => emitted.push(value), complete: completed });

		// Act
		source.error({ status: 500, title: 'Title', message: 'Message' } as ErrorModel);

		// Assert
		expect(store.items().error?.summary).toBe('Title');
		expect(store.items().loading).toBe(false);
		expect(emitted).toEqual([]);
		expect(completed).toHaveBeenCalledTimes(1);
	});

	it('stores a 503 in the block like any other error', () => {
		// Arrange
		const source = new Subject<string>();
		const error = { status: 503, title: 'Down', message: 'Down' } as ErrorModel;
		source.pipe(trackPage(slice)).subscribe();

		// Act
		source.error(error);

		// Assert
		expect(store.items().error?.summary).toBe('Down');
		expect(store.items().loading).toBe(false);
	});
});
