import { FormGroup } from '@angular/forms'
import { PageEventModel } from '../../util-model/model/page-event.model'
import { GenericComponent } from './generic.component'

export abstract class GenericListComponent extends GenericComponent {
    protected form: FormGroup = this.formBuilder.group( {} )

    protected abstract initForm (): FormGroup

    protected abstract loadPage (pageEvent: PageEventModel): void
}
