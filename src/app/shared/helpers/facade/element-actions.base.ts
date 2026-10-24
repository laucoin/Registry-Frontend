import { inject } from '@angular/core'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { Observable } from 'rxjs'

export interface ElementActionSpec {
    id: string
    icon: string
    shown: boolean
    allowed: boolean
    confirmation?: { severity: SeverityEnum, icon: string, accept: () => void, translationKey?: string, typed?: boolean }
    run?: () => void
}

/**
 * Purpose: Base of the services that tell which commands a list element offers.
 * Scope: Turns the action specs of an element into menu actions, keeps those shown and enabled by the configuration, disables the unauthorised ones, puts the confirmation in front of the commands that need one and gives the subclasses the project authority check and the command runner.
 * Limits: Abstract; the commands it runs report their own failures through the facade; each domain says which actions exist, who may run them and what they do, and may pass a context (such as the group a member is listed in). The backend still checks every command.
 */
export abstract class ElementActionsBase<T, C = void> {
    protected readonly confirmation: ElementConfirmationService = inject(ElementConfirmationService)

    protected readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected abstract readonly translationPrefix: string

    protected readonly primaryActionId: string | undefined = undefined

    protected abstract specsFor(element: T, context?: C): ElementActionSpec[]

    public actionsFor(element: T, context?: C): ElementActionModel[] {
        return this.specsFor(element, context)
            .filter((spec: ElementActionSpec): boolean => spec.shown)
            .map((spec: ElementActionSpec): ElementActionModel => this.toAction(element, spec))
    }

    public primaryFor(element: T, context?: C): ElementActionModel | undefined {
        return this.actionsFor(element, context).find((action: ElementActionModel): boolean => action.id === this.primaryActionId)
    }

    public menuFor(element: T, context?: C): ElementActionModel[] {
        return this.actionsFor(element, context).filter((action: ElementActionModel): boolean => action.id !== this.primaryActionId)
    }

    protected hasProjectAuthority(authority: ProjectAuthorityEnum): boolean {
        return CurrentUserHelper.hasProjectAuthority(this.sessionFacade.currentUser(), this.sessionFacade.selectedProject()?.id, authority)
    }

    protected run(command: Observable<unknown>): void {
        command.subscribe()
    }

    private toAction(element: T, spec: ElementActionSpec): ElementActionModel {
        const confirmation: ElementActionSpec['confirmation'] = spec.confirmation
        return {
            id: spec.id,
            label: `${this.translationPrefix}.actions.${spec.id}`,
            icon: spec.icon,
            disabled: !spec.allowed,
            danger: confirmation?.severity === SeverityEnum.DANGER,
            run: confirmation ? (): void => this.confirm(spec.id, element, confirmation) : spec.run!,
        }
    }

    private confirm(id: string, element: T, confirmation: NonNullable<ElementActionSpec['confirmation']>): void {
        this.confirmation.confirm(
            `${this.translationPrefix}.actions.confirmations.${confirmation.translationKey ?? id}`,
            element,
            confirmation.severity,
            confirmation.icon,
            confirmation.accept,
            confirmation.typed,
        )
    }
}
