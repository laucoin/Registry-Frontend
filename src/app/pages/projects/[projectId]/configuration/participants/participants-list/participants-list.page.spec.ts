import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantsListPage } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page';
import { ParticipantsListHarness } from '@pages/projects/[projectId]/configuration/participants/participants-list/testing/participants-list.harness';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

@Component({ template: '' })
class EmptyComponent {}

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

const pageOf = (ids: string[], hasNext = false): PageModel<ParticipantModel> => ({
	content: ids.map(
		(id) =>
			({
				id,
				firstName: id,
				lastName: 'Doe',
				visible: true,
				status: { value: 'IN', label: 'In' },
				groups: [
					{ id: 'g1', name: 'Wolves' },
					{ id: 'g2', name: 'Owls' },
				],
			}) as unknown as ParticipantModel,
	),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('ParticipantsListPage', () => {
	let facade: Record<string, Mock>;
	let authorities: WritableSignal<string[]>;

	const calls = (name: string): unknown[][] => facade[name].mock.calls;
	const param = (name: string, value: unknown): void =>
		(facade[name] as unknown as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<ParticipantModel> | undefined, url = '/'): Promise<ParticipantsListHarness> {
		param('participantsPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ParticipantsListPage),
			ParticipantsListHarness,
		);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_PARTICIPANT_C']);
		facade = Object.assign(autoMock(undefined), {
			participantsPage: signal(undefined),
			participantsPageError: signal(undefined),
			participantsPageLoading: signal(false),
			participantsPageSilentLoading: signal(false),
			participantsPageQueryParam: signal(undefined),
			participantsPageStatusParam: signal(undefined),
			participantsPageIsVisibleParam: signal(undefined),
			presencesStatusMetadata: signal([]),
			visibilitiesMetadata: signal(CHOICES),
			fetchParticipantsPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		}) as unknown as Record<string, Mock>;
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
				{ provide: ParticipantFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }),
						selectedProject: signal({ id: 'p1' }),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), confirm: vi.fn() } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('shows its title and loads the first batch when the url carries no filter', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const title = await harness.title();

		// Assert
		expect([title, calls('inputPageSearchParameters'), calls('fetchParticipantsPage')]).toEqual([
			'participants.list.title',
			[[undefined, undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the text and the sort carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?q=ada&sort=-lastName');

		// Act
		const searched = await (await harness.search()).searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
			'ada',
			['ada', undefined, undefined, '-lastName'],
		]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await (await harness.search()).search('ada');

		// Assert
		expect([calls('fetchParticipantsPage').at(-1), TestBed.inject(Router).url]).toEqual([
			[0, undefined],
			'/?q=ada',
		]);
	});

	it('counts every applied filter', async () => {
		// Arrange
		param('participantsPageQueryParam', 'ada');
		param('participantsPageStatusParam', 'IN');
		param('participantsPageIsVisibleParam', false);
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('3');
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		param('participantsPageQueryParam', 'ada');
		const harness = await create(pageOf([]), '/?q=ada');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await (await harness.search()).searchedText(), calls('fetchParticipantsPage').at(-1)]).toEqual([
			'',
			[0, undefined],
		]);
	});

	it('shows one row per element and asks for the next batch when the list asks for it', async () => {
		// Arrange
		const harness = await create(pageOf(['e1', 'e2'], true));

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect([await harness.rows(), calls('fetchParticipantsPage').at(-1)]).toEqual([
			['e1', 'e2'],
			[1, 20],
		]);
	});

	it.each([
		{
			name: 'offers the creation to a user who creates them',
			granted: ['p1_REGISTRY_PROJECT_PARTICIPANT_C'],
			shown: true,
		},
		{ name: 'hides the creation from the others', granted: [], shown: false },
	])('$name', async ({ granted, shown }) => {
		// Arrange
		authorities.set(granted);
		const harness = await create(pageOf([]));

		// Act
		const offered = await harness.canCreate();

		// Assert
		expect(offered).toBe(shown);
	});

	it('opens the creation form', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await harness.create();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/create');
	});

	it('lists every group of a participant in the dialog until it is closed', async () => {
		// Arrange
		const harness = await create(pageOf(['pa1']));
		await (await harness.row('pa1')).showGroups();
		const dialog = await harness.groupsDialog();
		const groups = await dialog.groups();

		// Act
		await dialog.hide();

		// Assert
		expect([groups, await dialog.groups()]).toEqual([['Wolves', 'Owls'], []]);
	});
});
