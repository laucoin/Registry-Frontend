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

	it('should render one radio per refresh mode', () => {
		// Arrange
		const radios: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('sgdf-radio');

		// Act
		const count: number = radios.length;

		// Assert
		expect(count).toBe(4);
	});

	it('should select the current mode in the group', () => {
		// Arrange
		const group: HTMLElement & { value: string } = fixture.nativeElement.querySelector('sgdf-radio-group');

		// Act
		const value: string = group.value;

		// Assert
		expect(value).toBe(RefreshModeEnum.NORMAL);
	});

	it('should forward the chosen mode to the facade', () => {
		// Arrange
		const group: HTMLElement = fixture.nativeElement.querySelector('sgdf-radio-group');
		Object.defineProperty(group, 'value', { value: RefreshModeEnum.FAST });

		// Act
		group.dispatchEvent(new Event('change'));

		// Assert
		expect(updateCurrentUserRefreshMode).toHaveBeenCalledWith(RefreshModeEnum.FAST);
	});
});
