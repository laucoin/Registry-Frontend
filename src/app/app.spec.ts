import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from '@app/app';

describe('App', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [App],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture: ComponentFixture<App> = TestBed.createComponent(App);
		const app: App = fixture.componentInstance;
		expect(app).toBeTruthy();
	});
});
