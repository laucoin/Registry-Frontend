import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { PARTICIPANT_DTO, PLANNED_MOVEMENT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PlannedMovementMapper } from '@shared/mappers/planned-movement.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { PlannedMovementCardComponent } from './planned-movement-card.component';

function movement(overrides: Partial<PlannedMovementModel> = {}): PlannedMovementModel {
	return { ...PlannedMovementMapper.toModel(PLANNED_MOVEMENT_DTO), ...overrides };
}

describe('PlannedMovementCardComponent', () => {
	let fixture: ComponentFixture<PlannedMovementCardComponent>;

	async function render(movements: PlannedMovementModel[] | undefined, options: { loading?: boolean, error?: NotificationModel } = {}): Promise<void> {
		fixture = TestBed.createComponent(PlannedMovementCardComponent);
		fixture.componentRef.setInput('movements', movements);
		fixture.componentRef.setInput('loading', options.loading ?? false);
		fixture.componentRef.setInput('error', options.error);
		fixture.componentRef.setInput('titleKey', 'title');
		fixture.componentRef.setInput('totalKey', 'total');
		fixture.componentRef.setInput('emptyKey', 'empty');
		fixture.componentRef.setInput('icon', 'plane-arrival');
		fixture.componentRef.setInput('rowIcon', 'arrow-down-left');
		await fixture.whenStable();
	}

	beforeEach(async () => {
		await MockBuilder(PlannedMovementCardComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.mock(CustomDateFormatPipe, (): string => '10:32');
	});

	it('should list the planned movements with their total and their time', async () => {
		// Arrange
		const movements: PlannedMovementModel[] = [movement(), movement({ poolName: 'Owls' })];

		// Act
		await render(movements);
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;
		const times: string[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('strong')).map((it: HTMLElement): string => it.textContent.trim());

		// Assert
		expect(rows).toBe(2);
		expect(times).toEqual(['10:32', '10:32']);
		expect(fixture.nativeElement.querySelector('sgdf-tag').textContent.trim()).toBe('total');
	});

	it('should title a pool by its name and a single participant by his name with his reason', async () => {
		// Arrange
		const single: PlannedMovementModel = movement({
			poolName: undefined,
			reason: { label: 'Hospital return', value: 'HOSPITAL', kind: 'REASON' },
		});

		// Act
		await render([movement(), single]);
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('Wolves');
		expect(text).toContain('A B');
		expect(text).toContain('Hospital return · Registered');
	});

	it('should leave out the time when the movement has none', async () => {
		// Arrange
		const movements: PlannedMovementModel[] = [movement({ plannedAt: undefined })];

		// Act
		await render(movements);

		// Assert
		expect(fixture.nativeElement.querySelector('strong')).toBeNull();
	});

	it('should show only the first movements and count the others', async () => {
		// Arrange
		const movements: PlannedMovementModel[] = Array.from({ length: 8 }, (_: unknown, index: number): PlannedMovementModel => movement({ poolName: `Pool ${index}` }));

		// Act
		await render(movements);
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;

		// Assert
		expect(rows).toBe(5);
		expect(fixture.nativeElement.textContent).toContain('projectHome.plannedMovement.more');
	});

	it('should say that nothing is planned', async () => {
		// Arrange
		const movements: PlannedMovementModel[] = [];

		// Act
		await render(movements);

		// Assert
		expect(fixture.nativeElement.textContent).toContain('empty');
		expect(fixture.nativeElement.querySelector('sgdf-list-item')).toBeNull();
	});

	it('should display skeleton rows while the movements load', async () => {
		// Arrange
		const movements: PlannedMovementModel[] | undefined = undefined;

		// Act
		await render(movements, { loading: true });

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-skeleton[shape="rounded"]').length).toBe(3);
		expect(fixture.nativeElement.querySelector('sgdf-tag')).toBeNull();
	});

	it('should display the failure and ask for a retry', async () => {
		// Arrange
		await render(undefined, { error: PageStateHelper.toNotification(ERROR_500) });
		let retried: boolean = false;
		fixture.componentInstance.retry.subscribe((): boolean => retried = true);

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(fixture.nativeElement.querySelector('app-section-error')).not.toBeNull();
		expect(retried).toBe(true);
	});

	it('should know the participants of a movement without a pool', () => {
		// Arrange
		const participant: string = PARTICIPANT_DTO.id;

		// Act
		const model: PlannedMovementModel = movement({ poolName: undefined });

		// Assert
		expect(model.participants[0]?.id).toBe(participant);
	});
});
