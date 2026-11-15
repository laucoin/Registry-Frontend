import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { UiFacade } from '@core/registry/state/ui.facade';
import { OverdueParticipantsDialogComponent } from '@pages/projects/[projectId]/widgets/overdue-participants-dialog/overdue-participants-dialog.component';
import { OverdueParticipantsDialogHarness } from '@pages/projects/[projectId]/widgets/overdue-participants-dialog/testing/overdue-participants-dialog.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { NotificationModel } from '@shared/models/model/notification.model';

@Component({
	imports: [OverdueParticipantsDialogComponent],
	template: '<app-overdue-participants-dialog [(open)]="open" />',
})
class HostComponent {
	public readonly open = signal(false);
}

describe('OverdueParticipantsDialogComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let fetch: Mock<(page: number | undefined, size: number | undefined) => void>;
	let listError: WritableSignal<NotificationModel | undefined>;

	async function create(open: boolean): Promise<OverdueParticipantsDialogHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.open.set(open);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(OverdueParticipantsDialogHarness);
	}

	beforeEach(() => {
		fetch = vi.fn();
		listError = signal<NotificationModel | undefined>(undefined);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: MovementPrefillService, useValue: { creationUrl: (): undefined => undefined } },
				{
					provide: SelectedProjectFacade,
					useValue: {
						overdueParticipantsListPage: signal({
							content: [],
							page: 0,
							size: 20,
							totalElements: 25,
							totalPages: 2,
							hasNext: true,
							lastRefresh: new Date(),
						}),
						overdueParticipantsListError: listError,
						overdueParticipantsListLoading: signal(false),
						overdueParticipantsListSilentLoading: signal(false),
						fetchOverdueParticipantsListPage: fetch,
					},
				},
			],
		});
	});

	it('renders no list while it is closed', async () => {
		// Arrange
		const harness = await create(false);

		// Act
		const list = await harness.list();

		// Assert
		expect([list, fetch.mock.calls]).toEqual([null, []]);
	});

	it('loads the first batch each time it opens', async () => {
		// Arrange
		const harness = await create(true);

		// Act
		await harness.shown();

		// Assert
		expect([(await harness.list()) !== null, fetch.mock.calls]).toEqual([true, [[undefined, 20]]]);
	});

	it('closes when the dialog hides itself', async () => {
		// Arrange
		const harness = await create(true);

		// Act
		await harness.hide();

		// Assert
		expect(fixture.componentInstance.open()).toBe(false);
	});

	it('ignores the show and hide of an element inside the dialog', async () => {
		// Arrange
		await create(true);
		const inner: HTMLElement = fixture.nativeElement.querySelector('app-list');

		// Act
		inner.dispatchEvent(new Event('sgdf-show', { bubbles: true }));
		inner.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

		// Assert
		expect([fixture.componentInstance.open(), fetch.mock.calls]).toEqual([true, []]);
	});

	it('asks for the next batch when its list retries after a failure', async () => {
		// Arrange
		listError.set(PageStateHelper.toNotification(ERROR_500));
		const harness = await create(true);

		// Act
		await (await (await harness.list())?.error())?.retry();

		// Assert
		expect(fetch.mock.calls.at(-1)).toEqual([1, 20]);
	});
});
