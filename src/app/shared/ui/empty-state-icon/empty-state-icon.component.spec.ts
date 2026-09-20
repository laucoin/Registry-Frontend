import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';

describe('EmptyStateIconComponent', () => {
	let component: EmptyStateIconComponent;
	let fixture: ComponentFixture<EmptyStateIconComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [EmptyStateIconComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(EmptyStateIconComponent);
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
