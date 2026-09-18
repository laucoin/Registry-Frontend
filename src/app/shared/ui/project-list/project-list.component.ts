import {
	ChangeDetectionStrategy,
	Component,
	computed,
	Signal,
	signal,
	WritableSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
	LucideBan,
	LucideEllipsisVertical,
	LucideFolderKanban,
	LucidePencil,
	LucideSearch,
	LucideStar,
	LucideTrash2,
} from '@lucide/angular';
import { StringHelper } from '@shared/helpers/string.helper';
import { ProjectListItemModel } from '@shared/models/project-list-item.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
	imports: [
		TranslocoPipe,
		NzCardComponent,
		NzDividerComponent,
		NzEmptyComponent,
		NzButtonModule,
		NzDropdownModule,
		NzMenuModule,
		LucideStar,
		LucideSearch,
		LucideEllipsisVertical,
		LucidePencil,
		LucideBan,
		LucideTrash2,
		LucideFolderKanban,
		EmptyStateIconComponent,
	],
	selector: 'app-project-list',
	styleUrl: './project-list.component.less',
	templateUrl: './project-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Projects-page list — search, favorite toggle, and per-project actions (edit/deactivate/delete/open).
 * Scope: Local, in-memory list with client-side filtering.
 * Limits: No-fake-data placeholder — the projects API doesn't exist yet, so the list is always empty and every
 * action beyond client-side search/favorite is a TODO (see below).
 */
export class ProjectListComponent {
	// TODO: fetch the projects from the backend once the projects API exists
	protected readonly projects: WritableSignal<ProjectListItemModel[]> = signal<
		ProjectListItemModel[]
	>([]);
	protected readonly searchTerm: WritableSignal<string> = signal<string>('');

	protected readonly favoriteCount: Signal<number> = computed(
		() => this.projects().filter((project: ProjectListItemModel) => project.isFavorite).length,
	);

	protected readonly filteredProjects: Signal<ProjectListItemModel[]> = computed(() => {
		const term: string = this.searchTerm().trim().toLowerCase();
		if (StringHelper.isBlank(term)) {
			return this.projects();
		}
		return this.projects().filter(
			(project: ProjectListItemModel) =>
				project.name.toLowerCase().includes(term) || project.code.toLowerCase().includes(term),
		);
	});

	protected onSearchInput(event: Event): void {
		this.searchTerm.set((event.target as HTMLInputElement).value);
	}

	protected toggleFavorite(project: ProjectListItemModel): void {
		// TODO: persist the favorite state through the backend once the projects API exists
		this.projects.update((projects: ProjectListItemModel[]) =>
			projects.map((p: ProjectListItemModel) =>
				p.id === project.id ? { ...p, isFavorite: !p.isFavorite } : p,
			),
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature documents the eventual API call's input ahead of the TODO it belongs to.
	protected openProject(project: ProjectListItemModel): void {
		// TODO: navigate to the project detail page once it exists
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature documents the eventual API call's input ahead of the TODO it belongs to.
	protected editProject(project: ProjectListItemModel): void {
		// TODO: open the edit-project flow once it exists
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature documents the eventual API call's input ahead of the TODO it belongs to.
	protected deactivateProject(project: ProjectListItemModel): void {
		// TODO: call the backend to deactivate the project once the projects API exists
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature documents the eventual API call's input ahead of the TODO it belongs to.
	protected deleteProject(project: ProjectListItemModel): void {
		// TODO: call the backend to permanently delete the project once the projects API exists
	}
}
