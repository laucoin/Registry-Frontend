import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ProjectsInProgressComponent } from '@shared/ui/projects-in-progress/projects-in-progress.component';

describe('ProjectsInProgressComponent', () => {
	let component: ProjectsInProgressComponent;
	let fixture: ComponentFixture<ProjectsInProgressComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				ProjectsInProgressComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(ProjectsInProgressComponent);
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
