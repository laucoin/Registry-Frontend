import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UsersPage } from '@pages/users/users.page';

describe('UsersPage', () => {
	let component: UsersPage;
	let fixture: ComponentFixture<UsersPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				UsersPage,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(UsersPage);
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
