import { FormControl, FormGroup } from '@angular/forms'
import { BaseFormComponent } from '@shared/ui/base/base-form.component'
import { RegistryValidators } from '@shared/helpers/registry.validator'
import { ProjectModel } from '@shared/models/model/project.model'

/**
 * Purpose: Base class of the create and edit forms still built on reactive forms.
 * Scope: Adds the reactive form contract and the project date validators to the common form base.
 * Limits: Abstract; removed once every form uses signal forms.
 */
export abstract class GenericFormComponent<M, D> extends BaseFormComponent {
    protected abstract initForm (): FormGroup

    protected abstract fillForm (element: M | undefined): void

    protected abstract buildDto (): D

    protected addProjectDateValidators (
        project: ProjectModel | undefined,
        control: FormControl,
    ): void {
        if (project?.begin) {
            control.addValidators( RegistryValidators.minDateTime(
                project?.begin,
                this.datePipe.transform( project?.begin ),
            ) )
        }
        if (project?.end) {
            control.addValidators( RegistryValidators.maxDateTime(
                project?.end,
                this.datePipe.transform( project?.end ),
            ) )
        }
    }
}
