import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UpcomingProjectsComponent } from '@shared/ui/upcoming-projects/upcoming-projects.component';

describe('UpcomingProjectsComponent', () => {
	let component: UpcomingProjectsComponent;
	let fixture: ComponentFixture<UpcomingProjectsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				UpcomingProjectsComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(UpcomingProjectsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('projects', []);
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
