import { ChangeDetectionStrategy, Component, inject, input, InputSignal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideFolderKanban } from '@lucide/angular';
import { WatchedProjectModel } from '@shared/models/watched-project.model';
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
		LucideFolderKanban,
		EmptyStateIconComponent,
		ProjectRowComponent,
	],
	selector: 'app-projects-in-progress',
	styleUrl: './projects-in-progress.component.less',
	templateUrl: './projects-in-progress.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page widget listing projects the user can watch/follow.
 * Scope: Pure display of the `projects` input; "view all" navigates to `/projects`.
 * Limits: No data fetching of its own — the parent (HomePage/HomeFacade) supplies the list.
 */
export class ProjectsInProgressComponent {
	private readonly _router: Router = inject(Router);
	private readonly _translateService: TranslocoService = inject(TranslocoService);

	public readonly projects: InputSignal<WatchedProjectModel[]> =
		input.required<WatchedProjectModel[]>();

	protected viewAllProjects(): void {
		void this._router.navigate(['/projects']);
	}

	protected endDateBadgeLabel(endDateLabel: string): string {
		return endDateLabel
			? this._translateService.translate('home.projectsToWatch.endDate', { date: endDateLabel })
			: this._translateService.translate('home.projectsToWatch.noEndDate');
	}
}
