import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { toParticipantsListSearchModel } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search';
import { ParticipantsSearchFieldsComponent } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/participants-search-fields.component';
import { ParticipantsSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/testing/participants-search-fields.harness';
import { createSearchForm } from '@shared/helpers/form/search.form';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

@Component({
	imports: [ParticipantsSearchFieldsComponent],
	templateUrl: './participants-search-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(
		toParticipantsListSearchModel({ q: undefined, status: undefined, isVisible: undefined, sort: undefined }),
	);
	public readonly form = createSearchForm(this.model);
	public readonly sortFields: readonly string[] = ['lastName'];
	public readonly hiddenAuthority = signal<ProjectAuthorityEnum | undefined>(undefined);
	public searches = 0;
}

describe('ParticipantsSearchFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(
		hiddenAuthority: ProjectAuthorityEnum | undefined,
		authorities: string[] = [],
	): Promise<ParticipantsSearchFieldsHarness> {
		TestBed.overrideProvider(SessionFacade, {
			useValue: { currentUser: signal({ authorities }), selectedProject: signal({ id: 'p1' }) },
		});
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.hiddenAuthority.set(hiddenAuthority);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ParticipantsSearchFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SessionFacade, useValue: {} },
				{
					provide: ParticipantFacade,
					useValue: {
						presencesStatusMetadata: signal([
							{ label: '-', value: undefined },
							{ label: 'Overdue', value: 'OVERDUE' },
						]),
						visibilitiesMetadata: signal(CHOICES),
					},
				},
			],
		});
	});

	it('offers the presence statuses', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const statuses = await harness.statuses();

		// Assert
		expect(statuses).toEqual(['-', 'Overdue']);
	});

	it('binds the typed text and the chosen status to the form, and signals the validated search', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		await harness.search('ada');
		await harness.chooseStatus('OVERDUE');

		// Assert
		const model = fixture.componentInstance.model();
		expect([model.q, model.status, fixture.componentInstance.searches]).toEqual(['ada', 'OVERDUE', 1]);
	});

	it.each([
		{ name: 'without an authority reserving it', authority: undefined, granted: [], shown: false },
		{
			name: 'to a user without the authority',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE,
			granted: [],
			shown: false,
		},
		{
			name: 'to a user with the authority',
			authority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE,
			granted: ['p1_REGISTRY_PROJECT_PARTICIPANT_RESTORE'],
			shown: true,
		},
	])('offers the visibility filter only $name', async ({ authority, granted, shown }) => {
		// Arrange
		const harness = await create(authority, granted);

		// Act
		const visible = await harness.visibilityShown();

		// Assert
		expect(visible).toBe(shown);
	});

	it('binds the chosen visibility to the form', async () => {
		// Arrange
		const harness = await create(ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_RESTORE, [
			'p1_REGISTRY_PROJECT_PARTICIPANT_RESTORE',
		]);

		// Act
		await harness.chooseVisibility('false');

		// Assert
		expect(fixture.componentInstance.model().isVisible).toBe('false');
	});
});
