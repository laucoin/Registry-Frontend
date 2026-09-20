import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideShieldCheck } from '@lucide/angular';
import { ProjectAccessModel } from '@shared/models/project-access.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';

@Component({
	imports: [
		TranslocoPipe,
		NzCardComponent,
		NzDividerComponent,
		NzEmptyComponent,
		LucideShieldCheck,
		EmptyStateIconComponent,
	],
	selector: 'app-active-profiles',
	styleUrl: './active-profiles.component.less',
	templateUrl: './active-profiles.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: "My accesses" section listing the user's active project profiles.
 * Scope: Pure display of an in-memory list.
 * Limits: No-fake-data placeholder — the accesses API doesn't exist yet, so the list is always empty (see TODO below).
 */
export class ActiveProfilesComponent {
	// TODO: fetch the active project profiles from the backend once the accesses API exists
	protected readonly profiles: WritableSignal<ProjectAccessModel[]> = signal<ProjectAccessModel[]>(
		[],
	);
}
