import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, CanActivateFn, CanDeactivateFn, Router, UrlTree } from '@angular/router'
import { map, Observable, of, switchMap, take } from 'rxjs'
import { RegistryConfig } from '@core/config/registry.config'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { GenericUtil } from '@shared/helpers/util/generic.util'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'

const PROJECT_ID_PARAM: string = 'projectId'

/**
 * Charge le projet courant depuis le paramètre `:projectId` de l'URL.
 * Redirige vers la liste des projets si l'utilisateur n'a aucun profil sur ce projet.
 */
export const projectContextGuard: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> => {
    const registryFacade: RegistryFacade = inject( RegistryFacade )
    const router: Router = inject( Router )
    const projectId: string | undefined = route.paramMap.get( PROJECT_ID_PARAM ) ?? undefined

    return registryFacade.currentUser$.pipe(
        take( 1 ),
        switchMap( (currentUser: CurrentUserModel): Observable<boolean | UrlTree> => {
            if (GenericUtil.isNull( projectId ) || !hasProjectAccess( currentUser, projectId! )) {
                notifyNoProfile( registryFacade )
                return of( router.parseUrl( RegistryRouteEnum.PROJECTS ) )
            }

            return registryFacade.setCurrentProject( projectId ).pipe(
                take( 1 ),
                map( (): boolean | UrlTree => {
                    if (GenericUtil.isNull( registryFacade.selectedProject() )) {
                        notifyNoProfile( registryFacade )
                        return router.parseUrl( RegistryRouteEnum.PROJECTS )
                    }
                    return true
                } ),
            )
        } ),
    )
}

export const projectContextDeactivateGuard: CanDeactivateFn<unknown> = (): boolean => {
    inject( RegistryFacade ).setCurrentProject( undefined ).pipe( take( 1 ) ).subscribe()
    return true
}

function hasProjectAccess(currentUser: CurrentUserModel, projectId: string): boolean {
    return currentUser.authorities.some( (authority: string): boolean => authority.startsWith( `${projectId}_` ) )
}

function notifyNoProfile(registryFacade: RegistryFacade): void {
    registryFacade.notify( {
        severity: SeverityEnum.WARNING,
        summary: 'preferences.notifications.NO_SELECTED_PROFILE.title',
        detail: 'preferences.notifications.NO_SELECTED_PROFILE.message',
        closable: true,
        icon: 'pi pi-sort-alt-slash',
        life: RegistryConfig.config.notification.duration.warn,
    } )
}
