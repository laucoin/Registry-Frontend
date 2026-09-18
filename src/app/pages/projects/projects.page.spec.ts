import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ProjectsPage } from '@pages/projects/projects.page';

describe('ProjectsPage', () => {
	let component: ProjectsPage;
	let fixture: ComponentFixture<ProjectsPage>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				ProjectsPage,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ProjectsPage);
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
