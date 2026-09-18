import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideStar } from '@lucide/angular';
import { ProjectCountsModel } from '@shared/models/project-counts.model';

type ProjectCountKey = 'participants' | 'vehicles' | 'groups' | 'activities' | 'profiles';

@Component({
	imports: [RouterLink, LucideStar, TranslocoPipe],
	selector: 'app-project-row',
	styleUrl: './project-row.component.less',
	templateUrl: './project-row.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Single clickable project row shared by the home page's "attention", "in progress" and
 * "upcoming" widgets — project name, an optional element-count summary, an optional list of
 * options/modules, and a caller-projected trailing badge (ongoing alerts, dates, ...), linking to
 * that project's home.
 * Scope: Pure display of its inputs; navigates to `/projects/:id/home`. Formats `counts` into text
 * itself via `home.projectRow.*` i18n keys, and `options` via a simple join, falling back to a "no
 * options" label when the array is empty — callers only pass the raw data. `options` is `null` when
 * the caller doesn't track options at all (the line is hidden), vs. `[]` when it does but there are
 * none for this project (the fallback label shows). The trailing badge is fully caller-owned through
 * content projection: this component knows nothing about its markup or color. Also renders an optional
 * favorite-toggle star, shown whenever a caller passes `isFavorite`.
 * Limits: Assumes the `home` transloco scope is already provided by an ancestor (as `HomePage` does) —
 * not meant to be reused outside the home page without also providing that scope. The `<nz-divider>`
 * between rows and the `nz-card` shell stay in each parent, not here.
 */
export class ProjectRowComponent {
	private readonly _translateService: TranslocoService = inject(TranslocoService);

	public readonly id: InputSignal<string> = input.required<string>();
	public readonly name: InputSignal<string> = input.required<string>();
	public readonly counts: InputSignal<ProjectCountsModel | null> =
		input<ProjectCountsModel | null>(null);
	public readonly options: InputSignal<string[] | null> = input<string[] | null>(null);
	public readonly isFavorite: InputSignal<boolean | null> = input<boolean | null>(null);

	public readonly favoriteToggled: OutputEmitterRef<void> = output<void>();

	protected onToggleFavorite(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		this.favoriteToggled.emit();
	}

	protected countsLabel(counts: ProjectCountsModel): string {
		return (['participants', 'vehicles', 'groups', 'activities', 'profiles'] as const)
			.map((key: ProjectCountKey) => this._countLabel(key, counts[key]))
			.filter((label: string | null): label is string => label !== null)
			.join(' · ');
	}

	protected optionsLabel(options: string[]): string {
		return options.length > 0
			? options.join(' · ')
			: this._translateService.translate('home.projectRow.noOptions');
	}

	private _countLabel(key: ProjectCountKey, count: number): string | null {
		if (count <= 0) {
			return null;
		}
		const translationKey: string = `home.projectRow.${key}${count > 1 ? '_plural' : ''}`;
		return this._translateService.translate(translationKey, { count });
	}
}
