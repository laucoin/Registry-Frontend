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

	it('should select the current language in the group', () => {
		// Arrange
		const group: HTMLElement & { value: string } = fixture.nativeElement.querySelector('sgdf-radio-group');

		// Act
		const value: string = group.value;

		// Assert
		expect(value).toBe('fr');
	});

	it('should forward the chosen language to the facade', () => {
		// Arrange
		const group: HTMLElement = fixture.nativeElement.querySelector('sgdf-radio-group');
		Object.defineProperty(group, 'value', { value: 'en' });

		// Act
		group.dispatchEvent(new Event('change'));

		// Assert
		expect(updateCurrentUserLanguage).toHaveBeenCalledWith('en');
	});

	it('should disable the group while a language is being saved', async () => {
		// Arrange
		pending.set('en');

		// Act
		await fixture.whenStable();
		const group: HTMLElement & { disabled: boolean } = fixture.nativeElement.querySelector('sgdf-radio-group');

		// Assert
		expect(group.disabled).toBe(true);
	});

	it('should switch to a select past two languages', async () => {
		// Arrange
		await createComponent(['fr', 'en', 'de']);

		// Act
		const options: number = fixture.nativeElement.querySelectorAll('sgdf-option').length;

		// Assert
		expect(options).toBe(3);
		expect(fixture.nativeElement.querySelector('sgdf-radio-group')).toBeNull();
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

	it('should only say that no other language is available when there is a single one', async () => {
		// Arrange
		await createComponent(['fr']);

		// Act
		const message: string | undefined = fixture.nativeElement.querySelector('p')?.textContent?.trim();

		// Assert
		expect(message).toBe('myAccount.language.only');
		expect(fixture.nativeElement.querySelector('sgdf-radio-group')).toBeNull();
		expect(fixture.nativeElement.querySelector('sgdf-select')).toBeNull();
	});

	it('should also say it when no language is configured', async () => {
		// Arrange
		await createComponent([]);

		// Act
		const message: string | undefined = fixture.nativeElement.querySelector('p')?.textContent?.trim();

		// Assert
		expect(message).toBe('myAccount.language.only');
	});
});
