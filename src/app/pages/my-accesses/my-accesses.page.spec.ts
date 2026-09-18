import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MyAccessesPage } from '@pages/my-accesses/my-accesses.page';

describe('MyAccessesPage', () => {
	let component: MyAccessesPage;
	let fixture: ComponentFixture<MyAccessesPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				MyAccessesPage,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(MyAccessesPage);
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
