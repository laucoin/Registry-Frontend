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
});
