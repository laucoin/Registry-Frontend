import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ActivityFormPage } from '@pages/projects/[projectId]/configuration/activities/activity-form/activity-form.page';
import {
	ActivityFormHarness,
	ActivityTextFieldEnum,
} from '@pages/projects/[projectId]/configuration/activities/activity-form/testing/activity-form.harness';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { ACTIVITY_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, failing, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { ActivityMapper } from '@shared/mappers/activity.mapper';

const ELEMENT = ActivityMapper.toModel(ACTIVITY_DTO);

describe('ActivityFormPage', () => {
	let facade: Record<string, Mock>;
	let navigate: Mock;

	async function create(id?: string): Promise<ActivityFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, {
			useValue: { snapshot: { params: id ? { activityId: id } : {}, url: id ? [{}, {}] : [{}] } },
		});
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ActivityFormPage),
			ActivityFormHarness,
		);
	}

	beforeEach(() => {
		provideTestConfig();
		navigate = vi.fn(() => Promise.resolve(true));
		facade = {
			fetchActivity: vi.fn(() => of(ELEMENT)),
			createActivity: vi.fn(() => of(ELEMENT)),
			updateActivity: vi.fn(() => of(ELEMENT)),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ActivityFacade, useValue: facade },
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: Router, useValue: { navigate, navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {}, url: [{}] } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn() } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('does not save an empty form', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect(facade['createActivity']).not.toHaveBeenCalled();
	});

	it('creates the element from the typed values and closes on the list', async () => {
		// Arrange
		const harness = await create();
		await harness.type(ActivityTextFieldEnum.NAME, 'Camp');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([facade['createActivity'].mock.calls[0], navigate.mock.calls[0][0]]).toEqual([
			[expect.objectContaining({ name: 'Camp' })],
			['..'],
		]);
	});

	it('loads the edited element, fills the form and updates it with its version', async () => {
		// Arrange
		const harness = await create('e1');
		const filled = await harness.text(ActivityTextFieldEnum.NAME);

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([filled, facade['updateActivity'].mock.calls[0], navigate.mock.calls[0][0]]).toEqual([
			ELEMENT.name,
			['a1', expect.objectContaining({ name: 'Hike' }), WHEN_ETAG],
			['../..'],
		]);
	});

	it('shows the error of a failed save and stays on the form', async () => {
		// Arrange
		facade['updateActivity'].mockReturnValue(failing(ERROR_500));
		const harness = await create('e1');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([await defined(await (await harness.dialog()).error()).title(), navigate.mock.calls]).toEqual([
			'fr.Title',
			[],
		]);
	});

	it('closes on the list when it is cancelled', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.dialog()).cancel();

		// Assert
		expect(navigate.mock.calls[0][0]).toEqual(['..']);
	});
});
