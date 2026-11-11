import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { FieldErrorState } from '@shared/helpers/form/field-state.helper';
import { CommunicationLinkSelectComponent } from '@shared/ui/domain/communication-form/communication-link-select/communication-link-select.component';
import { CommunicationLinkSelectHarness } from '@shared/ui/domain/communication-form/communication-link-select/testing/communication-link-select.harness';

import '@sgdf/ui/select';

function stateOf(errors: object[]): () => FieldErrorState {
	const state: FieldErrorState = {
		invalid: () => errors.length > 0,
		touched: () => true,
		dirty: () => false,
		errors: () => errors as ValidationError[],
		value: () => null,
	};
	return () => state;
}

describe('CommunicationLinkSelectComponent', () => {
	let fixture: ComponentFixture<CommunicationLinkSelectComponent>;
	let events: string[];

	async function create(errors: object[] = []): Promise<CommunicationLinkSelectHarness> {
		fixture = TestBed.createComponent(CommunicationLinkSelectComponent);
		Object.entries({
			label: 'Movement',
			placeholder: 'Pick one',
			emptyLabel: 'Nothing',
			removeLabel: 'Remove',
			choices: [
				{ label: 'First', value: { id: 'm1' } },
				{ label: 'Second', value: { id: 'm2' } },
			],
			selectedKey: 'm2',
			field: stateOf(errors),
			translationPrefix: 'form.error',
		}).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		events = [];
		const component = fixture.componentInstance;
		component.searched.subscribe((searched) => events.push(`search:${searched.query}`));
		component.selected.subscribe((key) => events.push(`select:${key}`));
		component.left.subscribe(() => events.push('left'));
		component.removed.subscribe(() => events.push('removed'));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, CommunicationLinkSelectHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('offers every choice and shows the selected one', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.choices(), await harness.value()];

		// Assert
		expect(shown).toEqual([['m1', 'm2'], 'm2']);
	});

	it('relays the search, the choice, the exit and the removal', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.search('ca');
		await harness.choose('m1');
		await harness.leave();
		await harness.remove();

		// Assert
		expect(events).toEqual(['search:ca', 'select:m1', 'left', 'removed']);
	});

	it('shows the error of the field', async () => {
		// Arrange
		const errors = [{ kind: 'required' }];

		// Act
		const harness = await create(errors);

		// Assert
		expect(await harness.error()).toBe('fr.form.error.required');
	});
});
