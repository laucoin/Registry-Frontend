import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistryComponent } from '@core/layout/registry.component';

describe('RegistryComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RegistryComponent],
		}).compileComponents();
	});

	it('should create the app', () => {
		// Arrange
		const fixture: ComponentFixture<RegistryComponent> = TestBed.createComponent(RegistryComponent);

		// Act
		const app: RegistryComponent = fixture.componentInstance;

		// Assert
		expect(app).toBeTruthy();
	});
});
