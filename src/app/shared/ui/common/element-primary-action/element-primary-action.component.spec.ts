import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ElementActionModel } from '@shared/models/model/element-action.model';
import { ElementPrimaryActionComponent } from '@shared/ui/common/element-primary-action/element-primary-action.component';
import { ElementPrimaryActionHarness } from '@shared/ui/common/element-primary-action/testing/element-primary-action.harness';

describe('ElementPrimaryActionComponent', () => {
	let run: Mock<() => void>;

	async function create(disabled: boolean): Promise<ElementPrimaryActionHarness> {
		const action: ElementActionModel = {
			id: 'history',
			label: 'History',
			icon: 'clock',
			disabled,
			danger: false,
			run,
		};
		const fixture = TestBed.createComponent(ElementPrimaryActionComponent);
		fixture.componentRef.setInput('action', action);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ElementPrimaryActionHarness);
	}

	beforeEach(() => {
		run = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { History: 'Historique' } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
		});
	});

	it.each([
		{ name: 'runs an available action', disabled: false, runs: 1 },
		{ name: 'shows an unavailable action without running it', disabled: true, runs: 0 },
	])('$name', async ({ disabled, runs }) => {
		// Arrange
		const harness = await create(disabled);

		// Act
		await harness.click();

		// Assert
		expect([await harness.label(), await harness.disabled(), run.mock.calls.length]).toEqual([
			'Historique',
			disabled,
			runs,
		]);
	});
});
