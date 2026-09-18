import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Registry } from '@layout/registry/registry';

describe('Registry', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [Registry],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture: ComponentFixture<Registry> = TestBed.createComponent(Registry);
		const app: Registry = fixture.componentInstance;
		expect(app).toBeTruthy();
	});
});
