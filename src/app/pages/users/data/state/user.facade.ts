import { computed, inject, Injectable, Signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { finalize, Observable, tap } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { UserModel } from '@shared/models/model/user.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { UserApi } from '@pages/users/data/state/user.api'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { initialize, notifyOnError } from '@shared/helpers/rx.helper'
import { UserStore } from '@pages/users/data/state/user.store'

@Injectable()
export class UserFacade extends GenericFacade {
    private readonly store: InstanceType<typeof UserStore> = inject( UserStore )
    private readonly api: UserApi = inject( UserApi )
    private readonly registryFacade: RegistryFacade = inject( RegistryFacade )

    public readonly usersPage: Signal<PageModel<UserModel> | undefined> = this.store.users.element

    public readonly usersPageLoading: Signal<boolean> = this.store.users.loading

    public readonly usersPageSilentLoading: Signal<boolean> = this.store.users.silentLoading

    public readonly usersPageError: Signal<ToastMessageOptions | undefined> = this.store.users.error

    public readonly usersPageResetSearch: Signal<boolean> = this.store.users.params.resetSearch

    public readonly usersPageTextSearchedParam: Signal<string | undefined> = this.store.users.params.textSearched

    public readonly actualUsersPageVisibilitySearchedParam: Signal<boolean | undefined> = this.store.users.params.visibilitySearched

    public readonly user: Signal<UserModel | undefined> = this.store.user.element

    public readonly user$: Observable<UserModel | undefined> = toObservable( this.user )

    public readonly userLoading: Signal<boolean> = this.store.user.loading

    public readonly assignableRolesMetadata: Signal<SelectItem<string>[]> = this.store.metadata.assignableRoles

    public readonly statusMetadata: Signal<SelectItem<boolean | undefined>[]> = computed( () =>
            this.store.metadata.status().map( (status: SelectItem<boolean | undefined>) => ({
                ...status,
                label: this.translateService.instant( status.label! ),
            }) ),
        )

    public fetchUsersPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
    ): void {
        const index: number | undefined = this.usersPageResetSearch() ? 0 : pageNumber
        this.store.fetchUsersPage( { pageNumber: index, pageSize: pageSize } )
    }

    public inputPageSearchParameters (
        textSearched: string | undefined,
        visibilitySearched: boolean | undefined,
    ): void {
        const resetSearch: boolean = this.usersPageTextSearchedParam() != textSearched
                                     || this.actualUsersPageVisibilitySearchedParam() != visibilitySearched

        if (resetSearch) {
            this.store.updateUsersPageSearchParams( {
                resetSearch: resetSearch,
                textSearched: textSearched,
                visibilitySearched: visibilitySearched,
            } )
        }
    }

    public fetchUser (id: string): void {
        this.store.fetchUser( id )
    }

    public resetUser (): void {
        this.store.resetUser()
    }

    public fetchAssignableRoles (): void {
        this.store.fetchAssignableRoles()
    }

    public updateUserRole (id: string, role: string | undefined): Observable<UserModel> {
        return this.api.updateUserRole( id, role ).pipe(
            this.trackUserLoader,
            notifyOnError( this.registryFacade ),
            tap( (user: UserModel): void => this.onCommandSuccess( 'update-role', user ) ),
        )
    }

    public bockUser (id: string): void {
        this.api.blockUserById( id ).pipe(
            this.trackUserLoader,
            notifyOnError( this.registryFacade ),
            tap( (user: UserModel): void => this.onCommandSuccess( 'disable', user ) ),
        ).subscribe()
    }

    public unblockUser (id: string): void {
        this.api.unblockUserById( id ).pipe(
            this.trackUserLoader,
            notifyOnError( this.registryFacade ),
            tap( (user: UserModel): void => this.onCommandSuccess( 'enable', user ) ),
        ).subscribe()
    }

    public impersonateUser (user: UserModel): void {
        this.api.impersonateUserById( user.id ).pipe(
            this.trackUserLoader,
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'impersonate', user ) ),
        ).subscribe()
    }

    public deleteUser (user: UserModel): void {
        this.api.deleteUserById( user.id ).pipe(
            this.trackUserLoader,
            notifyOnError( this.registryFacade ),
            tap( (): void => this.onCommandSuccess( 'delete', user ) ),
        ).subscribe()
    }

    private readonly trackUserLoader = <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => this.store.startUserLoader() ),
        finalize( (): void => this.store.stopUserLoader() ),
    )

    private onCommandSuccess (command: string, user: UserModel): void {
        this.registryFacade.notify( StateHelper.buildNotificationMessage(
            SeverityEnum.SUCCESS,
            `users.notifications.${ command }.title`,
            `users.notifications.${ command }.message`,
            'pi pi-users',
            { firstName: user.firstName, lastName: user.lastName },
        ) )

        const page: PageModel<UserModel> | undefined = this.usersPage()
        this.fetchUsersPage( page?.pageNumber, page?.pageSize )
    }
}
