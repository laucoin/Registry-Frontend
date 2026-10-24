import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { FieldTree, FormField } from '@angular/forms/signals'
import {ActivityDto} from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import {
    ActivityFormModel,
    createActivityForm,
    toActivityDto,
    toActivityFormModel,
} from '@pages/projects/[projectId]/configuration/activities/activity-form/activity.form'
import {CustomDatetimeModel} from '@shared/models/model/custom-datetime.model'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/duration-picker'
import '@sgdf/ui/input'
import '@sgdf/ui/textarea'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component'
import {ActivityModel} from '@shared/models/model/activity.model'
import {ProjectModel} from '@shared/models/model/project.model'
import {BaseFormComponent} from '@shared/ui/base/base-form.component'
import {withLoading} from '@shared/helpers/rx.helper'
import {
    NumberRangeFieldComponent,
} from '@shared/ui/common/number-range-field/number-range-field.component'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {GenericHelper} from '@shared/helpers/generic.helper'
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Page en dialogue avec le formulaire de création ou d'édition d'une activité, ouverte au-dessus de la liste des activités.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
    selector: 'app-activity-form',
    imports: [
        FormDialogComponent,
        FieldErrorComponent,
        TranslocoPipe,
        FormField,
        SgdfFieldDirective,
        FieldErrorDirective,
        NumberRangeFieldComponent,
        FormTitlePipe,
        FormButtonPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './activity-form.page.html',
})
export class ActivityFormPage extends BaseFormComponent {
    protected override readonly closesToParentRoute: boolean = true
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    protected readonly activity: WritableSignal<ActivityModel | undefined> = signal(undefined)
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined)
    protected readonly model: WritableSignal<ActivityFormModel> = signal(toActivityFormModel())
    protected readonly form: FieldTree<ActivityFormModel> = createActivityForm(this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform(date),
    })

    public constructor() {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData(): void {
        if (GenericHelper.nonNull(this.idParam)) {
            this.facade.fetchActivity(this.idParam!).pipe(
                    withLoading(this.loading),
                ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe( (activity: ActivityModel): void => {
                    this.activity.set(activity)
                    this.applyActivity(activity)
                } )
        }
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyActivity(undefined)
        }
    }

    private applyActivity(activity: ActivityModel | undefined): void {
        this.contextProject.set( this.sessionFacade.selectedProject() )
        if (activity) this.model.set(toActivityFormModel(activity))
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull(this.idParam)
        if (editing && !this.activity()) return

        if (!this.isFormValid(this.form)) {
            return
        }

        const dto: ActivityDto = toActivityDto(this.model())
        this.save(editing ? this.facade.updateActivity(this.activity()!.id, dto, ETagHelper.ifMatch(this.activity())) : this.facade.createActivity(dto))
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['activityId']
    }
}
