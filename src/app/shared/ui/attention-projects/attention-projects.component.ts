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
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideTriangleAlert } from '@lucide/angular';
import { ProjectModel } from '@shared/models/project.model';
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
		LucideTriangleAlert,
		EmptyStateIconComponent,
		ProjectRowComponent,
	],
	selector: 'app-attention-projects',
	styleUrl: './attention-projects.component.less',
	templateUrl: './attention-projects.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page widget listing the user's projects that currently have at least one ongoing alert,
 * sorted by that count descending (as returned by the backend).
 * Scope: Pure display of the `projects` input; emits `favoriteToggled`; "view all" navigates to `/projects`.
 * Limits: No data fetching, filtering, sorting or persistence of its own — the parent (HomePage/HomeFacade)
 * supplies the already-filtered/sorted list; this widget is never promoted to the home page's hero slot.
 */
export class AttentionProjectsComponent {
	private readonly _router: Router = inject(Router);
	private readonly _translateService: TranslocoService = inject(TranslocoService);

	public readonly projects: InputSignal<ProjectModel[]> = input.required<ProjectModel[]>();

	public readonly favoriteToggled: OutputEmitterRef<string> = output<string>();

	protected toggleFavorite(project: ProjectModel): void {
		this.favoriteToggled.emit(project.id);
	}

	protected viewAllProjects(): void {
		void this._router.navigate(['/projects']);
	}

	protected ongoingAlertsLabel(ongoingAlerts: number): string {
		const translationKey: string = `home.attentionProjects.ongoingAlerts${ongoingAlerts > 1 ? '_plural' : ''}`;
		return this._translateService.translate(translationKey, { count: ongoingAlerts });
	}
}
