import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ElementActionModel } from '@shared/models/model/element-action.model';
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';

import '@sgdf/ui/menu-item';

describe('ElementActionsComponent', () => {
	let run: Mock<() => void>;
	let actions: ElementActionModel[];

	async function create(shown: ElementActionModel[], subject?: string): Promise<ElementActionsHarness> {
		const fixture = TestBed.createComponent(ElementActionsComponent);
		fixture.componentRef.setInput('actions', shown);
		fixture.componentRef.setInput('subject', subject);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ElementActionsHarness);
	}

	beforeEach(() => {
		run = vi.fn<() => void>();
		actions = [
			{ id: 'edit', label: 'users.actions.edit', icon: 'pen', disabled: false, danger: false, run },
			{ id: 'delete', label: 'users.actions.delete', icon: 'trash', disabled: true, danger: true, run: vi.fn() },
		];
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('shows one item per action with its translated label, danger flag and availability', async () => {
		// Arrange
		const harness = await create(actions);

		// Act
		const shown = await harness.actions();

		// Assert
		expect(shown).toEqual([
			{ id: 'edit', label: 'fr.users.actions.edit', danger: false, disabled: false },
			{ id: 'delete', label: 'fr.users.actions.delete', danger: true, disabled: true },
		]);
	});

	it('runs the chosen action', async () => {
		// Arrange
		const harness = await create(actions);

		// Act
		await harness.run('edit');

		// Assert
		expect(run).toHaveBeenCalledTimes(1);
	});

	it('shows nothing without an action', async () => {
		// Arrange
		const harness = await create([]);

		// Act
		const shown = await harness.shown();

		// Assert
		expect(shown).toBe(false);
	});

	it.each([
		{
			name: 'names the menu trigger after the subject it acts on',
			subject: 'Ada',
			expected: 'fr.global.menu.options-of',
		},
		{
			name: 'keeps the plain trigger label without subject',
			subject: undefined,
			expected: 'fr.global.menu.options',
		},
	])('$name', async ({ subject, expected }) => {
		// Arrange
		const harness = await create(actions, subject);

		// Act
		const label = await harness.triggerLabel();

		// Assert
		expect(label).toBe(expected);
	});
});
