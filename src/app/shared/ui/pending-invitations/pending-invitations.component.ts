import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideMail } from '@lucide/angular';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';

@Component({
	imports: [
		TranslocoPipe,
		NzCardComponent,
		NzDividerComponent,
		NzEmptyComponent,
		NzButtonModule,
		LucideMail,
		EmptyStateIconComponent,
	],
	selector: 'app-pending-invitations',
	styleUrl: './pending-invitations.component.less',
	templateUrl: './pending-invitations.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: "My accesses" section listing invitations pending the user's response.
 * Scope: Local, optimistic list mutation on accept/decline.
 * Limits: No-fake-data placeholder — the invitations API doesn't exist yet, so accept/decline only update local state (see TODOs below).
 */
export class PendingInvitationsComponent {
	// TODO: fetch the pending invitations from the backend once the invitations API exists
	protected readonly invitations: WritableSignal<ProjectProfileModel[]> = signal<
		ProjectProfileModel[]
	>([]);

	protected acceptInvitation(invitation: ProjectProfileModel): void {
		// TODO: call the backend to accept the invitation once the invitations API exists
		this._removeInvitation(invitation.id);
	}

	protected declineInvitation(invitation: ProjectProfileModel): void {
		// TODO: call the backend to decline the invitation once the invitations API exists
		this._removeInvitation(invitation.id);
	}

	private _removeInvitation(id: string): void {
		this.invitations.update((invitations: ProjectProfileModel[]) =>
			invitations.filter((invitation: ProjectProfileModel) => invitation.id !== id),
		);
	}
}
