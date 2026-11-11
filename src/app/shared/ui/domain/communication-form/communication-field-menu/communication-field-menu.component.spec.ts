import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { CommunicationFieldMenuComponent } from '@shared/ui/domain/communication-form/communication-field-menu/communication-field-menu.component';
import { CommunicationFieldMenuHarness } from '@shared/ui/domain/communication-form/communication-field-menu/testing/communication-field-menu.harness';

import '@sgdf/ui/menu-item';

describe('CommunicationFieldMenuComponent', () => {
	let command: Mock<() => void>;

	async function create(): Promise<CommunicationFieldMenuHarness> {
		const fixture = TestBed.createComponent(CommunicationFieldMenuComponent);
		fixture.componentRef.setInput('actions', [
			{ id: 'MOVEMENT', label: 'add-movement', icon: 'right-left', disabled: false, command },
			{ id: 'ALERT', label: 'add-alert', icon: 'triangle-exclamation', disabled: true, command: vi.fn() },
		]);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, CommunicationFieldMenuHarness);
	}

	beforeEach(() => {
		command = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('lists each entry with its state', async () => {
		// Arrange
		const harness = await create();

		// Act
		const entries = await harness.entries();

		// Assert
		expect(entries).toEqual([
			{ key: 'add-movement', disabled: false },
			{ key: 'add-alert', disabled: true },
		]);
	});

	it('runs the command of the chosen entry', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.run('add-movement');

		// Assert
		expect(command).toHaveBeenCalledTimes(1);
	});
});
