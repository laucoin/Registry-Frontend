import {UiFacade} from '@core/registry/state/ui.facade'
import {SessionFacade} from '@core/registry/state/session.facade'
import {inject} from '@angular/core'
import {TranslocoService} from '@jsverse/transloco'
import {ActivatedRoute, Router} from '@angular/router'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {RegistryRouteEnum} from '@core/routing/registry-route.enum'

/**
 * Purpose: Classe de base des composants qui ont besoin des facades et helpers partagés.
 * Scope: Fournit les facades UI et de session, le routage et la traduction.
 * Limits: Abstrait ; ne contient aucune logique de vue.
 */
export abstract class GenericComponent {
    protected readonly RegistryRouteEnum: typeof RegistryRouteEnum = RegistryRouteEnum

    protected readonly GenericHelper: typeof GenericHelper = GenericHelper

    protected readonly uiFacade: UiFacade = inject(UiFacade)
    protected readonly sessionFacade: SessionFacade = inject(SessionFacade)
    protected readonly route: ActivatedRoute = inject(ActivatedRoute)
    protected readonly router: Router = inject(Router)
    protected readonly translateService: TranslocoService = inject(TranslocoService)
}
