import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationModel } from '@shared/models/model/notification.model';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

interface SectionErrorInputs {
	error: NotificationModel;
	retrying?: boolean;
	retryable?: boolean;
}

describe('SectionErrorComponent', () => {
	let fixture: ComponentFixture<SectionErrorComponent>;

	async function create(inputs: SectionErrorInputs): Promise<SectionErrorHarness> {
		fixture = TestBed.createComponent(SectionErrorComponent);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, SectionErrorHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('shows the title and the backend message of the failure', async () => {
		// Arrange
		const error: NotificationModel = { summary: 'Oops', detail: 'Backend said no' };

		// Act
		const harness = await create({ error });

		// Assert
		expect(await harness.title()).toBe('Oops');
		expect(await harness.text()).toContain('Backend said no');
	});

	it('falls back on the unknown error texts when the failure has no message', async () => {
		// Arrange
		const error: NotificationModel = {};

		// Act
		const harness = await create({ error });

		// Assert
		expect(await harness.title()).toBe('fr.global.notifications.UNKNOWN_ERROR.title');
		expect(await harness.text()).toContain('fr.global.notifications.UNKNOWN_ERROR.message');
	});

	it('emits a retry when the button is clicked', async () => {
		// Arrange
		const harness = await create({ error: { summary: 'Oops' } });
		let retries = 0;
		fixture.componentInstance.retry.subscribe(() => retries++);

		// Act
		await harness.retry();

		// Assert
		expect(retries).toBe(1);
	});

	it('hides the retry button when the failure cannot be retried', async () => {
		// Arrange
		const inputs: SectionErrorInputs = { error: { summary: 'Oops' }, retryable: false };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.canRetry()).toBe(false);
	});

	it('flags the button as loading while the retry is in flight', async () => {
		// Arrange
		const inputs: SectionErrorInputs = { error: { summary: 'Oops' }, retrying: true };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.retrying()).toBe(true);
	});
});
