import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationError } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { FieldErrorState } from '@shared/helpers/form/field-state.helper';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { SelectElementsFieldComponent } from '@shared/ui/common/select-elements-field/select-elements-field.component';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

interface Element {
	id?: string;
	name: string;
}

const suggestion = (id: string): SelectOptionModel<Element & { id: string }> => ({
	label: id.toUpperCase(),
	value: { id, name: id.toUpperCase() },
});

describe('SelectElementsFieldComponent', () => {
	let fixture: ComponentFixture<SelectElementsFieldComponent<Element>>;
	let touches: number;

	async function create(inputs: Record<string, unknown> = {}): Promise<SelectElementsFieldHarness> {
		fixture = TestBed.createComponent(SelectElementsFieldComponent<Element>);
		Object.entries({
			selectItemBuilder: (element: Element): SelectOptionModel<Element> => ({
				label: element.name,
				value: element,
			}),
			...inputs,
		}).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		touches = 0;
		fixture.componentInstance.touch.subscribe(() => touches++);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, SelectElementsFieldHarness);
	}

	const selected = (): Element[] => fixture.componentInstance.value();

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	describe('choosing a suggestion', () => {
		it('appends it to the selection, empties the search and announces it', async () => {
			// Arrange
			const harness = await create({ suggestions: [suggestion('b')], value: [{ id: 'a', name: 'A' }] });

			// Act
			await harness.choose('b');

			// Assert
			expect(selected()).toEqual([
				{ id: 'a', name: 'A' },
				{ id: 'b', name: 'B' },
			]);
			expect(await harness.selectValue()).toBe('');
			expect(await harness.announcement()).toBe('fr.global.selection.added');
			expect(touches).toBe(1);
		});

		it('adds nothing when the chosen value is not among the suggestions', async () => {
			// Arrange
			const harness = await create({ suggestions: [suggestion('b')] });

			// Act
			await harness.choose('unknown');

			// Assert
			expect(selected()).toEqual([]);
			expect(await harness.selectValue()).toBe('');
			expect(touches).toBe(0);
		});

		it('highlights an element already selected instead of adding it twice', async () => {
			// Arrange
			const harness = await create({ suggestions: [suggestion('a')], value: [{ id: 'a', name: 'A' }] });

			// Act
			await harness.choose('a');

			// Assert
			expect((await harness.selection()).map((row) => row.highlighted)).toEqual([true]);
			expect(selected()).toHaveLength(1);
			expect(await harness.announcement()).toBe('fr.global.selection.duplicate');
			expect(touches).toBe(0);
		});

		it('expands into several elements and skips the ones already selected', async () => {
			// Arrange
			const expand = (): Element[] => [
				{ id: 'a', name: 'A' },
				{ id: 'b', name: 'B' },
			];
			const harness = await create({
				suggestions: [suggestion('group')],
				value: [{ id: 'a', name: 'A' }],
				expand,
			});

			// Act
			await harness.choose('group');

			// Assert
			expect(selected().map((element) => element.id)).toEqual(['a', 'b']);
			expect(touches).toBe(1);
		});

		it('adds nothing and announces nothing when the suggestion expands to no element', async () => {
			// Arrange
			const harness = await create({ suggestions: [suggestion('group')], expand: (): Element[] => [] });

			// Act
			await harness.choose('group');

			// Assert
			expect(selected()).toEqual([]);
			expect(await harness.announcement()).toBe('');
		});

		it('keeps apart the elements that have no id', async () => {
			// Arrange
			const first: Element = { name: 'First' };
			const second: Element = { name: 'Second' };
			const harness = await create({
				suggestions: [suggestion('group')],
				value: [first],
				expand: (): Element[] => [second, first],
			});

			// Act
			await harness.choose('group');

			// Assert
			expect(selected()).toEqual([first, second]);
			expect((await harness.selection()).map((row) => row.label)).toEqual(['First', 'Second']);
		});
	});

	describe('the selection', () => {
		it('removes only the given element, announces it and gives the focus back to the search', async () => {
			// Arrange
			const harness = await create({
				value: [
					{ id: 'a', name: 'A' },
					{ id: 'b', name: 'B' },
				],
			});

			// Act
			await harness.remove('a');

			// Assert
			expect(selected()).toEqual([{ id: 'b', name: 'B' }]);
			expect(await harness.announcement()).toBe('fr.global.selection.removed');
			expect(await harness.searchFocused()).toBe(true);
		});

		it('separates the grouped elements under their group and removes a whole group', async () => {
			// Arrange
			const groupOf = (element: Element): string | undefined =>
				element.id?.startsWith('g') ? 'team' : undefined;
			const harness = await create({
				groupOf,
				groupLabel: (name: string): string => `Group ${name}`,
				ungroupedLabel: 'Alone',
				value: [
					{ id: 'a', name: 'A' },
					{ id: 'g1', name: 'G1' },
					{ id: 'g2', name: 'G2' },
				],
			});
			const before = [await harness.groups(), await harness.ungroupedTitle()];

			// Act
			await harness.removeGroup(0);

			// Assert
			expect(before).toEqual([['Group team'], 'Alone']);
			expect(selected()).toEqual([{ id: 'a', name: 'A' }]);
			expect(await harness.announcement()).toBe('fr.global.selection.removed');
		});

		it('names a group after its key when no label is given', async () => {
			// Arrange
			const groupOf = (): string => 'team';

			// Act
			const harness = await create({ groupOf, value: [{ id: 'g1', name: 'G1' }] });

			// Assert
			expect(await harness.groups()).toEqual(['team']);
		});

		it('shows the warning of an element', async () => {
			// Arrange
			const warningOf = (element: Element): string | undefined => (element.id === 'a' ? 'Out' : undefined);

			// Act
			const harness = await create({
				warningOf,
				value: [
					{ id: 'a', name: 'A' },
					{ id: 'b', name: 'B' },
				],
			});

			// Assert
			expect((await harness.selection()).map((row) => row.warning)).toEqual(['Out', undefined]);
		});

		it('says that nothing is selected and requires a choice while the selection is empty', async () => {
			// Arrange
			const inputs = { emptySelectionMessage: 'Nobody yet', required: true };

			// Act
			const harness = await create(inputs);

			// Assert
			expect(await harness.emptyMessage()).toBe('Nobody yet');
			expect(await harness.required()).toBe(true);
		});
	});

	describe('the search', () => {
		it('asks for every suggestion when it opens', async () => {
			// Arrange
			const harness = await create();
			const queries: string[] = [];
			fixture.componentInstance.handleSearch.subscribe((event) => queries.push(event.query));

			// Act
			await harness.open();

			// Assert
			expect(queries).toEqual(['']);
		});

		it.each([
			{ name: 'shows the error of the field', prefix: 'form.error', expected: 'fr.form.error.required' },
			{ name: 'shows no error without a translation prefix', prefix: undefined, expected: '' },
		])('$name', async ({ prefix, expected }) => {
			// Arrange
			const state: FieldErrorState = {
				invalid: () => true,
				touched: () => true,
				dirty: () => false,
				errors: () => [{ kind: 'required' }] as unknown as ValidationError[],
				value: () => [],
			};

			// Act
			const harness = await create({ appFieldError: () => state, translationPrefix: prefix });

			// Assert
			expect(await harness.error()).toBe(expected);
		});
	});
});
