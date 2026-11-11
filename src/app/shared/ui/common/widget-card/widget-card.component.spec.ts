import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { defined } from '@shared/helpers/testing/defined';
import { WidgetStateEnum } from '@shared/models/enumeration/widget-state.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { WidgetCardHarness } from '@shared/ui/common/widget-card/testing/widget-card.harness';
import { WidgetCardComponent } from '@shared/ui/common/widget-card/widget-card.component';

@Component({
	imports: [WidgetCardComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './widget-card.component.spec.html',
})
class HostComponent {
	public readonly total: WritableSignal<string | undefined> = signal(undefined);
	public readonly state = signal(WidgetStateEnum.CONTENT);
	public readonly error: WritableSignal<NotificationModel | undefined> = signal(undefined);
	public readonly retrying = signal(false);
	public retries = 0;
}

describe('WidgetCardComponent', () => {
	let host: HostComponent;

	async function create(): Promise<WidgetCardHarness> {
		const fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
		return TestbedHarnessEnvironment.loader(fixture).getHarness(WidgetCardHarness);
	}

	const content = (): Element | null => document.querySelector('[data-test-id="host-content"]');

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('titles the widget with its icon and shows its total once known', async () => {
		// Arrange
		const harness = await create();
		const before = await harness.total();

		// Act
		host.total.set('3 alerts');

		// Assert
		expect([await harness.title(), await harness.icon(), before, await harness.total()]).toEqual([
			'Alerts',
			'bell',
			undefined,
			'3 alerts',
		]);
	});

	it.each([
		{ name: 'a skeleton while loading', state: WidgetStateEnum.LOADING, expected: [true, undefined, false] },
		{
			name: 'the empty message when there is nothing',
			state: WidgetStateEnum.EMPTY,
			expected: [false, 'Nothing', false],
		},
		{ name: 'the projected content otherwise', state: WidgetStateEnum.CONTENT, expected: [false, undefined, true] },
	])('shows $name', async ({ state, expected }) => {
		// Arrange
		const harness = await create();

		// Act
		host.state.set(state);

		// Assert
		expect([(await harness.skeleton()) !== null, await harness.empty(), content() !== null]).toEqual(expected);
	});

	it('shows the failure, asks for a retry and tells when it is retrying', async () => {
		// Arrange
		const harness = await create();
		host.error.set({ summary: 'Down', detail: 'Later' } as NotificationModel);
		host.retrying.set(true);
		const error = defined(await harness.error());

		// Act
		await error.retry();

		// Assert
		expect([await error.title(), await error.retrying(), host.retries]).toEqual(['Down', true, 1]);
	});
});
