import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';

describe('PageTitleComponent', () => {
	let component: PageTitleComponent;
	let fixture: ComponentFixture<PageTitleComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PageTitleComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(PageTitleComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('eyebrow', 'Eyebrow');
		fixture.componentRef.setInput('title', 'Title');
		await fixture.whenStable();
	});

	it('should create', () => {
		// Arrange

		// Act

		// Assert
		expect(component).toBeTruthy();
	});
});
