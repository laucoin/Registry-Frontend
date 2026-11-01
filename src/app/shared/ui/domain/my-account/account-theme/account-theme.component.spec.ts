import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionFacade } from '@core/registry/state/session.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { THEME_CHOICES } from '@shared/helpers/theme-choices.const';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { MockBuilder } from 'ng-mocks';
import { AccountThemeComponent } from './account-theme.component';

describe('AccountThemeComponent', () => {
	let theme: WritableSignal<ThemeEnum>;
	let updateCurrentUserTheme: ReturnType<typeof vi.fn>;
	let fixture: ComponentFixture<AccountThemeComponent>;

	beforeEach(async () => {
		theme = signal<ThemeEnum>(ThemeEnum.LIGHT);
		updateCurrentUserTheme = vi.fn();
		await MockBuilder(AccountThemeComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SessionFacade, useValue: { currentUserTheme: theme, themeChoices: THEME_CHOICES, updateCurrentUserTheme } });
		fixture = TestBed.createComponent(AccountThemeComponent);
		await fixture.whenStable();
	});

	it('should select the current theme in the group', () => {
		// Arrange
		const group: HTMLElement & { value: string } = fixture.nativeElement.querySelector('sgdf-radio-group');

		// Act
		const value: string = group.value;

		// Assert
		expect(value).toBe(ThemeEnum.LIGHT);
	});

	it('should forward the chosen theme to the facade', () => {
		// Arrange
		const group: HTMLElement = fixture.nativeElement.querySelector('sgdf-radio-group');
		Object.defineProperty(group, 'value', { value: ThemeEnum.DARK });

		// Act
		group.dispatchEvent(new Event('change'));

		// Assert
		expect(updateCurrentUserTheme).toHaveBeenCalledWith(ThemeEnum.DARK);
	});

	it('should render one radio per choice of the facade', () => {
		// Arrange
		const radios: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('sgdf-radio');

		// Act
		const count: number = radios.length;

		// Assert
		expect(count).toBe(THEME_CHOICES.length);
	});
});
