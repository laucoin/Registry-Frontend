import { computed, Directive, inject, Signal } from '@angular/core'
import { SessionFacade } from '@core/registry/state/session.facade'

/**
 * Purpose: Sets the eyebrow of a page title to the name of the selected project.
 * Scope: Binds the eyebrow attribute of its host to the selected project of the session.
 * Limits: Does not load the project; the eyebrow is left empty until a project is selected.
 */
@Directive( {
    selector: '[appProjectEyebrow]',
    host: { '[attr.eyebrow]': 'eyebrow()' },
} )
export class ProjectEyebrowDirective {
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )

    protected readonly eyebrow: Signal<string | undefined> = computed( (): string | undefined => this.sessionFacade.selectedProject()?.name )
}
