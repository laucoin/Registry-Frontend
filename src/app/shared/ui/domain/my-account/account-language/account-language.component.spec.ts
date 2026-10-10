import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionFacade } from '@core/registry/state/session.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { AccountLanguageComponent } from './account-language.component';

describe('AccountLanguageComponent', () => {
	let language: WritableSignal<string>;
	let pending: WritableSignal<string | undefined>;
	let updateCurrentUserLanguage: ReturnType<typeof vi.fn>;
	let facade: { availableLanguages: string[] };
	let fixture: ComponentFixture<AccountLanguageComponent>;

	const createComponent = async (languages: string[]): Promise<void> => {
		facade.availableLanguages = languages;
		fixture = TestBed.createComponent(AccountLanguageComponent);
		await fixture.whenStable();
	};

	beforeEach(async () => {
		language = signal('fr');
		pending = signal<string | undefined>(undefined);
		updateCurrentUserLanguage = vi.fn();
		facade = { availableLanguages: [] };
		await MockBuilder(AccountLanguageComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({
				provide: SessionFacade,
				useValue: Object.assign(facade, { currentUserLanguage: language, pendingLanguage: pending, updateCurrentUserLanguage }),
			});
		await createComponent(['fr', 'en']);
	});

	it('should mark the current language as pressed', () => {
		// Arrange
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'));

		// Act
		const pressed: (string | null)[] = buttons.map((button: HTMLElement): string | null => button.getAttribute('aria-pressed'));

		// Assert
		expect(pressed).toEqual(['true', 'false']);
	});

	it('should forward the clicked language to the facade', () => {
		// Arrange
		const english: HTMLElement = fixture.nativeElement.querySelectorAll('sgdf-button')[1];

		// Act
		english.click();

		// Assert
		expect(updateCurrentUserLanguage).toHaveBeenCalledWith('en');
	});

	it('should show the loader only on the language being saved', async () => {
		// Arrange
		pending.set('en');

		// Act
		await fixture.whenStable();
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'));

		// Assert
		expect(buttons.map((button: HTMLElement): boolean => (button as HTMLElement & { loading: boolean }).loading)).toEqual([false, true]);
		expect(buttons.every((button: HTMLElement): boolean => (button as HTMLElement & { disabled: boolean }).disabled)).toBe(true);
	});

	it('should switch to a select past two languages', async () => {
		// Arrange
		await createComponent(['fr', 'en', 'de']);

		// Act
		const options: number = fixture.nativeElement.querySelectorAll('sgdf-option').length;

		// Assert
		expect(options).toBe(3);
		expect(fixture.nativeElement.querySelector('sgdf-button')).toBeNull();
	});

	it('should apply the language picked in the select', async () => {
		// Arrange
		await createComponent(['fr', 'en', 'de']);
		const select: HTMLElement = fixture.nativeElement.querySelector('sgdf-select');

		// Act
		Object.defineProperty(select, 'value', { value: 'de' });
		select.dispatchEvent(new Event('change'));

		// Assert
		expect(updateCurrentUserLanguage).toHaveBeenCalledWith('de');
	});
});
