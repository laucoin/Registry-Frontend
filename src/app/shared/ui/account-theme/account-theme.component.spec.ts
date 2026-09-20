import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFacade } from '@core/auth/auth.facade';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AccountThemeComponent } from '@shared/ui/account-theme/account-theme.component';

describe('AccountThemeComponent', () => {
	let component: AccountThemeComponent;
	let fixture: ComponentFixture<AccountThemeComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				AccountThemeComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [{ provide: AuthFacade, useValue: { currentUser: signal(undefined) } }],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountThemeComponent);
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
