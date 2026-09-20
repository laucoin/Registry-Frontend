import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideFolderOpen } from '@lucide/angular';

@Component({
	imports: [LucideFolderOpen],
	selector: 'app-empty-state-icon',
	styleUrl: './empty-state-icon.component.less',
	templateUrl: './empty-state-icon.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: App-wide icon for nz-empty's `nzNotFoundImage` slot — a tinted circle badge
 * around a lucide icon, replacing ant design's default illustration.
 * Scope: Presentational only.
 */
export class EmptyStateIconComponent {}
