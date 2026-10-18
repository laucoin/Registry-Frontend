import { ComponentFixture, TestBed } from '@angular/core/testing';
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
		await MockBuilder(MonitoringRowComponent);
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
});
