import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { MonitoringRowComponent } from './monitoring-row.component';

const row: MonitoringRowModel = { id: '1', title: 'Camille RENAUD', subtitle: 'Santé', statusLabel: 'En sortie', statusVariant: 'warning', icon: 'user' };

describe('MonitoringRowComponent', () => {
	let fixture: ComponentFixture<MonitoringRowComponent>;

	async function render(value: MonitoringRowModel): Promise<void> {
		fixture.componentRef.setInput('row', value);
		await fixture.whenStable();
	}

	beforeEach(async () => {
		await MockBuilder(MonitoringRowComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(MonitoringRowComponent);
	});

	it('should color the avatar and the status tag with the variant of the row', async () => {
		// Arrange
		await render(row);

		// Act
		const avatar: { variant: string } = fixture.nativeElement.querySelector('sgdf-avatar');
		const tag: { variant: string } = fixture.nativeElement.querySelector('sgdf-tag');

		// Assert
		expect(avatar.variant).toBe('warning');
		expect(tag.variant).toBe('warning');
	});

	it('should display the title, the description and the status label', async () => {
		// Arrange
		await render(row);

		// Act
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('Camille RENAUD');
		expect(text).toContain('Santé');
		expect(text).toContain('En sortie');
	});

	it('should leave out the description and the tag when the row has none', async () => {
		// Arrange
		await render({ ...row, subtitle: undefined, statusLabel: undefined });

		// Act
		const optional: number = fixture.nativeElement.querySelectorAll('sgdf-tag, [slot="description"]').length;

		// Assert
		expect(optional).toBe(0);
	});

	it('should not offer a checkbox unless the row is selectable', async () => {
		// Arrange
		await render(row);

		// Act
		const checkbox: HTMLElement | null = fixture.nativeElement.querySelector('sgdf-checkbox');

		// Assert
		expect(checkbox).toBeNull();
	});

	it('should show the checkbox in front of the avatar with its checked state', async () => {
		// Arrange
		fixture.componentRef.setInput('selectable', true);
		fixture.componentRef.setInput('checked', true);
		await render(row);

		// Act
		const checkbox: { checked: boolean } = fixture.nativeElement.querySelector('sgdf-checkbox');

		// Assert
		expect(checkbox.checked).toBe(true);
	});

	it('should tell the change of the checkbox', async () => {
		// Arrange
		fixture.componentRef.setInput('selectable', true);
		await render(row);
		const changes: boolean[] = [];
		fixture.componentInstance.checkedChange.subscribe((checked: boolean): number => changes.push(checked));
		const checkbox: HTMLElement & { checked: boolean } = fixture.nativeElement.querySelector('sgdf-checkbox');

		// Act
		checkbox.checked = true;
		checkbox.dispatchEvent(new Event('change'));

		// Assert
		expect(changes).toEqual([true]);
	});

	it('should explain the status to regularize under the participant concerned only', async () => {
		// Arrange
		await render({ ...row, overdue: true });
		const concerned: string = fixture.nativeElement.textContent;
		await render({ ...row, overdue: false });

		// Act
		const others: string = fixture.nativeElement.textContent;

		// Assert
		expect(concerned).toContain('projectHome.monitoring.overdueHint');
		expect(others).not.toContain('projectHome.monitoring.overdueHint');
	});
});
