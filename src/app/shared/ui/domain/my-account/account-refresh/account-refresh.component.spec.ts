import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionFacade } from '@core/registry/state/session.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { MockBuilder } from 'ng-mocks';
import { AccountRefreshComponent } from './account-refresh.component';

describe('AccountRefreshComponent', () => {
	let mode: WritableSignal<RefreshModeEnum>;
	let updateCurrentUserRefreshMode: ReturnType<typeof vi.fn>;
	let fixture: ComponentFixture<AccountRefreshComponent>;

	beforeEach(async () => {
		mode = signal<RefreshModeEnum>(RefreshModeEnum.NORMAL);
		updateCurrentUserRefreshMode = vi.fn();
		await MockBuilder(AccountRefreshComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SessionFacade, useValue: { currentUserRefreshMode: mode, updateCurrentUserRefreshMode } });
		fixture = TestBed.createComponent(AccountRefreshComponent);
		await fixture.whenStable();
	});

	it('should render one button per refresh mode', () => {
		// Arrange
		const buttons: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('sgdf-button');

		// Act
		const count: number = buttons.length;

		// Assert
		expect(count).toBe(4);
	});

	it('should mark the current mode as pressed', () => {
		// Arrange
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'));

		// Act
		const pressed: (string | null)[] = buttons.map((button: HTMLElement): string | null => button.getAttribute('aria-pressed'));

		// Assert
		expect(pressed).toEqual(['false', 'false', 'true', 'false']);
	});

	it('should forward the clicked mode to the facade', () => {
		// Arrange
		const fast: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-button')[3];

		// Act
		fast.click();

		// Assert
		expect(updateCurrentUserRefreshMode).toHaveBeenCalledWith(RefreshModeEnum.FAST);
	});

	it('should tell screen readers which mode is selected', () => {
		// Arrange
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'));

		// Act
		const hints: (string | undefined)[] = buttons.map((button: HTMLElement): string | undefined => button.querySelector('.sr-only')?.textContent?.trim());

		// Assert
		expect(hints).toEqual([undefined, undefined, '(myAccount.selected)', undefined]);
	});
});
