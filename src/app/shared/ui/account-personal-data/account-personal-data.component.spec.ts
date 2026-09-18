import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AccountPersonalDataComponent } from '@shared/ui/account-personal-data/account-personal-data.component';

describe('AccountPersonalDataComponent', () => {
	let component: AccountPersonalDataComponent;
	let fixture: ComponentFixture<AccountPersonalDataComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				AccountPersonalDataComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [
				provideRouter([]),
				{ provide: AuthFacade, useValue: { currentUser: signal(undefined) } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountPersonalDataComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		// Arrange

		// Act

		// Assert
		expect(component).toBeTruthy();
	});
});
