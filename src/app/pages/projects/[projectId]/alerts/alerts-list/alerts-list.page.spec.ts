import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { NEVER, Observable } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertsListPage } from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.page';
import { AlertsListHarness } from '@pages/projects/[projectId]/alerts/alerts-list/testing/alerts-list.harness';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { communicationFacadeStub } from '@pages/projects/[projectId]/movements/communication/data/testing/communication-facade.stub';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { AlertModel } from '@shared/models/model/alert.model';
import { PageModel } from '@shared/models/model/page.model';

@Component({ template: '' })
class EmptyComponent {}

const pageOf = (ids: string[], hasNext = false): PageModel<AlertModel> => ({
	content: ids.map(
		(id) =>
			({
				id,
				visible: true,
				title: id,
				dateTime: new Date('2026-01-01T10:00:00Z'),
				status: { value: 'OPEN', label: 'Open' },
			}) as unknown as AlertModel,
	),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('AlertsListPage', () => {
	let facade: Record<string, unknown>;

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;
	const param = (name: string, value: unknown): void => (facade[name] as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<AlertModel> | undefined, url = '/'): Promise<AlertsListHarness> {
		param('alertsPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(TestBed.createComponent(AlertsListPage), AlertsListHarness);
	}

	beforeEach(() => {
		facade = Object.assign(autoMock(undefined), {
			alertCommunicationsPage: signal(undefined),
			alertCommunicationsPageLoading: signal(false),
			alertCommunicationsPageSilentLoading: signal(false),
			handleAlertCreation: (): Observable<never> => NEVER,
			alertsPage: signal(undefined),
			alertsPageError: signal(undefined),
			alertsPageLoading: signal(false),
			alertsPageSilentLoading: signal(false),
			alertsPageQueryParam: signal(undefined),
			alertsPageStatusParam: signal(undefined),
			alertsPageIsVisibleParam: signal(undefined),
			alertsPageFromParam: signal(undefined),
			alertsPageToParam: signal(undefined),
			alertStatusMetadata: signal([]),
			visibilitiesMetadata: signal([]),
			alertStatistics: signal(undefined),
			alertStatisticsLoading: signal(false),
			alertStatisticsError: signal(undefined),
			fetchAlertStatistics: vi.fn(),
			fetchAlertsPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		});
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				REFRESH_SERVICE_STUB,
				{ provide: AlertFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({ id: 'u1', authorities: [] }),
						selectedProject: signal({ id: 'p1', options: [] }),
						selectedProjectHasOption: (): ReturnType<typeof signal<boolean>> => signal(false),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: CommunicationFacade, useValue: communicationFacadeStub() },
				{ provide: IntervalPipe, useValue: { transform: (): string => '1 min' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('shows its title, loads the statistics and the first batch when the url carries no filter', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const title = await harness.title();

		// Assert
		expect([
			title,
			calls('fetchAlertStatistics').length,
			calls('inputPageSearchParameters'),
			calls('fetchAlertsPage'),
		]).toEqual([
			'alerts.list.title',
			1,
			[[undefined, undefined, undefined, undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the filters and the sort carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?q=fire&status=OPEN&sort=-dateTime');

		// Act
		const searched = await (await harness.search()).searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
			'fire',
			['fire', 'OPEN', undefined, undefined, undefined, '-dateTime'],
		]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await (await harness.search()).search('fire');

		// Assert
		expect([calls('fetchAlertsPage').at(-1), TestBed.inject(Router).url]).toEqual([[0, undefined], '/?q=fire']);
	});

	it('counts every applied filter', async () => {
		// Arrange
		param('alertsPageQueryParam', 'fire');
		param('alertsPageStatusParam', 'OPEN');
		param('alertsPageIsVisibleParam', false);
		param('alertsPageFromParam', new Date());
		param('alertsPageToParam', new Date());
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('5');
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		param('alertsPageQueryParam', 'fire');
		const harness = await create(pageOf([]), '/?q=fire');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await (await harness.search()).searchedText(), calls('inputPageSearchParameters').at(-1)]).toEqual([
			'',
			[undefined, undefined, undefined, undefined, undefined, undefined],
		]);
	});

	it('shows one row per alert and asks for the next batch when the list asks for it', async () => {
		// Arrange
		const harness = await create(pageOf(['a1', 'a2'], true));

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect([await harness.rows(), calls('fetchAlertsPage').at(-1)]).toEqual([
			['a1', 'a2'],
			[1, 20],
		]);
	});
});
