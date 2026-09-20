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
	LucideLockOpen,
	LucideSearch,
	LucideTrash2,
	LucideUsers,
} from '@lucide/angular';
import { StringHelper } from '@shared/helpers/string.helper';
import { UserAccountModel } from '@shared/models/user-account.model';
import { EmptyStateIconComponent } from '@shared/ui/empty-state-icon/empty-state-icon.component';
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
		NzDropdownModule,
		NzMenuModule,
		LucideUsers,
		LucideSearch,
		LucideEllipsisVertical,
		LucideBan,
		LucideLockOpen,
		LucideTrash2,
		EmptyStateIconComponent,
	],
	selector: 'app-user-list',
	styleUrl: './user-list.component.less',
	templateUrl: './user-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Users-page list — search and per-account actions (block/unblock/delete).
 * Scope: Local, in-memory list with client-side filtering.
 * Limits: No-fake-data placeholder — the users API doesn't exist yet, so the list is always empty and every
 * action beyond client-side search is a TODO (see below).
 */
export class UserListComponent {
	// TODO: fetch the user accounts from the backend once the users API exists
	protected readonly accounts: WritableSignal<UserAccountModel[]> = signal<UserAccountModel[]>([]);
	protected readonly searchTerm: WritableSignal<string> = signal<string>('');

	protected readonly blockedCount: Signal<number> = computed(
		() => this.accounts().filter((account: UserAccountModel) => account.isBlocked).length,
	);

	protected readonly filteredAccounts: Signal<UserAccountModel[]> = computed(() => {
		const term: string = this.searchTerm().trim().toLowerCase();
		if (StringHelper.isBlank(term)) {
			return this.accounts();
		}
		return this.accounts().filter(
			(account: UserAccountModel) =>
				account.displayName.toLowerCase().includes(term) ||
				account.email.toLowerCase().includes(term),
		);
	});

	protected onSearchInput(event: Event): void {
		this.searchTerm.set((event.target as HTMLInputElement).value);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature documents the eventual API call's input ahead of the TODO it belongs to.
	protected toggleBlocked(account: UserAccountModel): void {
		// TODO: call the backend to block/unblock the account once the users API exists
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature documents the eventual API call's input ahead of the TODO it belongs to.
	protected deleteAccount(account: UserAccountModel): void {
		// TODO: call the backend to permanently delete the account once the users API exists
	}
}
