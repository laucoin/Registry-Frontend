import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core'
import { GroupModel } from '@shared/models/model/group.model'
import { FieldTree, FormField } from '@angular/forms/signals'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupDto } from '@pages/projects/[projectId]/configuration/groups/data/dto/group.dto'
import {
    createGroupForm,
    GroupFormModel,
    toGroupDto,
    toGroupFormModel,
} from '@pages/projects/[projectId]/configuration/groups/group-form/group.form'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { FormComponent } from '@shared/ui/common/form/form.component'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/card'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/input'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ProjectModel } from '@shared/models/model/project.model'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { withLoading } from '@shared/helpers/rx.helper'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Page with the form to create or edit a group.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-group-form',
    imports: [
        FormComponent,
        FormActionsComponent,
        FieldErrorDirective,
        SgdfFieldDirective,
        TranslocoPipe,
        FormField,
        SelectElementsFieldComponent,
        FormTitlePipe,
        FormButtonPipe,
        PluralTranslationPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './group-form.page.html',
} )
export class GroupFormPage extends BaseFormComponent {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected readonly ParticipantHelper: typeof ParticipantHelper = ParticipantHelper

    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal( undefined )
    protected readonly model: WritableSignal<GroupFormModel> = signal( toGroupFormModel() )
    protected readonly form: FieldTree<GroupFormModel> = createGroupForm( this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform( date ),
    } )

    public constructor () {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        if (GenericHelper.nonNull( this.idParam )) {
            this.facade.fetchGroup( this.idParam! ).pipe(
                    withLoading( this.loading ),
                ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (group: GroupModel): void => {
                    this.group.set( group )
                    this.applyGroup( group )
                } )
        }
    }

    protected handleLoadedElement (): void {
        if (!GenericHelper.nonNull( this.idParam )) {
            this.applyGroup( undefined )
        }
    }

    private applyGroup (group: GroupModel | undefined): void {
        this.contextProject.set( this.sessionFacade.selectedProject() )
        if (group) this.model.set( toGroupFormModel( group ) )
    }

    protected submit (): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull( this.idParam )
        if (editing && !this.group()) return

        if (!this.isFormValid( this.form )) {
            this.logInvalidForm( this.model() )
            return
        }

        const dto: GroupDto = toGroupDto( this.model() )
        this.save( editing ? this.facade.updateGroup( this.group()!.id, dto, ETagHelper.ifMatch( this.group() ) ) : this.facade.createGroup( dto ) )
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants( searched )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['groupId']
    }
}
