import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ProjectRowComponent } from '@shared/ui/project-row/project-row.component';

describe('ProjectRowComponent', () => {
	let component: ProjectRowComponent;
	let fixture: ComponentFixture<ProjectRowComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				ProjectRowComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(ProjectRowComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('id', 'project-1');
		fixture.componentRef.setInput('name', 'Camp d’été');
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
