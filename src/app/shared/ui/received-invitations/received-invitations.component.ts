import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	Signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideMail } from '@lucide/angular';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';

const MAX_VISIBLE_INVITATIONS: number = 3;

@Component({
	imports: [
		TranslocoPipe,
		RouterLink,
		NzCardComponent,
		NzDividerComponent,
		NzEmptyComponent,
		NzButtonModule,
		LucideMail,
		EmptyStateIconComponent,
	],
	selector: 'app-received-invitations',
	styleUrl: './received-invitations.component.less',
	templateUrl: './received-invitations.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page widget listing received invitations (capped display) with accept/decline actions.
 * Scope: Pure display of the `invitations` input; emits `accepted`/`declined` events for the parent to handle.
 * Limits: No data fetching or state mutation of its own — only shows up to 3 invitations, delegates the rest.
 */
export class ReceivedInvitationsComponent {
	public readonly invitations: InputSignal<ProjectProfileModel[]> = input.required<ProjectProfileModel[]>();

	public readonly accepted: OutputEmitterRef<string> = output<string>();
	public readonly declined: OutputEmitterRef<string> = output<string>();

	protected readonly visibleInvitations: Signal<ProjectProfileModel[]> = computed(() =>
		this.invitations().slice(0, MAX_VISIBLE_INVITATIONS),
	);
	protected readonly hasMoreInvitations: Signal<boolean> = computed(
		() => this.invitations().length > MAX_VISIBLE_INVITATIONS,
	);

	protected acceptInvitation(invitation: ProjectProfileModel): void {
		this.accepted.emit(invitation.id);
	}

	protected declineInvitation(invitation: ProjectProfileModel): void {
		this.declined.emit(invitation.id);
	}
}
