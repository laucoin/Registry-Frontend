import { signal } from '@angular/core';

import { EMPTY, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { UiFacade } from '@core/registry/state/ui.facade';
import { eager, initialize, notifyOnError, reportError, withLoading } from '@shared/helpers/rx.helper';
import { backendError, ERROR_500, ERROR_503 } from '@shared/helpers/testing/test-fixtures';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ErrorModel } from '@shared/models/model/error.model';

describe('rx helpers', () => {
	let notify: Mock<(message: unknown) => void>;
	let uiFacade: UiFacade;

	beforeEach(() => {
		notify = vi.fn();
		uiFacade = { notify } as unknown as UiFacade;
	});

	describe('reportError', () => {
		it('shows a 503 as a sticky error toast like any other error', () => {
			// Arrange
			const error = ERROR_503;

			// Act
			reportError(uiFacade, error);

			// Assert
			expect(notify).toHaveBeenCalledWith(
				expect.objectContaining({ severity: SeverityEnum.ERROR, sticky: true }),
			);
		});

		it('falls back on the unknown error title when the backend error has none', () => {
			// Arrange
			const error = backendError(500, undefined, 'Message');

			// Act
			reportError(uiFacade, error);

			// Assert
			expect(notify).toHaveBeenCalledWith(
				expect.objectContaining({ summary: 'global.notifications.UNKNOWN_ERROR.title', detail: 'Message' }),
			);
		});

		it('never shows the raw message of a local exception', () => {
			// Arrange
			const error = new TypeError('labels is not iterable') as unknown as ErrorModel;

			// Act
			reportError(uiFacade, error);

			// Assert
			expect(notify.mock.calls[0][0]).not.toHaveProperty('summary');
			expect(notify.mock.calls[0][0]).not.toHaveProperty('detail');
		});

		it('shows any other error as a sticky error toast', () => {
			// Arrange
			const error = ERROR_500;

			// Act
			reportError(uiFacade, error);

			// Assert
			expect(notify).toHaveBeenCalledWith(
				expect.objectContaining({
					severity: SeverityEnum.ERROR,
					summary: 'Title',
					detail: 'Message',
					sticky: true,
				}),
			);
		});

		it('shows nothing for an unauthorized call, already sent back to the sign-in', () => {
			// Arrange
			const error = backendError(401, 'Not signed in', 'Sign in');

			// Act
			reportError(uiFacade, error);

			// Assert
			expect(notify).not.toHaveBeenCalled();
		});
	});

	describe('notifyOnError', () => {
		it('lets values through untouched', () => {
			// Arrange
			const received: number[] = [];

			// Act
			of(1, 2)
				.pipe(notifyOnError(uiFacade))
				.subscribe((value) => received.push(value));

			// Assert
			expect(received).toEqual([1, 2]);
			expect(notify).not.toHaveBeenCalled();
		});

		it('reports the error and completes without emitting', () => {
			// Arrange
			let completed = false;
			const received: number[] = [];

			// Act
			throwError(() => ERROR_500)
				.pipe(notifyOnError(uiFacade))
				.subscribe({
					next: (value) => received.push(value),
					complete: () => {
						completed = true;
					},
				});

			// Assert
			expect(notify).toHaveBeenCalledTimes(1);
			expect(received).toEqual([]);
			expect(completed).toBe(true);
		});
	});

	describe('initialize', () => {
		it('runs the callback when the source is subscribed, not when the pipe is built', () => {
			// Arrange
			const onSubscribe: Mock<() => void> = vi.fn();
			const piped: ReturnType<typeof EMPTY.pipe> = EMPTY.pipe(initialize(onSubscribe));
			const calledBeforeSubscribe = onSubscribe.mock.calls.length;

			// Act
			piped.subscribe();

			// Assert
			expect(calledBeforeSubscribe).toBe(0);
			expect(onSubscribe).toHaveBeenCalledTimes(1);
		});
	});

	describe('withLoading', () => {
		it('raises the flag while the source is in flight and lowers it on completion', () => {
			// Arrange
			const loading = signal(false);
			const source = new Subject<number>();
			source.pipe(withLoading(loading)).subscribe();
			const whileRunning = loading();

			// Act
			source.complete();

			// Assert
			expect(whileRunning).toBe(true);
			expect(loading()).toBe(false);
		});

		it('lowers the flag when the source fails', () => {
			// Arrange
			const loading = signal(false);

			// Act
			throwError(() => new Error('x'))
				.pipe(withLoading(loading))
				.subscribe({ error: (): void => undefined });

			// Assert
			expect(loading()).toBe(false);
		});
	});

	describe('eager', () => {
		it('runs the source without any subscriber', () => {
			// Arrange
			const run: Mock<() => void> = vi.fn();
			const source = of(1).pipe(initialize(run));

			// Act
			eager(source);

			// Assert
			expect(run).toHaveBeenCalledTimes(1);
		});

		it('replays the outcome to a late subscriber', () => {
			// Arrange
			const emitted: number[] = [];
			const result = eager(of(7));

			// Act
			result.subscribe((value) => emitted.push(value));

			// Assert
			expect(emitted).toEqual([7]);
		});
	});
});
