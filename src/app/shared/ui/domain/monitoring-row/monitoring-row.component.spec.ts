import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component';
import { MonitoringRowHarness } from '@shared/ui/domain/monitoring-row/testing/monitoring-row.harness';

import '@sgdf/ui/checkbox';

const ROW: MonitoringRowModel = {
	id: '1',
	title: 'Camille RENAUD',
	subtitle: 'Santé',
	statusLabel: 'En sortie',
	statusVariant: 'warning',
	icon: 'user',
};

describe('MonitoringRowComponent', () => {
	let fixture: ComponentFixture<MonitoringRowComponent>;

	async function create(
		row: MonitoringRowModel,
		inputs: Record<string, unknown> = {},
	): Promise<MonitoringRowHarness> {
		fixture = TestBed.createComponent(MonitoringRowComponent);
		fixture.componentRef.setInput('row', row);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MonitoringRowHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: {} },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
				}),
			],
		});
	});

	it('colours the avatar and the status tag with the variant of the row', async () => {
		// Arrange
		const harness = await create(ROW);

		// Act
		const variants = await harness.variants();

		// Assert
		expect(variants).toEqual({ avatar: 'warning', status: 'warning' });
	});

	it('shows the title, the subtitle and the status label', async () => {
		// Arrange
		const harness = await create(ROW);

		// Act
		const shown = [await harness.title(), await harness.subtitleText(), await harness.statusText()];

		// Assert
		expect(shown).toEqual(['Camille RENAUD', 'Santé', 'En sortie']);
	});

	it('leaves out the subtitle and the status when the row has none', async () => {
		// Arrange
		const harness = await create({ ...ROW, subtitle: undefined, statusLabel: undefined });

		// Act
		const shown = [await harness.subtitleText(), await harness.statusText()];

		// Assert
		expect(shown).toEqual([undefined, undefined]);
	});

	it.each([
		{ name: 'explains the status to regularize under an overdue participant', overdue: true, expected: true },
		{ name: 'adds no explanation for the others', overdue: false, expected: false },
	])('$name', async ({ overdue, expected }) => {
		// Arrange
		const harness = await create({ ...ROW, subtitle: undefined, overdue });

		// Act
		const hint = await harness.overdueText();

		// Assert
		expect(hint !== undefined).toBe(expected);
	});

	it('offers no checkbox unless the row is selectable', async () => {
		// Arrange
		const harness = await create(ROW);

		// Act
		const selectable = await harness.selectable();

		// Assert
		expect(selectable).toBe(false);
	});

	it('shows the checked state of a selectable row and tells its change', async () => {
		// Arrange
		const harness = await create(ROW, { selectable: true, checked: true });
		const changes: boolean[] = [];
		fixture.componentInstance.checkedChange.subscribe((checked) => changes.push(checked));
		const before = await harness.checked();

		const checkbox: HTMLElement & { checked: boolean } = fixture.nativeElement.querySelector(
			'[data-test-id="monitoring-row-checkbox"]',
		);

		// Act
		checkbox.checked = false;
		checkbox.dispatchEvent(new Event('change', { bubbles: true }));

		// Assert
		expect([before, changes]).toEqual([true, [false]]);
	});
});
