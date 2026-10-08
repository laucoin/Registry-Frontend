import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, CanActivateFn, CanDeactivateFn, Router, UrlTree } from '@angular/router'
import { map, Observable, of, switchMap, take } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

const PROJECT_ID_PARAM: string = 'projectId'

interface GuardContext {
    registryFacade: RegistryFacade
    sessionFacade: SessionFacade
    uiFacade: UiFacade
    router: Router
}

/**
 * Purpose: Selects the project of the `:projectId` route parameter for the routes below it.
 * Scope: Checks the user has an authority on the project, loads its profile and warns before redirecting to the projects list.
 * Limits: A usability aid only; the backend re-checks access, and the deactivate guard only clears the selection.
 */
export const projectContextGuard: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> => {
    const context: GuardContext = {
        registryFacade: inject( RegistryFacade ),
        sessionFacade: inject( SessionFacade ),
        uiFacade: inject( UiFacade ),
        router: inject( Router ),
    }
    const projectId: string | undefined = route.paramMap.get( PROJECT_ID_PARAM ) ?? undefined

    return context.sessionFacade.currentUser$.pipe(
        take( 1 ),
        switchMap( (currentUser: CurrentUserModel): Observable<boolean | UrlTree> => resolveAccess( context, currentUser, projectId ) ),
    )
}

function resolveAccess (context: GuardContext, currentUser: CurrentUserModel, projectId: string | undefined): Observable<boolean | UrlTree> {
    if (GenericHelper.isNull( projectId ) || !hasProjectAccess( currentUser, projectId! )) {
        return of( redirectToProjects( context ) )
    }

    return context.registryFacade.setCurrentProject( projectId ).pipe(
        take( 1 ),
        map( (): boolean | UrlTree => GenericHelper.isNull( context.sessionFacade.selectedProject() ) ? redirectToProjects( context ) : true ),
    )
}

function redirectToProjects (context: GuardContext): UrlTree {
    notifyNoProfile( context.uiFacade )
    return context.router.parseUrl( RegistryRouteEnum.PROJECTS )
}

export const projectContextDeactivateGuard: CanDeactivateFn<unknown> = (): boolean => {
    inject( RegistryFacade ).setCurrentProject( undefined ).pipe( take( 1 ) ).subscribe()
    return true
}

function hasProjectAccess(currentUser: CurrentUserModel, projectId: string): boolean {
    return currentUser.authorities.some( (authority: string): boolean => authority.startsWith( `${projectId}_` ) )
}

function notifyNoProfile(uiFacade: UiFacade): void {
    uiFacade.notify( {
        severity: SeverityEnum.WARNING,
        summary: 'preferences.notifications.NO_SELECTED_PROFILE.title',
        detail: 'preferences.notifications.NO_SELECTED_PROFILE.message',
        closable: true,
        icon: 'pi pi-sort-alt-slash',
        life: RegistryConfig.config.notification.duration.warn,
    } )
}
