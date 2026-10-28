import { computed, Directive, effect, EmbeddedViewRef, inject, input, InputSignal, Signal, TemplateRef, ViewContainerRef } from '@angular/core'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'

/**
 * Purpose: N'affiche son hôte que si l'utilisateur connecté détient une autorité de projet sur le projet sélectionné.
 * Scope: Lit l'utilisateur courant et le projet sélectionné de la session ; sert à masquer le filtre des éléments masqués aux rôles qui ne peuvent pas les réactiver.
 * Limits: Simple aide à l'usage ; le backend revérifie chaque requête.
 */
@Directive( {
    selector: '[appIfProjectAuthority]',
} )
export class IfProjectAuthorityDirective {
    public readonly appIfProjectAuthority: InputSignal<ProjectAuthorityEnum> = input.required<ProjectAuthorityEnum>()

    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    private readonly template: TemplateRef<unknown> = inject( TemplateRef )
    private readonly container: ViewContainerRef = inject( ViewContainerRef )
    private view: EmbeddedViewRef<unknown> | undefined

    private readonly allowed: Signal<boolean> = computed( (): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.sessionFacade.selectedProject()?.id,
        this.appIfProjectAuthority(),
    ) )

    public constructor () {
        effect( (): void => {
            if (this.allowed() && !this.view) {
                this.view = this.container.createEmbeddedView( this.template )
            } else if (!this.allowed() && this.view) {
                this.container.clear()
                this.view = undefined
            }
        } )
    }
}
