import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, CanActivateFn, CanDeactivateFn, Router, UrlTree } from '@angular/router'
import { map, Observable, of, switchMap, take } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

const PROJECT_ID_PARAM: string = 'projectId'

interface GuardContext {
    sessionFacade: SessionFacade
    uiFacade: UiFacade
    router: Router
}

/**
 * Purpose: Sélectionne le projet du paramètre de route `:projectId` pour les routes qui en dépendent.
 * Scope: Vérifie que l'utilisateur a une autorité sur le projet et le charge, et répond « projet introuvable » avant de rediriger vers la liste des projets quand il n'existe pas, que l'utilisateur n'a aucun droit dessus ou qu'il ne peut pas être chargé : le message ne dit jamais lequel.
 * Limits: Simple aide à l'usage ; le backend revérifie l'accès, et le guard de désactivation ne fait que vider la sélection.
 */
export const projectContextGuard: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> => {
    const context: GuardContext = {
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

    return context.sessionFacade.setCurrentProject( projectId ).pipe(
        take( 1 ),
        map( (): boolean | UrlTree => GenericHelper.isNull( context.sessionFacade.selectedProject() ) ? redirectToProjects( context ) : true ),
    )
}

function redirectToProjects (context: GuardContext): UrlTree {
    if (!context.uiFacade.globalError()) notifyProjectNotFound( context.uiFacade )
    return context.router.parseUrl( RegistryRouteEnum.PROJECTS )
}

export const projectContextDeactivateGuard: CanDeactivateFn<unknown> = (): boolean => {
    inject( SessionFacade ).setCurrentProject( undefined ).pipe( take( 1 ) ).subscribe()
    return true
}

function hasProjectAccess(currentUser: CurrentUserModel, projectId: string): boolean {
    return currentUser.authorities.some( (authority: string): boolean => authority.startsWith( `${projectId}_` ) )
}

function notifyProjectNotFound(uiFacade: UiFacade): void {
    uiFacade.notify( {
        severity: SeverityEnum.ERROR,
        summary: 'projects.notifications.NOT_FOUND.title',
        detail: 'projects.notifications.NOT_FOUND.message',
        closable: true,
        life: RegistryConfig.config.notification.duration.error,
    } )
}
