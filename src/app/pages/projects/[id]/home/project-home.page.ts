import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

@Component({
	imports: [TranslocoPipe],
	providers: [provideTranslocoScope('projectHome')],
	selector: 'app-project-home',
	templateUrl: './project-home.page.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Placeholder landing route for a single project's dashboard (`/projects/:id/home`).
 * Scope: Static placeholder only — no data fetching yet.
 * Limits: The real project dashboard (data, api/store/facade, error handling) is a separate increment.
 */
export class ProjectHomePage {}
