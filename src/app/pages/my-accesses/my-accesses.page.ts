import { Component } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { ActiveProfilesComponent } from '@shared/ui/active-profiles/active-profiles.component';
import { ExpiredProfilesComponent } from '@shared/ui/expired-profiles/expired-profiles.component';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';
import { PendingInvitationsComponent } from '@shared/ui/pending-invitations/pending-invitations.component';

@Component({
	imports: [
		PageTitleComponent,
		TranslocoPipe,
		PendingInvitationsComponent,
		ActiveProfilesComponent,
		ExpiredProfilesComponent,
	],
	providers: [provideTranslocoScope('myAccesses')],
	selector: 'app-my-accesses',
	styleUrl: './my-accesses.page.less',
	templateUrl: './my-accesses.page.html',
})
/**
 * Purpose: "My accesses" route — pending invitations, active profiles, expired profiles.
 * Scope: Pure composition of the three list components; no data or state of its own.
 * Limits: No-fake-data pattern — each list component sources its own data once its backend exists.
 */
export class MyAccessesPage {}
