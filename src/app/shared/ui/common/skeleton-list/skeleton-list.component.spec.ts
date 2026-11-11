import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

describe('SkeletonListComponent', () => {
	async function create(inputs: Record<string, unknown> = {}): Promise<SkeletonListHarness> {
		const fixture = TestBed.createComponent(SkeletonListComponent);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, SkeletonListHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('renders one item per requested row', async () => {
		// Arrange
		const rows = 5;

		// Act
		const harness = await create({ rows });

		// Assert
		expect(await harness.rowCount()).toBe(5);
	});

	it('announces the list as busy with the loading label', async () => {
		// Arrange
		const expectedLabel = 'fr.global.list.loading';

		// Act
		const harness = await create();

		// Assert
		expect(await harness.busy()).toBe('true');
		expect(await harness.label()).toBe(expectedLabel);
	});

	it.each([
		{ name: 'adds a description line to every row when asked', withDescription: true, expected: 3 },
		{ name: 'renders no description line by default', withDescription: false, expected: 0 },
	])('$name', async ({ withDescription, expected }) => {
		// Arrange
		const inputs = { withDescription };

		// Act
		const harness = await create(inputs);

		// Assert
		expect(await harness.descriptionCount()).toBe(expected);
	});

	it('forwards the appearance to the list', async () => {
		// Arrange
		const appearance = 'soft';

		// Act
		const harness = await create({ appearance });

		// Assert
		expect(await harness.appearance()).toBe('soft');
	});
});
