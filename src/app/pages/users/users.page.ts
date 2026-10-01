import { Component } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LucideUserPlus } from '@lucide/angular';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';
import { UserListComponent } from '@shared/ui/user-list/user-list.component';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
	imports: [PageTitleComponent, TranslocoPipe, NzButtonModule, LucideUserPlus, UserListComponent],
	providers: [provideTranslocoScope('users')],
	selector: 'app-users',
	styleUrl: './users.page.less',
	templateUrl: './users.page.html',
})
/**
 * Purpose: Users list route.
 * Scope: Composes UserListComponent and the "add user" entry point.
 * Limits: The add-user flow is not implemented yet (see TODO below).
 */
export class UsersPage {
	protected addUser(): void {
		// TODO: open the add-user flow once it exists
	}
}
