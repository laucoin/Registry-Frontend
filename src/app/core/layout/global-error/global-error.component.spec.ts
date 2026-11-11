import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { GlobalErrorComponent } from '@core/layout/global-error/global-error.component';
import { GlobalErrorHarness } from '@core/layout/global-error/testing/global-error.harness';
import { UiFacade } from '@core/registry/state/ui.facade';
import { NotificationModel } from '@shared/models/model/notification.model';

describe('GlobalErrorComponent', () => {
	let reloadApplication: Mock<() => void>;

	async function create(error: NotificationModel): Promise<GlobalErrorHarness> {
		const fixture = TestBed.createComponent(GlobalErrorComponent);
		fixture.componentRef.setInput('error', error);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GlobalErrorHarness);
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
		reloadApplication = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: UiFacade, useValue: { reloadApplication } }],
		});
	});

	it('should show the title and the detail of the error in a danger callout', async () => {
		// Arrange
		const error: NotificationModel = { summary: 'Service Unavailable', detail: 'The API cannot be reached' };

		// Act
		const harness = await create(error);

		// Assert
		expect(await harness.text()).toContain('The API cannot be reached');
		expect(await harness.title()).toBe('Service Unavailable');
		expect(await harness.variant()).toBe('danger');
	});

	it('should fall back to the unknown error message when the error has no detail', async () => {
		// Arrange
		const error: NotificationModel = { summary: 'Down' };

		// Act
		const harness = await create(error);

		// Assert
		expect(await harness.text()).toContain('global.notifications.UNKNOWN_ERROR.message');
	});

	it('should fall back to the unknown error title when the error has no title', async () => {
		// Arrange
		const error: NotificationModel = { detail: 'Boom' };

		// Act
		const harness = await create(error);

		// Assert
		expect(await harness.title()).toContain('global.notifications.UNKNOWN_ERROR.title');
	});

	it('should reload the application when the retry button is clicked', async () => {
		// Arrange
		const harness = await create({ summary: 'Down' });

		// Act
		await harness.retry();

		// Assert
		expect(reloadApplication).toHaveBeenCalledTimes(1);
	});
});
