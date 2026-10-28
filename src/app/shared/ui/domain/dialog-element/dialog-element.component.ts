import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, Signal } from '@angular/core'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { StringHelper } from '@shared/helpers/string.helper'
import { HistoryUserModel } from '@shared/models/model/history-user.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import {TranslocoPipe} from '@jsverse/transloco'
import { CommunicationHelper } from '@shared/helpers/communication.helper'
import { GenericComponent } from '@shared/ui/base/generic.component'
import '@sgdf/ui/avatar'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { CommunicationActions } from '@shared/ui/domain/dialog-element/communication-actions.service'
import { ElementActionModel } from '@shared/models/model/element-action.model'
import { ElementActionsComponent } from '@shared/ui/common/element-actions/element-actions.component'
import { DateHelper } from '@shared/helpers/date.helper'

/**
 * Purpose: Bulle de discussion présentant une communication, alignée du côté de son auteur.
 * Scope: Affiche l'auteur, l'alerte liée, le message, sa date et le menu d'actions de la communication.
 * Limits: Ne possède aucun état de liste ; le parent donne les auteurs voisins pour que les messages consécutifs soient groupés.
 */
@Component( {
    selector: 'app-dialog-element',
    providers: [CommunicationActions],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [
        DateFormatPipe,
        ElementActionsComponent,
        TranslocoPipe,
    ],
    templateUrl: './dialog-element.component.html',
    styleUrl: './dialog-element.component.css',
} )
export class DialogElementComponent extends GenericComponent {
    private readonly actionsService: CommunicationActions = inject( CommunicationActions )

    public readonly alertVisible: InputSignal<boolean> = input( false )
    public readonly communication: InputSignal<CommunicationModel> = input.required()
    public readonly previousAuthorId: InputSignal<string | undefined> = input()
    public readonly nextAuthorId: InputSignal<string | undefined> = input()

    protected readonly actions: Signal<ElementActionModel[]> = computed( (): ElementActionModel[] => this.actionsService.actionsFor( this.communication() ) )

    protected readonly firstAuthorMessage: Signal<boolean> = computed( (): boolean =>
        CommunicationHelper.getAuthorId( this.communication() ) !== this.previousAuthorId(),
    )

    protected readonly authorIsCurrentUser: Signal<boolean> = computed(
        (): boolean => this.buildAuthorIsCurrentUser( this.communication(), this.sessionFacade.currentUser() ),
    )

    protected readonly alertTitleBlank: Signal<boolean> = computed( (): boolean => StringHelper.isNullOrBlank( this.communication().alert?.title ) )

    protected readonly authorName: Signal<string> = computed( (): string => this.buildAuthorName( this.communication() ) )

    protected readonly alertVariant: Signal<'warning' | 'neutral' | 'success'> = computed( (): 'warning' | 'neutral' | 'success' =>
        AlertHelper.getTagVariant( this.communication().alert?.status?.value ) )

    protected readonly updated: Signal<boolean> = computed( (): boolean =>
        DateHelper.isAfter( this.communication().lastEdition?.dateTime, this.communication().creation?.dateTime ),
    )

    private buildAuthorIsCurrentUser (
        communication: CommunicationModel,
        currentUser: CurrentUserModel | undefined,
    ): boolean {
        return StringHelper.isNullOrBlank( communication.movement?.reason?.label ) && communication?.lastEdition?.user?.id === currentUser?.id
    }

    private buildAuthorName (communication: CommunicationModel): string {
        switch (true) {
            case StringHelper.isNotNullNorBlank( communication.movement?.reason?.label ):
                return communication.movement!.reason!.label!
            case StringHelper.isNotNullNorBlank( communication.lastEdition?.user?.firstName ): {
                const lastEditor: HistoryUserModel = communication.lastEdition!.user!
                return `${lastEditor.firstName} ${lastEditor.lastName}`
            }
            default:
                return this.translateService.translate( 'communications.no-author' )
        }
    }
}
