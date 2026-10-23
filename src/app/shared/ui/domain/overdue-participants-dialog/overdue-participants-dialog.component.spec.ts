import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiFacade } from '@core/registry/state/ui.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { ListComponent } from '@shared/ui/common/list/list.component';
import { OverdueParticipantsDialogComponent } from './overdue-participants-dialog.component';

describe('OverdueParticipantsDialogComponent', () => {
	let fixture: ComponentFixture<OverdueParticipantsDialogComponent>;
	let tinyScreen: WritableSignal<boolean>;
	let fetchOverdueParticipantsListPage: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		tinyScreen = signal(false);
		fetchOverdueParticipantsListPage = vi.fn();
		await MockBuilder(OverdueParticipantsDialogComponent)
			.keep(ListComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: UiFacade, useValue: { tinyScreen } })
			.provide({
				provide: SelectedProjectFacade,
				useValue: {
					overdueParticipantsListPage: signal(undefined),
					overdueParticipantsListLoading: signal(false),
					overdueParticipantsListSilentLoading: signal(false),
					overdueParticipantsListError: signal(undefined),
					fetchOverdueParticipantsListPage,
				},
			});
		fixture = TestBed.createComponent(OverdueParticipantsDialogComponent);
	});

	it('should not load anything while it is closed', async () => {
		// Arrange
		await fixture.whenStable();

		// Act
		const list: HTMLElement | null = fixture.nativeElement.querySelector('app-list');

		// Assert
		expect(list).toBeNull();
		expect(fetchOverdueParticipantsListPage).not.toHaveBeenCalled();
	});

	it('should load the first batch each time it opens', async () => {
		// Arrange
		fixture.componentRef.setInput('open', true);

		// Act
		await fixture.whenStable();

		// Assert
		expect(fetchOverdueParticipantsListPage).toHaveBeenCalledWith(undefined, 20);
	});

	it('should ask for the next batch when the list asks for it', async () => {
		// Arrange
		fixture.componentRef.setInput('open', true);
		await fixture.whenStable();

		// Act
		ngMocks.output('app-list', 'updateRequired').emit({ page: 1, size: 20 });

		// Assert
		expect(fetchOverdueParticipantsListPage).toHaveBeenLastCalledWith(1, 20);
	});

	it('should take the whole screen on a small one only', async () => {
		// Arrange
		await fixture.whenStable();
		const wide: boolean = fixture.nativeElement.querySelector('sgdf-dialog').classList.contains('dialog-fullscreen');

		// Act
		tinyScreen.set(true);
		fixture.detectChanges();
		const small: boolean = fixture.nativeElement.querySelector('sgdf-dialog').classList.contains('dialog-fullscreen');

		// Assert
		expect(wide).toBe(false);
		expect(small).toBe(true);
	});

	it('should close when the dialog hides itself', async () => {
		// Arrange
		fixture.componentRef.setInput('open', true);
		await fixture.whenStable();
		const dialog: HTMLElement = fixture.nativeElement.querySelector('sgdf-dialog');

		// Act
		dialog.dispatchEvent(new Event('sgdf-hide'));

		// Assert
		expect(fixture.componentInstance.open()).toBe(false);
	});
});
