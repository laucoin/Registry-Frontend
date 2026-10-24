import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, signal, Signal, TemplateRef, viewChild, WritableSignal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/avatar'
import '@sgdf/ui/button'
import '@sgdf/ui/dialog'
import '@sgdf/ui/icon'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/tag'
import { ParticipantActions } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-actions.service'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { EllipsisDirective } from '@shared/directives/ellipsis.directive'

const INITIALS_LENGTH: number = 2

type TagVariant = 'success' | 'warning' | 'neutral'

/**
 * Purpose: Template de ligne d'un participant dans une liste, avec le dialogue listant les groupes d'un participant.
 * Scope: Contient le `sgdf-list-item` d'un participant (nom, groupes, dates de disponibilité, statut de présence et menu d'actions) et l'expose comme un template que les pages de liste affichent dans leur propre liste.
 * Limits: N'affiche aucune ligne par lui-même ; la page décide où le template est utilisé. Les commandes sont déléguées à ParticipantActions.
 */
@Component({
    selector: 'app-participant-row',
    imports: [EllipsisDirective, TranslocoPipe, CustomDateFormatPipe, PluralTranslationPipe, ElementActionsComponent],
    providers: [ParticipantActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    host: { class: 'contents' },
    templateUrl: './participant-row.component.html',
})
export class ParticipantRowComponent {
    protected readonly actions: ParticipantActions = inject(ParticipantActions)

    public readonly groupId: InputSignal<string | undefined> = input()
    public readonly template: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('row')

    protected readonly groupsOf: WritableSignal<ParticipantModel | undefined> = signal(undefined)

    protected fullName(participant: ParticipantModel): string {
        return [participant.firstName, participant.lastName?.toUpperCase()].filter(Boolean).join(' ')
    }

    protected initials(participant: ParticipantModel): string {
        const letters: string = [participant.firstName, participant.lastName].map((name: string | undefined): string => name?.charAt(0) ?? '').join('')
        return letters.slice(0, INITIALS_LENGTH).toUpperCase()
    }

    protected otherGroups(participant: ParticipantModel): number {
        return (participant.groups?.length ?? 0) - 1
    }

    protected statusVariant(participant: ParticipantModel): TagVariant {
        switch (participant.status.value) {
            case PresenceStatusEnum.IN:
                return 'success'
            case PresenceStatusEnum.OUT:
                return 'warning'
            default:
                return 'neutral'
        }
    }

    protected closeDialog(event: Event): void {
        if (event.target === event.currentTarget) {
            this.groupsOf.set(undefined)
        }
    }
}
