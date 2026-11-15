import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { defined } from '@shared/helpers/testing/defined';
import { ProjectOverviewCardHarness } from '@shared/ui/domain/project-overview-card/testing/project-overview-card.harness';
import { ProjectVehicleOverviewComponent } from '@shared/ui/domain/project-vehicle-overview/project-vehicle-overview.component';

@Component({ template: '' })
class EmptyComponent {}

describe('ProjectVehicleOverviewComponent', () => {
	let fixture: ComponentFixture<ProjectVehicleOverviewComponent>;
	let status: WritableSignal<object | undefined>;
	let fetch: Mock<() => void>;
	let refresh: Mock<() => void>;
	let reloads: (() => void)[];

	async function create(showLink = true): Promise<ProjectOverviewCardHarness> {
		fixture = TestBed.createComponent(ProjectVehicleOverviewComponent);
		fixture.componentRef.setInput('showLink', showLink);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ProjectOverviewCardHarness);
	}

	beforeEach(() => {
		status = signal({ present: 3, absent: 1, lastRefresh: new Date() });
		fetch = vi.fn();
		refresh = vi.fn();
		reloads = [];
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
						check: (): void => undefined,
					},
				},
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{
					provide: SelectedProjectFacade,
					useValue: { vehiclesStatus: status, fetchVehiclesStatus: fetch, refreshVehiclesStatus: refresh },
				},
				{ provide: SessionFacade, useValue: { currentProjectId: signal('p1') } },
			],
		});
	});

	it('loads the status of the project when displayed', async () => {
		// Arrange
		await create();

		// Act
		const calls = fetch.mock.calls.length;

		// Assert
		expect(calls).toBe(1);
	});

	it('refreshes the status when the automatic refresh asks for it', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('shows each counter and the total', async () => {
		// Arrange
		const harness = await create();

		// Act
		const values = (await harness.stats()).map((stat) => stat.value);

		// Assert
		expect(values).toEqual(['3', '1']);
		expect(await harness.totalText()).toBeDefined();
	});

	it('shows placeholders and no total while the status is not loaded', async () => {
		// Arrange
		status.set(undefined);

		// Act
		const harness = await create();

		// Assert
		expect((await harness.stats()).every((stat) => stat.value === '–')).toBe(true);
		expect(await harness.totalText()).toBeUndefined();
	});

	it('leads to the vehicles page of the selected project', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.followLink();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/projects/p1/vehicles');
	});

	it('hides the link when asked to', async () => {
		// Arrange
		const showLink = false;

		// Act
		const harness = await create(showLink);

		// Assert
		expect(await defined(harness).hasLink()).toBe(false);
	});
});
