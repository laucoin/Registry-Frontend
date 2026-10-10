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

	it('should mark the current theme as pressed', () => {
		// Arrange
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'));

		// Act
		const pressed: (string | null)[] = buttons.map((button: HTMLElement): string | null => button.getAttribute('aria-pressed'));

		// Assert
		expect(pressed).toEqual(['true', 'false', 'false']);
	});

	it('should forward the clicked theme to the facade', () => {
		// Arrange
		const dark: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-button')[1];

		// Act
		dark.click();

		// Assert
		expect(updateCurrentUserTheme).toHaveBeenCalledWith(ThemeEnum.DARK);
	});

	it('should render one button per choice of the facade', () => {
		// Arrange
		const buttons: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('sgdf-button');

		// Act
		const count: number = buttons.length;

		// Assert
		expect(count).toBe(THEME_CHOICES.length);
	});
});
