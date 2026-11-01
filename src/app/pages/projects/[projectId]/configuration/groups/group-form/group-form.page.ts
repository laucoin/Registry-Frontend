import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, model, ModelSignal, signal, WritableSignal } from '@angular/core'
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
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/card'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/step'
import '@sgdf/ui/stepper'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import {
    AddMembersFormModel,
    createAddMembersForm,
    emptyAddMembersFormModel,
    toMemberIds,
} from '@pages/projects/[projectId]/configuration/groups/group-member-list/add-members.form'
import { tap } from 'rxjs'
import { GroupMembersFieldComponent } from '@shared/ui/domain/group-members-field/group-members-field.component'
import { ProjectModel } from '@shared/models/model/project.model'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { withLoading } from '@shared/helpers/rx.helper'
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe'
import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Page avec le formulaire de création ou d'édition d'un groupe ; une création se poursuit par une étape facultative d'ajout de membres au nouveau groupe.
 * Scope: Construit les formulaires, les soumet via la facade et navigue en arrière. Une fois créé, le groupe ne peut plus être édité depuis cette page : l'étape des membres ne fait qu'être ignorée ou soumise.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
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
        FormTitlePipe,
        FormButtonPipe,
        GroupMembersFieldComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './group-form.page.html',
} )
export class GroupFormPage extends BaseFormComponent {
    protected readonly facade: GroupFacade = inject( GroupFacade )

    protected readonly group: WritableSignal<GroupModel | undefined> = signal( undefined )
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal( undefined )
    protected readonly model: WritableSignal<GroupFormModel> = signal( toGroupFormModel() )
    protected readonly form: FieldTree<GroupFormModel> = createGroupForm( this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform( date ),
    } )

    protected readonly addMembersModel: WritableSignal<AddMembersFormModel> = signal( emptyAddMembersFormModel() )
    protected readonly addMembersForm: FieldTree<AddMembersFormModel> = createAddMembersForm( this.addMembersModel )
    protected readonly createdGroupId: WritableSignal<string | undefined> = signal( undefined )
    protected readonly activeTab: ModelSignal<number> = model<number>( 1 )

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
            return
        }

        const dto: GroupDto = toGroupDto( this.model() )
        if (editing) this.save( this.facade.updateGroup( this.group()!.id, dto, ETagHelper.ifMatch( this.group() ) ) )
        else this.save( this.facade.createGroup( dto ).pipe( tap( (it: GroupModel): void => this.startMembersStep( it ) ) ), false )
    }

    private startMembersStep (created: GroupModel): void {
        this.createdGroupId.set( created.id )
        this.activeTab.set( 2 )
    }

    protected addMembers (): void {
        const groupId: string | undefined = this.createdGroupId()
        if (this.saving() || GenericHelper.isNull( groupId ) || !this.isFormValid( this.addMembersForm )) return

        this.save( this.facade.addMembersToGroup( groupId!, toMemberIds( this.addMembersModel() ) ).pipe( tap( (): void => this.navigateToRedirectUri() ) ), false )
    }

    protected skip (): void {
        this.navigateToRedirectUri()
    }

    protected handleSearch (searched: string | undefined): void {
        this.facade.searchParticipants( searched )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['groupId']
    }
}
