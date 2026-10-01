import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideCalendarClock } from '@lucide/angular';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
import { ProjectRowComponent } from '@shared/ui/project-row/project-row.component';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';

@Component({
	imports: [
		TranslocoPipe,
		NzCardComponent,
		NzDividerComponent,
		NzEmptyComponent,
		LucideCalendarClock,
		EmptyStateIconComponent,
		ProjectRowComponent,
	],
	selector: 'app-upcoming-projects',
	styleUrl: './upcoming-projects.component.less',
	templateUrl: './upcoming-projects.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page widget listing the user's projects that haven't started yet.
 * Scope: Pure display of the `projects` input; emits `favoriteToggled`; "view all" navigates to `/projects`.
 * Limits: No data fetching or persistence of its own — the parent (HomePage/HomeFacade) supplies the list.
 */
export class UpcomingProjectsComponent {
	private readonly _router: Router = inject(Router);

	public readonly projects: InputSignal<ProjectProfileModel[]> =
		input.required<ProjectProfileModel[]>();

	public readonly favoriteToggled: OutputEmitterRef<string> = output<string>();

	protected toggleFavorite(project: ProjectProfileModel): void {
		this.favoriteToggled.emit(project.id);
	}

	protected viewAllProjects(): void {
		void this._router.navigate(['/projects']);
	}
}
