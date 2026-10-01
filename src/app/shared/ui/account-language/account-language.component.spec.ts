import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFacade } from '@core/auth/auth.facade';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AccountLanguageComponent } from '@shared/ui/account-language/account-language.component';

describe('AccountLanguageComponent', () => {
	let component: AccountLanguageComponent;
	let fixture: ComponentFixture<AccountLanguageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				AccountLanguageComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [{ provide: AuthFacade, useValue: { currentUser: signal(undefined) } }],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountLanguageComponent);
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
