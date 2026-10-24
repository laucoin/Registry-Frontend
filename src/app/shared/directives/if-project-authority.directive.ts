import { computed, Directive, effect, EmbeddedViewRef, inject, input, InputSignal, Signal, TemplateRef, ViewContainerRef } from '@angular/core'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'

/**
 * Purpose: Renders its host only when the signed-in user holds a project authority on the selected project.
 * Scope: Reads the current user and the selected project of the session; used to hide the hidden-elements filter from the roles that cannot re-enable them.
 * Limits: A usability aid only; the backend re-checks every request.
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

    constructor () {
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
