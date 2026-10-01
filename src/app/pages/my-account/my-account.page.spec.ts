import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@core/auth/auth.facade';
import { ConfigFacade } from '@core/config/config.facade';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MyAccountPage } from '@pages/my-account/my-account.page';

describe('MyAccountPage', () => {
	let component: MyAccountPage;
	let fixture: ComponentFixture<MyAccountPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				MyAccountPage,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [
				provideRouter([]),
				{ provide: AuthFacade, useValue: { currentUser: signal(undefined) } },
				{ provide: ConfigFacade, useValue: { organization: signal(undefined) } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MyAccountPage);
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
