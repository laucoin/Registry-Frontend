import { FormGroup } from '@angular/forms'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { GenericComponent } from '@shared/ui/base/generic.component'

export abstract class GenericListComponent extends GenericComponent {
    protected form: FormGroup = this.formBuilder.group( {} )

    protected abstract initForm (): FormGroup

    protected abstract loadPage (pageEvent: PageEventModel): void
}
