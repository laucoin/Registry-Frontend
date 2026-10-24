import { NgTemplateOutlet } from '@angular/common'
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive'
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, Signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import { RouterLink } from '@angular/router'
import { CurrentUserHelper } from '@core/authentication/tool/current-user.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/option'
import '@sgdf/ui/page-title'
import '@sgdf/ui/select'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component'
import {
    ParticipantsListSearchModel,
    toParticipantsListSearchModel,
    toParticipantsListSearchParams,
} from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search'
import { RegistryTemplateDirective } from '@shared/directives/registry-template.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { createSearchForm } from '@shared/helpers/form/search.form'
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe'
import { StringHelper } from '@shared/helpers/string.helper'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { ListComponent } from '@shared/ui/common/list/list.component'

/**
 * Purpose: Page listant les participants du projet sélectionné avec recherche et déclencheur « charger plus ».
 * Scope: Lie le composant de liste à la facade des participants, possède le formulaire de recherche et donne à la liste le template de ligne d'un participant.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-participants-list',
    imports: [
        IfProjectAuthorityDirective,
        ListComponent,
        ParticipantRowComponent,
        RegistryTemplateDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        RouterLink,
        BooleanChoicePipe,
        NgTemplateOutlet,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './participants-list.page.html',
})
export class ParticipantsListPage {
    protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_D

    protected readonly facade: ParticipantFacade = inject(ParticipantFacade)
    private readonly sessionFacade: SessionFacade = inject(SessionFacade)

    protected readonly createRoute: ParticipantRoutesEnum = ParticipantRoutesEnum.CREATE

    protected readonly canCreate: Signal<boolean> = computed((): boolean => CurrentUserHelper.hasProjectAuthority(
        this.sessionFacade.currentUser(),
        this.facade.selectedProjectId(),
        ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_C,
    ))

    protected readonly activeFilters: Signal<number> = computed((): number => [
        StringHelper.isNotNullNorBlank(this.facade.participantsPageQueryParam()),
        this.facade.participantsPageStatusParam() !== undefined,
        this.facade.participantsPageIsVisibleParam() !== undefined,
    ].filter(Boolean).length)

    protected readonly model: WritableSignal<ParticipantsListSearchModel> = signal(toParticipantsListSearchModel({
        q: this.facade.participantsPageQueryParam(),
        status: this.facade.participantsPageStatusParam(),
        isVisible: this.facade.participantsPageIsVisibleParam(),
    }))
    protected readonly form: FieldTree<ParticipantsListSearchModel> = createSearchForm(this.model)

    public constructor() {
        this.facade.fetchParticipantsPage(undefined, undefined)
    }

    protected search(): void {
        const search: ReturnType<typeof toParticipantsListSearchParams> = toParticipantsListSearchParams(this.model())
        this.facade.inputPageSearchParameters(search.q, search.status, search.isVisible)
        this.facade.fetchParticipantsPage(0, undefined)
    }

    protected resetFilters(): void {
        this.model.set({ q: '', status: '', isVisible: '' })
        this.search()
    }

    protected loadBatch(pageEvent: PageEventModel): void {
        this.facade.fetchParticipantsPage(pageEvent.page, pageEvent.size)
    }
}
