import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { backendError } from '@shared/helpers/testing/test-fixtures';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { FormHarness } from '@shared/ui/common/form/testing/form.harness';

describe('FormComponent', () => {
	async function create(inputs: Record<string, unknown>, touched = false): Promise<FormHarness> {
		const fixture = TestBed.createComponent(FormComponent);
		Object.entries({
			form: (): { touched: () => boolean } => ({ touched: (): boolean => touched }),
			loading: false,
			...inputs,
		}).forEach(([name, value]: [string, unknown]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, FormHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('shows its title as the page title', async () => {
		// Arrange
		const title = 'New group';

		// Act
		const harness = await create({ title });

		// Assert
		expect(await harness.title()).toBe(title);
	});

	it('shows no heading when the title is hidden', async () => {
		// Arrange
		const inputs: Record<string, unknown> = { title: 'New group', showTitle: false };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.title()).toBeUndefined();
	});

	it('shows a spinner instead of the content while an untouched form loads', async () => {
		// Arrange
		const inputs: Record<string, unknown> = { title: 'New group', loading: true };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.loading()).toBe(true);
		expect(await harness.title()).toBeUndefined();
	});

	it('keeps the content of a form the user already touched while it reloads', async () => {
		// Arrange
		const inputs: Record<string, unknown> = { title: 'New group', loading: true };

		// Act
		const harness = await create(inputs, true);

		// Assert
		expect(await harness.loading()).toBe(false);
		expect(await harness.title()).toBe('New group');
	});

	it('shows the error of the submission', async () => {
		// Arrange
		const error = backendError(422, 'Invalid', 'Name already used');

		// Act
		const harness = await create({ error });

		// Assert
		expect(await (await harness.error())?.text()).toBe('fr.Name already used');
	});
});
