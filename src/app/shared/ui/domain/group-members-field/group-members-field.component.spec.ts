import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldTree, form } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { GroupMembersFieldComponent } from '@shared/ui/domain/group-members-field/group-members-field.component';
import { GroupMembersFieldHarness } from '@shared/ui/domain/group-members-field/testing/group-members-field.harness';

import '@sgdf/ui/select';

describe('GroupMembersFieldComponent', () => {
	let fixture: ComponentFixture<GroupMembersFieldComponent>;
	let field: FieldTree<ParticipantModel[]>;
	const participant: ParticipantModel = ParticipantMapper.toModel(PARTICIPANT_DTO);

	async function create(members: ParticipantModel[] = []): Promise<GroupMembersFieldHarness> {
		fixture = TestBed.createComponent(GroupMembersFieldComponent);
		field = TestBed.runInInjectionContext(() => form(signal<ParticipantModel[]>(members)));
		fixture.componentRef.setInput('field', field);
		fixture.componentRef.setInput('suggestions', [{ label: 'Ada', value: participant }]);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GroupMembersFieldHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: {} },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
				}),
			],
		});
	});

	it('names the section after the number of members', async () => {
		// Arrange
		const harness = await create([participant]);

		// Act
		const title = await harness.title();

		// Assert
		expect(title).toBe('groups.form.members.one');
	});

	it('adds a suggested participant to the members', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.selection()).choose(participant.id);

		// Assert
		expect(
			field()
				.value()
				.map((member) => member.id),
		).toEqual([participant.id]);
	});

	it('emits the typed query and marks the field as touched', async () => {
		// Arrange
		const harness = await create();
		const searched: (string | undefined)[] = [];
		fixture.componentInstance.searched.subscribe((query) => searched.push(query));

		// Act
		await (await harness.selection()).search('ad');

		// Assert
		expect(searched).toEqual(['ad']);
		expect(field().touched()).toBe(true);
	});
});
