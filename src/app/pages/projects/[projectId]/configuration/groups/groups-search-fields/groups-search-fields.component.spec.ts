import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { toGroupsListSearchModel } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.search';
import { GroupsSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/groups/groups-search-fields/groups-search-fields.component';
import { GroupsSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/groups/groups-search-fields/testing/groups-search-fields.harness';
import { createSearchForm } from '@shared/helpers/form/search.form';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [GroupsSearchFieldsComponent],
	templateUrl: './groups-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toGroupsListSearchModel({
			q: undefined,
			at: undefined,
			isPresent: undefined,
			isVisible: undefined,
			sort: undefined,
		}),
	);
	public readonly form = createSearchForm(this.model);
	public searches = 0;
}

describe('GroupsSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(authorities: string[]): Promise<GroupsSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(GroupsSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: GroupFacade,
					useValue: { availabilitiesMetadata: signal(CHOICES), visibilitiesMetadata: signal(CHOICES) },
				},
			],
		});
	});

	it.each([
		{
			name: 'the visibility filter to a user who restores them',
			authorities: ['p1_REGISTRY_PROJECT_GROUP_RESTORE'],
			filters: ['is-present', 'is-visible'],
		},
		{ name: 'no visibility filter to the others', authorities: [], filters: ['is-present'] },
	])('offers $name', async ({ authorities, filters }) => {
		// Arrange
		const harness = await create(authorities);

		// Act
		const shown = await harness.filters();

		// Assert
		expect(shown).toEqual(filters.map((filter) => `groups-search-fields-${filter}-select`));
	});

	it('binds the typed text and the chosen filters to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(['p1_REGISTRY_PROJECT_GROUP_RESTORE']);

		// Act
		await harness.search('camp');
		await harness.choose('is-present', 'true');
		await harness.choose('is-visible', 'false');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.isPresent, model.isVisible, fixture.componentInstance.searches]).toEqual([
			'camp',
			'true',
			'false',
			1,
		]);
	});
});
