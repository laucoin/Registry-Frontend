import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
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
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormComponent } from '@shared/ui/common/form/form.component'
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component'
import { RegistryRequiredDirective } from '@shared/directives/registry-required.directive'
import {TranslocoPipe} from '@jsverse/transloco'
import { InputText } from 'primeng/inputtext'
import { Divider } from 'primeng/divider'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { ProjectModel } from '@shared/models/model/project.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { withLoading } from '@shared/helpers/rx.helper'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { DateTimeFieldComponent } from '@shared/ui/common/date-time-field/date-time-field.component'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { FormIconPipe } from '@shared/helpers/pipe/form-icon.pipe'

/**
 * Purpose: Page with the form to create or edit a group.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component( {
    selector: 'app-group-form',
    imports: [
        Button,
        Card,
        FormComponent,
        FieldErrorComponent,
        RegistryRequiredDirective,
        TranslocoPipe,
        InputText,
        FormField,
        Divider,
        SelectElementsFieldComponent,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        PluralTranslationPipe,
        DateTimeFieldComponent,
        FormIconPipe,

    ],
    templateUrl: './group-form.page.html',
} )
export class GroupFormPage extends BaseFormComponent implements OnDestroy {
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
            this.subscriptions.add(
                this.facade.fetchGroup( this.idParam! ).pipe(
                    withLoading( this.loading ),
                ).subscribe( (group: GroupModel): void => {
                    this.group.set( group )
                    this.applyGroup( group )
                } ),
            )
        }
    }

    protected handleLoadedElement (): void {
        if (!GenericHelper.nonNull( this.idParam )) {
            this.applyGroup( undefined )
        }
    }

    private applyGroup (group: GroupModel | undefined): void {
        this.contextProject.set( group?.project || this.sessionFacade.selectedProject() )
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
        this.save( editing ? this.facade.updateGroup( this.group()!.id, dto ) : this.facade.createGroup( dto ) )
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants( searched )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['groupId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
