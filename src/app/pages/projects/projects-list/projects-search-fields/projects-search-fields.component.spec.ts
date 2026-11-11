import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { toProjectsListSearchModel } from '@pages/projects/projects-list/projects-list.search';
import { ProjectsSearchFieldsComponent } from '@pages/projects/projects-list/projects-search-fields/projects-search-fields.component';
import { ProjectsSearchFieldsHarness } from '@pages/projects/projects-list/projects-search-fields/testing/projects-search-fields.harness';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [ProjectsSearchFieldsComponent],
	templateUrl: './projects-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toProjectsListSearchModel({
			q: undefined,
			at: undefined,
			isVisible: undefined,
			isFavorite: undefined,
			withProfile: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
	public readonly hidden = signal(true);
	public readonly all = signal(true);
	public searches = 0;

	public searched(): void {
		this.searches += 1;
	}
}

describe('ProjectsSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(canSeeHidden: boolean, canReadAll: boolean): Promise<ProjectsSearchFieldsHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.hidden.set(canSeeHidden);
		fixture.componentInstance.all.set(canReadAll);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectsSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{
					provide: ProjectFacade,
					useValue: {
						visibilitiesMetadata: signal(CHOICES),
						favoritesMetadata: signal(CHOICES),
						withProfilesMetadata: signal(CHOICES),
					},
				},
			],
		});
	});

	it.each([
		{
			name: 'every filter',
			canSeeHidden: true,
			canReadAll: true,
			filters: ['is-visible', 'is-favorite', 'with-profile'],
		},
		{ name: 'the favorites only', canSeeHidden: false, canReadAll: false, filters: ['is-favorite'] },
	])('offers $name', async ({ canSeeHidden, canReadAll, filters }) => {
		// Arrange
		const harness = await create(canSeeHidden, canReadAll);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `projects-search-fields-${filter}-select`));
	});

	it('binds the typed text and the chosen filter to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(true, true);

		// Act
		await harness.search('camp');
		await harness.choose('is-favorite', 'true');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.isFavorite, fixture.componentInstance.searches]).toEqual(['camp', 'true', 1]);
	});
});
