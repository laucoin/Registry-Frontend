import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';

import { AlertsListPage } from './alerts-list.page';

const STATISTICS: AlertStatisticsModel = {
	resolvedCount: 13,
	canceledCount: 2,
	averageResolutionSeconds: 8100,
	realAlertRate: 13 / 15,
};

interface StatElement extends HTMLElement {
	title: string;
	hint: string;
	loading: boolean;
}

describe('AlertsListPage statistics', () => {
	let fixture: ComponentFixture<AlertsListPage>;
	let statistics: WritableSignal<AlertStatisticsModel | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let facade: Record<string, unknown>;

	function stat(testId: string): StatElement {
		return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
	}

	beforeEach(async () => {
		statistics = signal<AlertStatisticsModel | undefined>(STATISTICS);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		facade = {
			alertStatistics: statistics,
			alertStatisticsLoading: loading,
			alertStatisticsError: error,
			alertsPage: signal(undefined),
			alertsPageLoading: signal(false),
			alertsPageSilentLoading: signal(false),
			alertsPageError: signal(undefined),
			alertsPageQueryParam: signal(undefined),
			alertsPageStatusParam: signal(undefined),
			alertsPageIsVisibleParam: signal(undefined),
			alertsPageFromParam: signal(undefined),
			alertsPageToParam: signal(undefined),
			alertStatusMetadata: signal([]),
			visibilitiesMetadata: signal([]),
			fetchAlertStatistics: vi.fn(),
			fetchAlertsPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		};
		await MockBuilder(AlertsListPage)
			.mock(TranslocoPipe, (key: string, params?: object): string =>
				params ? `${key}:${JSON.stringify(params)}` : key,
			)
			.provide({ provide: AlertFacade, useValue: facade })
			.provide({
				provide: ActivatedRoute,
				useValue: {
					queryParamMap: of(convertToParamMap({})),
					snapshot: { queryParamMap: convertToParamMap({}) },
				},
			});
		fixture = TestBed.createComponent(AlertsListPage);
		fixture.detectChanges();
	});

	it('asks for the statistics and the first page of alerts when displayed', () => {
		// Arrange

		// Act
		const calls = [facade['fetchAlertStatistics'], facade['fetchAlertsPage']];

		// Assert
		expect(calls[0]).toHaveBeenCalledTimes(1);
		expect(calls[1]).toHaveBeenCalledWith(undefined, undefined);
	});

	it('shows the average resolution time as an ISO duration with its hint', () => {
		// Arrange

		// Act
		const resolution = stat('alerts-list-resolution-stat');

		// Assert
		expect(resolution.title).toBe('alerts.statistics.resolution.title');
		expect(resolution.hint).toBe('alerts.statistics.resolution.hint');
		expect((resolution.querySelector('sgdf-format-duration') as unknown as { value: string }).value).toBe(
			'PT2H15M',
		);
	});

	it('shows the real alert rate as a percentage and explains it with the closed alerts', () => {
		// Arrange

		// Act
		const rate = stat('alerts-list-rate-stat');

		// Assert
		expect(rate.hint).toBe('alerts.statistics.rate.hint:{"resolved":13,"closed":15}');
		expect((rate.querySelector('sgdf-format-number') as unknown as { value: number }).value).toBeCloseTo(13 / 15);
	});

	it('shows a rate of zero as a value and not as missing data', () => {
		// Arrange
		statistics.set({ resolvedCount: 0, canceledCount: 4, averageResolutionSeconds: undefined, realAlertRate: 0 });

		// Act
		fixture.detectChanges();

		// Assert
		expect(
			(stat('alerts-list-rate-stat').querySelector('sgdf-format-number') as unknown as { value: number }).value,
		).toBe(0);
	});

	it('shows the empty hints and no value when nothing is closed yet', () => {
		// Arrange
		statistics.set({
			resolvedCount: 0,
			canceledCount: 0,
			averageResolutionSeconds: undefined,
			realAlertRate: undefined,
		});

		// Act
		fixture.detectChanges();

		// Assert
		expect(stat('alerts-list-resolution-stat').hint).toBe('alerts.statistics.resolution.empty');
		expect(stat('alerts-list-rate-stat').hint).toContain('alerts.statistics.rate.empty');
		expect(stat('alerts-list-rate-stat').querySelector('sgdf-format-number')).toBeNull();
		expect(stat('alerts-list-resolution-stat').querySelector('sgdf-format-duration')).toBeNull();
	});

	it('shows no hint before the statistics are loaded', () => {
		// Arrange
		statistics.set(undefined);
		loading.set(true);

		// Act
		fixture.detectChanges();

		// Assert
		expect(stat('alerts-list-resolution-stat').hint).toBe('');
		expect(stat('alerts-list-rate-stat').hint).toBe('');
	});

	it('flags both statistics as loading while they load', () => {
		// Arrange
		loading.set(true);

		// Act
		fixture.detectChanges();

		// Assert
		expect(stat('alerts-list-resolution-stat').loading).toBe(true);
		expect(stat('alerts-list-rate-stat').loading).toBe(true);
	});

	it('replaces the statistics with the failure and retries when asked', () => {
		// Arrange
		error.set({ summary: 'Unavailable', detail: 'Try later' });
		fixture.detectChanges();

		// Act
		ngMocks.output(ngMocks.find(SectionErrorComponent), 'retry').emit();

		// Assert
		expect(stat('alerts-list-resolution-stat')).toBeNull();
		expect(facade['fetchAlertStatistics']).toHaveBeenCalledTimes(2);
	});

	it('writes the submitted filters in the url and restarts from the first batch', () => {
		// Arrange
		const navigate: ReturnType<typeof vi.fn> = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
		fixture.componentInstance['model'].set({
			q: 'sos',
			status: '',
			isVisible: '',
			from: null,
			to: null,
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		fixture.componentInstance['search']();

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith(
			'sos',
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
		);
		expect(facade['fetchAlertsPage']).toHaveBeenLastCalledWith(0, undefined);
		expect(navigate).toHaveBeenCalledWith(
			[],
			expect.objectContaining({
				queryParams: { q: 'sos', status: null, isVisible: null, from: null, to: null, sort: null },
			}),
		);
	});
});
