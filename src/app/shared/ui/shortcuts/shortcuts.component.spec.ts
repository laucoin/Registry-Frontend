import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfigFacade } from '@core/config/config.facade';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShortcutsComponent } from '@shared/ui/shortcuts/shortcuts.component';

describe('ShortcutsComponent', () => {
	let component: ShortcutsComponent;
	let fixture: ComponentFixture<ShortcutsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				ShortcutsComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [
				provideRouter([]),
				{ provide: ConfigFacade, useValue: { support: signal(undefined) } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ShortcutsComponent);
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
