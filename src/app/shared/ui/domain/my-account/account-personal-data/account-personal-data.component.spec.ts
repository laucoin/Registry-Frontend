import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { AccountPersonalDataComponent } from './account-personal-data.component';

describe('AccountPersonalDataComponent', () => {
	let fixture: ComponentFixture<AccountPersonalDataComponent>;

	beforeEach(async () => {
		await MockBuilder(AccountPersonalDataComponent)
			.mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(AccountPersonalDataComponent);
		await fixture.whenStable();
	});

	it('should link to the privacy page', () => {
		// Arrange
		const link: DebugElement = fixture.debugElement.query(By.css('a'));

		// Act
		const href: string = ngMocks.get(link, RouterLink).routerLink as string;

		// Assert
		expect(href).toBe('/privacy');
	});

	it('should offer the data extract and the account deletion', () => {
		// Arrange
		const expected: number = 2;

		// Act
		const buttons: number = fixture.nativeElement.querySelectorAll('sgdf-button').length;

		// Assert
		expect(buttons).toBe(expected);
	});

	it('should disable both actions while the backend does not offer them', () => {
		// Arrange
		const buttons: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-button'));

		// Act
		const disabled: boolean[] = buttons.map((button: HTMLElement): boolean => button.hasAttribute('disabled'));

		// Assert
		expect(disabled).toEqual([true, true]);
	});

	it('should tag each action as coming soon', () => {
		// Arrange
		const expected: string = 'myAccount.personalData.comingSoon';

		// Act
		const tags: string[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag'))
			.map((tag: HTMLElement): string => tag.textContent!.trim());

		// Assert
		expect(tags).toEqual([expected, expected]);
	});

	it('should title the section with a level two heading', () => {
		// Arrange
		const heading: HTMLElement = fixture.nativeElement.querySelector('sgdf-table-cell[header] > h2');

		// Act
		const title: string = heading.textContent!.trim();

		// Assert
		expect(title).toBe('myAccount.personalData.title');
	});
});
