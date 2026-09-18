import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFacade } from '@core/auth/auth.facade';
import { ConfigFacade } from '@core/config/config.facade';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AccountInfoComponent } from '@shared/ui/account-info/account-info.component';

describe('AccountInfoComponent', () => {
	let component: AccountInfoComponent;
	let fixture: ComponentFixture<AccountInfoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				AccountInfoComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [
				{ provide: AuthFacade, useValue: { currentUser: signal(undefined) } },
				{ provide: ConfigFacade, useValue: { organization: signal(undefined) } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AccountInfoComponent);
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
