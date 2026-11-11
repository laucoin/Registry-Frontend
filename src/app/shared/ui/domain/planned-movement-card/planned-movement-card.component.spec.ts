import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { defined } from '@shared/helpers/testing/defined';
import { PLANNED_MOVEMENT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { PlannedMovementMapper } from '@shared/mappers/planned-movement.mapper';
import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { PlannedMovementCardComponent } from '@shared/ui/domain/planned-movement-card/planned-movement-card.component';
import { PlannedMovementCardHarness } from '@shared/ui/domain/planned-movement-card/testing/planned-movement-card.harness';

function movement(overrides: Partial<PlannedMovementModel> = {}): PlannedMovementModel {
	return { ...PlannedMovementMapper.toModel(PLANNED_MOVEMENT_DTO), ...overrides };
}

describe('PlannedMovementCardComponent', () => {
	let fixture: ComponentFixture<PlannedMovementCardComponent>;
	let openPlanned: Mock<(value: PlannedMovementModel) => void>;
	let canCreate: WritableSignal<boolean>;

	async function create(
		movements: PlannedMovementModel[] | undefined,
		options: { loading?: boolean; error?: NotificationModel } = {},
	): Promise<PlannedMovementCardHarness> {
		fixture = TestBed.createComponent(PlannedMovementCardComponent);
		Object.entries({
			movements,
			loading: options.loading ?? false,
			error: options.error,
			titleKey: 'title',
			totalKey: 'total',
			emptyKey: 'empty',
			icon: 'plane-arrival',
			rowIcon: 'arrow-right-to-bracket',
		}).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, PlannedMovementCardHarness);
	}

	beforeEach(() => {
		openPlanned = vi.fn();
		canCreate = signal(true);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: DatePipe, useValue: { transform: (): string => '10:32' } },
				{
					provide: MovementPrefillService,
					useValue: {
						canCreate,
						openPlanned,
						creationUrl: (): string | undefined =>
							canCreate() ? '/projects/p1/movements/create/registered' : undefined,
					},
				},
			],
		});
	});

	it('lists the planned movements with their total and their time', async () => {
		// Arrange
		const movements = [movement(), movement({ poolName: 'Owls' })];

		// Act
		const harness = await create(movements);

		// Assert
		expect((await harness.rows()).map((row) => [row.title, row.time])).toEqual([
			['Wolves', '10:32'],
			['Owls', '10:32'],
		]);
		expect(await harness.totalText()).toBe('fr.total.few');
	});

	it('titles a single participant by name, with the reason and the type of participant', async () => {
		// Arrange
		const single = movement({
			poolName: undefined,
			reason: { label: 'Hospital return', value: 'HOSPITAL', kind: MovementReasonKindEnum.REASON },
		});

		// Act
		const harness = await create([single]);

		// Assert
		const [row] = await harness.rows();
		expect(row.title).toBe('A B');
		expect(row.description).toContain('Hospital return · Registered');
	});

	it('leaves the title empty for a movement without crew nor participant', async () => {
		// Arrange
		const movements = [movement({ poolName: undefined, participants: [] })];

		// Act
		const harness = await create(movements);

		// Assert
		expect((await harness.rows())[0].title).toBe('');
	});

	it('leaves out the time when the movement has none', async () => {
		// Arrange
		const movements = [movement({ plannedAt: undefined })];

		// Act
		const harness = await create(movements);

		// Assert
		expect((await harness.rows())[0].time).toBeUndefined();
	});

	it('shows only the first movements and counts the others', async () => {
		// Arrange
		const movements = Array.from({ length: 8 }, (_, index) => movement({ poolName: `Pool ${index}` }));

		// Act
		const harness = await create(movements);

		// Assert
		expect(await harness.rows()).toHaveLength(5);
		expect(await harness.moreText()).toBe('fr.projectHome.plannedMovement.more.few');
	});

	it('says that nothing is planned', async () => {
		// Arrange
		const movements: PlannedMovementModel[] = [];

		// Act
		const harness = await create(movements);

		// Assert
		expect(await harness.emptyText()).toBe('fr.empty');
		expect(await harness.rows()).toEqual([]);
	});

	it('shows skeleton rows and no total while the movements load', async () => {
		// Arrange
		const options = { loading: true };

		// Act
		const harness = await create(undefined, options);

		// Assert
		expect(await defined(await harness.skeleton()).rowCount()).toBe(3);
		expect(await harness.totalText()).toBeUndefined();
	});

	it('shows the failure and asks for a retry', async () => {
		// Arrange
		const harness = await create(undefined, { error: PageStateHelper.toNotification(ERROR_500) });
		let retries = 0;
		fixture.componentInstance.retry.subscribe(() => retries++);

		// Act
		await defined(await harness.error()).retry();

		// Assert
		expect(retries).toBe(1);
	});

	it.each([
		{
			name: 'links each row to the creation form when the user can create movements',
			allowed: true,
			expected: '/projects/p1/movements/create/registered',
		},
		{ name: 'leaves the rows without link otherwise', allowed: false, expected: undefined },
	])('$name', async ({ allowed, expected }) => {
		// Arrange
		canCreate.set(allowed);

		// Act
		const harness = await create([movement()]);

		// Assert
		expect(await harness.links()).toEqual([expected]);
	});

	it('opens the movement form prefilled with the movement of the clicked row', async () => {
		// Arrange
		const movements = [movement(), movement({ poolName: 'Owls' })];
		const harness = await create(movements);

		// Act
		await harness.open(1);

		// Assert
		expect(openPlanned).toHaveBeenCalledWith(movements[1]);
	});
});
