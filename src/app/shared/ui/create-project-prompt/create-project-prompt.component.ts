import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideFolderPlus } from '@lucide/angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardComponent } from 'ng-zorro-antd/card';

@Component({
	imports: [TranslocoPipe, NzButtonModule, NzCardComponent, LucideFolderPlus],
	selector: 'app-create-project-prompt',
	styleUrl: './create-project-prompt.component.less',
	templateUrl: './create-project-prompt.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page hero widget inviting the user to create their first project.
 * Scope: Shown by HomePage only when the user has no favorite/current/upcoming projects and no
 * received invitations; navigates to the Projects page, where the create-project entry point lives.
 * Limits: No create-project logic of its own — the flow itself lives on the Projects page.
 */
export class CreateProjectPromptComponent {
	private readonly _router: Router = inject(Router);

	protected createProject(): void {
		void this._router.navigate(['/projects']);
	}
}
