import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FavoritesProjectsComponent } from '@shared/ui/favorites-projects/favorites-projects.component';

describe('FavoritesProjectsComponent', () => {
	let component: FavoritesProjectsComponent;
	let fixture: ComponentFixture<FavoritesProjectsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				FavoritesProjectsComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(FavoritesProjectsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('projects', []);
		await fixture.whenStable();
	});

	it('should create', () => {
		// Arrange

		// Act

		// Assert
		expect(component).toBeTruthy();
	});
});
