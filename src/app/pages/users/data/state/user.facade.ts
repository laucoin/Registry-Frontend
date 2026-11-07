import { computed, inject, Injectable, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { finalize, Observable, tap } from 'rxjs';

import { BrowserService } from '@core/browser/browser.service';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserApi } from '@core/registry/state/user.api';
import { UserStore } from '@pages/users/data/state/user.store';
import { GenericFacade } from '@shared/helpers/facade/generic.facade';
import { initialize, notifyOnError } from '@shared/helpers/rx.helper';
import { SearchParamsHelper } from '@shared/helpers/search/search-params.helper';
import { StateHelper } from '@shared/helpers/state/state.helper';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { SectionErrorsHelper } from '@shared/helpers/store/section-errors.helper';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

/**
 * Purpose: Point d'entrée public du domaine des utilisateurs pour les pages, composants et guards.
 * Scope: Expose le store des utilisateurs sous forme de signals, relaie ses requêtes et exécute les commandes d'utilisateur avec leurs notifications.
 * Limits: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class UserFacade extends GenericFacade {
	private readonly store: InstanceType<typeof UserStore> = inject(UserStore);
	private readonly api = inject(UserApi);
	private readonly uiFacade = inject(UiFacade);
	private readonly browser = inject(BrowserService);

	public readonly metadataErrors: Signal<Record<string, NotificationModel | undefined>> =
		SectionErrorsHelper.metadata(this.store.sectionErrors);

	public readonly userError: Signal<NotificationModel | undefined> = this.store.user.error;

	public readonly usersPage: Signal<PageModel<UserModel> | undefined> = this.store.users.element;

	public readonly usersPageLoading = this.store.users.loading;

	public readonly usersPageSilentLoading = this.store.users.silentLoading;

	public readonly usersPageError: Signal<NotificationModel | undefined> = this.store.users.error;

	public readonly usersPageResetSearch = this.store.users.params.resetSearch;

	public readonly usersPageQueryParam = this.store.users.params.q;

	public readonly usersPageSortParam = this.store.users.params.sort;

	public readonly actualUsersPageIsVisibleParam = this.store.users.params.isVisible;

	public readonly user: Signal<UserModel | undefined> = this.store.user.element;

	public readonly user$ = toObservable(this.user);

	public readonly userLoading = this.store.user.loading;

	public readonly assignableRolesMetadata = this.store.metadata.assignableRoles;

	public readonly statusMetadata: Signal<SelectOptionModel<boolean | undefined>[]> = computed(() =>
		this.store.metadata.status().map((status) => ({
			...status,
			label: this.translateLabel(status.label),
		})),
	);

	public fetchUsersPage(page: number | undefined, size: number | undefined): void {
		const index = this.usersPageResetSearch() ? 0 : page;
		this.store.fetchUsersPage({ page: index, size: size });
	}

	public inputPageSearchParameters(
		q: string | undefined,
		isVisible: boolean | undefined,
		sort: string | undefined = undefined,
	): void {
		const next = {
			q,
			isVisible,
			sort,
		};
		if (!SearchParamsHelper.hasChanged(this.store.users.params(), next)) return;
		this.store.updateUsersPageSearchParams({ ...next, resetSearch: true });
	}

	public fetchUser(id: string): void {
		this.store.fetchUser(id);
	}

	public resetUser(): void {
		this.store.resetUser();
	}

	public fetchAssignableRoles(): void {
		this.store.fetchAssignableRoles();
	}

	public updateUserRole(id: string, role: string | undefined): Observable<UserModel> {
		return this.api.updateUserRole(id, role).pipe(
			this.trackUserLoader,
			notifyOnError(this.uiFacade),
			tap((user) => this.onCommandSuccess('update-role', user)),
		);
	}

	public blockUser(id: string): void {
		this.api
			.blockUserById(id)
			.pipe(
				this.trackUserLoader,
				notifyOnError(this.uiFacade),
				tap((user) => this.onCommandSuccess('block', user)),
			)
			.subscribe();
	}

	public unblockUser(id: string): void {
		this.api
			.unblockUserById(id)
			.pipe(
				this.trackUserLoader,
				notifyOnError(this.uiFacade),
				tap((user) => this.onCommandSuccess('unblock', user)),
			)
			.subscribe();
	}

	public exportUser(user: UserModel): Observable<unknown> {
		return this.api.exportUserById(user.id).pipe(
			notifyOnError(this.uiFacade),
			tap((data) => this.browser.downloadJson(data, `registry-user-${user.id}.json`)),
		);
	}

	public deleteUser(user: UserModel): void {
		this.api
			.deleteUserById(user.id)
			.pipe(
				this.trackUserLoader,
				notifyOnError(this.uiFacade),
				tap(() => this.onCommandSuccess('delete', user)),
			)
			.subscribe();
	}

	private readonly trackUserLoader = <T>(source: Observable<T>): Observable<T> =>
		source.pipe(
			initialize(() => this.store.startUserLoader()),
			finalize(() => this.store.stopUserLoader()),
		);

	private onCommandSuccess(command: string, user: UserModel): void {
		this.uiFacade.notify(
			StateHelper.buildNotificationMessage(
				SeverityEnum.SUCCESS,
				`users.notifications.${command}.title`,
				`users.notifications.${command}.message`,
				{ firstName: user.firstName, lastName: user.lastName },
			),
		);

		this.store.fetchUsersPage(CumulativePageHelper.reloadRequest(this.usersPage()));
	}
}
