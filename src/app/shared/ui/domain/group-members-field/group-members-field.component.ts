import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { TranslocoPipe } from '@jsverse/transloco'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'

/**
 * Purpose: Champ de sélection des participants à ajouter à un groupe, avec son titre et ses libellés.
 * Scope: Affiche la sélection d'un champ de formulaire, les suggestions fournies et émet la recherche saisie.
 * Limits: Ne possède aucune source de données ni modèle de formulaire ; la page fournit le champ, les suggestions et la recherche.
 */
@Component( {
    selector: 'app-group-members-field',
    imports: [
        FormField,
        FieldErrorDirective,
        PluralTranslationPipe,
        SelectElementsFieldComponent,
        TranslocoPipe,
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    templateUrl: './group-members-field.component.html',
} )
export class GroupMembersFieldComponent {
    public readonly field: InputSignal<FieldTree<ParticipantModel[]>> = input.required()
    public readonly suggestions: InputSignal<SelectOptionModel<ParticipantModel>[]> = input.required()
    public readonly searched: OutputEmitterRef<string | undefined> = output<string | undefined>()

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

    protected handleSearch (query: string | undefined): void {
        this.field()().markAsTouched()
        this.searched.emit( query )
    }
}
