import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistryFacade } from '@core/registry/state/registry.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { MockBuilder } from 'ng-mocks';
import { AccountThemeComponent } from './account-theme.component';

describe('AccountThemeComponent', () => {
	let theme: WritableSignal<ThemeEnum | undefined>;
	let updateCurrentUserTheme: ReturnType<typeof vi.fn>;
	let fixture: ComponentFixture<AccountThemeComponent>;

	beforeEach(async () => {
		theme = signal<ThemeEnum | undefined>(ThemeEnum.LIGHT);
		updateCurrentUserTheme = vi.fn();
		await MockBuilder(AccountThemeComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: RegistryFacade, useValue: { currentUserTheme: theme, updateCurrentUserTheme } });
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

	it('should apply a theme different from the current one', () => {
		// Arrange
		const dark: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-button')[1];

		// Act
		dark.click();

		// Assert
		expect(updateCurrentUserTheme).toHaveBeenCalledWith(ThemeEnum.DARK);
	});

	it('should ignore the current theme', () => {
		// Arrange
		const light: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-button')[0];

		// Act
		light.click();

		// Assert
		expect(updateCurrentUserTheme).not.toHaveBeenCalled();
	});
});
