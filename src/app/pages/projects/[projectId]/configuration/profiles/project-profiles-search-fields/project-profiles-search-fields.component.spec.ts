import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { toProjectProfilesListSearchModel } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search';
import { ProjectProfilesSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-search-fields/project-profiles-search-fields.component';
import { ProjectProfilesSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-search-fields/testing/project-profiles-search-fields.harness';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [ProjectProfilesSearchFieldsComponent],
	templateUrl: './project-profiles-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toProjectProfilesListSearchModel({
			q: undefined,
			at: undefined,
			status: undefined,
			isAvailable: undefined,
			isVisible: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
	public searches = 0;
}

describe('ProjectProfilesSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(authorities: string[]): Promise<ProjectProfilesSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ProjectProfilesSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: ProjectProfileFacade,
					useValue: {
						projectProfilesStatusMetadata: signal([
							{ label: '-', value: undefined },
							{ label: 'Invited', value: 'INVITED' },
						]),
						projectProfilesAvailabilitiesMetadata: signal(CHOICES),
						projectProfilesVisibilitiesMetadata: signal(CHOICES),
					},
				},
			],
		});
	});

	it.each([
		{
			name: 'the blocked filter to a user who unblocks profiles',
			authorities: ['p1_REGISTRY_PROJECT_PROFILE_RESTORE'],
			filters: ['status', 'is-available', 'is-visible'],
		},
		{ name: 'no blocked filter to the others', authorities: [], filters: ['status', 'is-available'] },
	])('offers $name', async ({ authorities, filters }) => {
		// Arrange
		const harness = await create(authorities);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `project-profiles-search-fields-${filter}-select`));
	});

	it('binds the typed text and the chosen filters to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(['p1_REGISTRY_PROJECT_PROFILE_RESTORE']);

		// Act
		await harness.search('ada');
		await harness.choose('status', 'INVITED');
		await harness.choose('is-available', 'true');
		await harness.choose('is-visible', 'false');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.status, model.isAvailable, model.isVisible, fixture.componentInstance.searches]).toEqual(
			['ada', 'INVITED', 'true', 'false', 1],
		);
	});
});
