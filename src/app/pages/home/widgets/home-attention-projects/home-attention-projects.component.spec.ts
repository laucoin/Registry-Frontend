import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { HomeFacade } from '@pages/home/data/state/home.facade';
import { HomeAttentionProjectsComponent } from '@pages/home/widgets/home-attention-projects/home-attention-projects.component';
import { HomeAttentionProjectsHarness } from '@pages/home/widgets/home-attention-projects/testing/home-attention-projects.harness';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';

@Component({ template: '' })
class EmptyComponent {}

const TRANSLATIONS = {
	home: {
		attention: {
			title: 'Attention',
			empty: 'Nothing',
			alerts: { one: '{{ count }} alert', few: '{{ count }} alerts' },
		},
	},
};

const project = (id: string, activeAlerts: number | undefined): ProjectModel => ({
	...ProjectMapper.toModel(PROJECT_DTO),
	id,
	name: `Project ${id}`,
	counts: activeAlerts === undefined ? undefined : ({ activeAlerts } as ProjectModel['counts']),
});

describe('HomeAttentionProjectsComponent', () => {
	let attention: WritableSignal<ProjectModel[]>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetchAttention: Mock<() => void>;
	let refreshAttention: Mock<() => void>;

	async function create(projects: ProjectModel[] = []): Promise<HomeAttentionProjectsHarness> {
		attention.set(projects);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(HomeAttentionProjectsComponent),
			HomeAttentionProjectsHarness,
		);
	}

	let reloads: (() => void)[];

	beforeEach(() => {
		reloads = [];
		attention = signal<ProjectModel[]>([]);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetchAttention = vi.fn();
		refreshAttention = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: TRANSLATIONS },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
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
					provide: HomeFacade,
					useValue: {
						attention,
						attentionLoading: loading,
						attentionError: error,
						fetchAttention,
						refreshAttention,
					},
				},
			],
		});
	});

	it('loads the projects when displayed', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await harness.title();

		// Assert
		expect([title, fetchAttention.mock.calls.length]).toEqual(['Attention', 1]);
	});

	it('shows the loading state without a counter while the first page loads', async () => {
		// Arrange
		loading.set(true);

		// Act
		const harness = await create();

		// Assert
		expect([await harness.loadingShown(), await harness.count(), await harness.empty()]).toEqual([
			true,
			undefined,
			undefined,
		]);
	});

	it('tells that no project has an alert', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.empty(), await harness.count()];

		// Assert
		expect(shown).toEqual(['Nothing', '0']);
	});

	it('lists the projects linked to their alerts, in danger from two alerts', async () => {
		// Arrange
		const harness = await create([project('p1', 3), project('p2', 1), project('p3', undefined)]);

		// Act
		const projects = await harness.projects();

		// Assert
		expect([projects, await harness.count()]).toEqual([
			[
				{ name: 'Project p1', alerts: '3 alerts', variant: 'danger', link: '/projects/p1/alerts' },
				{ name: 'Project p2', alerts: '1 alert', variant: 'info', link: '/projects/p2/alerts' },
				{ name: 'Project p3', alerts: '0 alert', variant: 'info', link: '/projects/p3/alerts' },
			],
			'3',
		]);
	});

	it('shows the section error and retries on demand', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		const harness = await create();

		// Act
		await (await harness.error())?.retry();

		// Assert
		expect(fetchAttention).toHaveBeenCalledTimes(2);
	});

	it('refreshes silently when the refresh service asks', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refreshAttention).toHaveBeenCalledTimes(1);
	});
});
