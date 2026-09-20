import { Component } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LucidePlus } from '@lucide/angular';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';
import { ProjectListComponent } from '@shared/ui/project-list/project-list.component';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
	imports: [PageTitleComponent, TranslocoPipe, NzButtonModule, LucidePlus, ProjectListComponent],
	providers: [provideTranslocoScope('projects')],
	selector: 'app-projects',
	styleUrl: './projects.page.less',
	templateUrl: './projects.page.html',
})
/**
 * Purpose: Projects list route.
 * Scope: Composes ProjectListComponent and the "create project" entry point.
 * Limits: The create-project flow is not implemented yet (see TODO below).
 */
export class ProjectsPage {
	protected createProject(): void {
		// TODO: open the create-project flow once it exists
	}
}
