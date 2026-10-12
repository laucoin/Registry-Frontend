import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { MyAccountPage } from './my-account.page';

describe('MyAccountPage', () => {
	let fixture: ComponentFixture<MyAccountPage>;

	beforeEach(async () => {
		await MockBuilder(MyAccountPage).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(MyAccountPage);
		await fixture.whenStable();
	});

	it('should render the four account sections', () => {
		// Arrange
		const selectors: string[] = ['app-account-info', 'app-account-language', 'app-account-theme', 'app-account-personal-data'];

		// Act
		const rendered: boolean[] = selectors.map((selector: string): boolean => fixture.nativeElement.querySelector(selector) !== null);

		// Assert
		expect(rendered).toEqual([true, true, true, true]);
	});
});
