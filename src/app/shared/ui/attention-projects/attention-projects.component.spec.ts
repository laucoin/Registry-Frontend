import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AttentionProjectsComponent } from '@shared/ui/attention-projects/attention-projects.component';

describe('AttentionProjectsComponent', () => {
	let component: AttentionProjectsComponent;
	let fixture: ComponentFixture<AttentionProjectsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				AttentionProjectsComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(AttentionProjectsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('projects', []);
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
