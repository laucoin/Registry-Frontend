import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideStar } from '@lucide/angular';
import { ProjectSummaryModel } from '@shared/models/project-summary.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';

@Component({
	imports: [
		TranslocoPipe,
		RouterLink,
		NzDividerComponent,
		NzEmptyComponent,
		LucideStar,
		EmptyStateIconComponent,
	],
	selector: 'app-favorites-projects',
	styleUrl: './favorites-projects.component.less',
	templateUrl: './favorites-projects.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page widget listing the user's recently active favorite projects.
 * Scope: Pure display of the `projects`/`totalCount` inputs; emits `favoriteToggled`; "view all" navigates to `/projects`.
 * Limits: No data fetching or persistence of its own — the parent (HomePage/HomeFacade) owns the data.
 */
export class FavoritesProjectsComponent {
	private readonly _router: Router = inject(Router);

	public readonly projects: InputSignal<ProjectSummaryModel[]> = input.required<ProjectSummaryModel[]>();
	public readonly totalCount: InputSignal<number> = input<number>(0);

	public readonly favoriteToggled: OutputEmitterRef<string> = output<string>();

	protected toggleFavorite(project: ProjectSummaryModel): void {
		this.favoriteToggled.emit(project.id);
	}

	protected viewAllProjects(): void {
		void this._router.navigate(['/projects']);
	}
}
