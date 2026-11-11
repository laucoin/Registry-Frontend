import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component';
import { FormActionsHarness } from '@shared/ui/common/form-actions/testing/form-actions.harness';

import '@sgdf/ui/button';

describe('FormActionsComponent', () => {
	let fixture: ComponentFixture<FormActionsComponent>;

	async function create(inputs: Record<string, unknown> = {}): Promise<FormActionsHarness> {
		fixture = TestBed.createComponent(FormActionsComponent);
		fixture.componentRef.setInput('submitLabel', 'global.actions.create');
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, FormActionsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('offers a submit button that submits the surrounding form, and a cancel button that does not', async () => {
		// Arrange
		const harness = await create();

		// Act
		const submits = [await harness.submits(), await harness.cancelSubmits()];

		// Assert
		expect(submits).toEqual([true, false]);
		expect(await harness.submitLabel()).toBe('fr.global.actions.create');
	});

	it('asks the page to leave when the cancel button is clicked', async () => {
		// Arrange
		const harness = await create();
		let cancels = 0;
		fixture.componentInstance.cancelled.subscribe(() => cancels++);

		// Act
		await harness.cancel();

		// Assert
		expect(cancels).toBe(1);
	});

	it('shows the loading state of the submit button while saving', async () => {
		// Arrange
		const inputs = { saving: true };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.saving()).toBe(true);
	});
});
