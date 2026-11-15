import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ProjectUpcomingDepartureComponent } from '@pages/projects/[projectId]/widgets/project-upcoming-departure/project-upcoming-departure.component';
import { ProjectUpcomingDepartureHarness } from '@pages/projects/[projectId]/widgets/project-upcoming-departure/testing/project-upcoming-departure.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';

describe('ProjectUpcomingDepartureComponent', () => {
	let movements: WritableSignal<PlannedMovementModel[] | undefined>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetch: Mock<() => void>;
	let refresh: Mock<() => void>;
	let reloads: (() => void)[];

	function create(): Promise<ProjectUpcomingDepartureHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectUpcomingDepartureComponent),
			ProjectUpcomingDepartureHarness,
		);
	}

	beforeEach(() => {
		movements = signal<PlannedMovementModel[] | undefined>(undefined);
		error = signal<NotificationModel | undefined>(undefined);
		fetch = vi.fn();
		refresh = vi.fn();
		reloads = [];
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{
					provide: MovementPrefillService,
					useValue: { creationUrl: (): undefined => undefined, openPlanned: vi.fn() },
				},
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
				{
					provide: SelectedProjectFacade,
					useValue: {
						plannedDepartures: movements,
						plannedDeparturesLoading: signal(false),
						plannedDeparturesError: error,
						fetchPlannedDepartures: fetch,
						refreshPlannedDepartures: refresh,
					},
				},
			],
		});
	});

	it('loads the planned departures and titles the card after them', async () => {
		// Arrange
		movements.set([]);
		const card = await (await create()).card();

		// Act
		const shown = [await card.title(), await card.emptyText()];

		// Assert
		expect([shown, fetch.mock.calls.length]).toEqual([
			['fr.projectHome.upcomingDeparture.title', 'fr.projectHome.upcomingDeparture.empty'],
			1,
		]);
	});

	it('shows the failure and loads again on retry', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		const card = await (await create()).card();

		// Act
		await (await card.error())?.retry();

		// Assert
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('refreshes silently when the refresh service asks', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
