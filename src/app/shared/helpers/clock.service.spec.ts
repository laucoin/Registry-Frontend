import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClockService } from '@shared/helpers/clock.service';

describe('ClockService', () => {
	const START = new Date('2026-01-05T10:00:00Z').getTime();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(START);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('gives the current time once created', () => {
		// Arrange
		const clock = TestBed.inject(ClockService);

		// Act
		const now = clock.now();

		// Assert
		expect(now).toBe(START);
	});

	it('moves on every second', () => {
		// Arrange
		const clock = TestBed.inject(ClockService);

		// Act
		vi.advanceTimersByTime(2000);

		// Assert
		expect(clock.now()).toBe(START + 2000);
	});

	it('stops ticking once its injector is destroyed', () => {
		// Arrange
		const clock = TestBed.inject(ClockService);
		TestBed.resetTestingModule();

		// Act
		vi.advanceTimersByTime(2000);

		// Assert
		expect(clock.now()).toBe(START);
	});
});
