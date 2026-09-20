import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ReceivedInvitationsComponent } from '@shared/ui/received-invitations/received-invitations.component';

describe('ReceivedInvitationsComponent', () => {
	let component: ReceivedInvitationsComponent;
	let fixture: ComponentFixture<ReceivedInvitationsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				ReceivedInvitationsComponent,
				TranslocoTestingModule.forRoot({
					langs: { en: {} },
					translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
				}),
			],
			providers: [provideRouter([])],
		}).compileComponents();

		fixture = TestBed.createComponent(ReceivedInvitationsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('invitations', []);
		await fixture.whenStable();
	});

	it('should create', () => {
		// Arrange

		// Act

		// Assert
		expect(component).toBeTruthy();
	});
});
