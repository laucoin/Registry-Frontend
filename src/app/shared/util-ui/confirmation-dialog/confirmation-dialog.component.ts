import {
    Component,
    computed,
    effect,
    inject,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    Signal,
} from '@angular/core'
import { Dialog } from 'primeng/dialog'
import { ActionModel } from '../../util-model/model/action.model'
import { GenericModel } from '../../util-model/model/generic.model'
import { breakPoint } from '../../util-tool/util/breakpoint.const'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component'
import { InputText } from 'primeng/inputtext'
import { FormUtil } from '../../util-tool/util/form.util'
import { Button, ButtonSeverity } from 'primeng/button'
import { ConfirmationModel } from '../../util-model/model/confirmation.model'
import { ElementActionEnum } from '../../util-model/enumeration/element-action.enum'

@Component( {
    selector: 'app-confirmation-dialog',
    standalone: true,
    imports: [
        Dialog,
        TranslatePipe,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        InputText,
        Button,
    ],
    templateUrl: './confirmation-dialog.component.html',
    styleUrl: './confirmation-dialog.component.scss',
} )
export class ConfirmationDialogComponent<M extends GenericModel> {
    protected readonly FormUtil: typeof FormUtil = FormUtil
    protected readonly breakpoint: object = breakPoint

    private readonly formBuilder: FormBuilder = inject( FormBuilder )
    private readonly translateService: TranslateService = inject( TranslateService )

    protected readonly form: FormGroup
    protected showDialog: boolean = false

    public loading: InputSignal<boolean> = input.required()
    public element: InputSignal<M> = input.required()
    public action: InputSignal<ActionModel | undefined> = input<ActionModel | undefined>( undefined )
    protected confirmation: Signal<ConfirmationModel | undefined> = computed( (): ConfirmationModel | undefined => this.action()?.confirmation )
    protected header: Signal<string> = computed( (): string => this.confirmation()?.header ?? '' )
    protected message: Signal<string> = computed( (): string => this.confirmation()?.message ?? '' )
    protected hintMessage: Signal<string | undefined> = computed( (): string | undefined => this.confirmation()?.hint )
    protected propertyValue: Signal<string | undefined> = computed(
        (): string | undefined => this.extractPropertyValue( this.element(), this.action() ),
    )
    protected rejectSeverity: Signal<ButtonSeverity> = computed( (): ButtonSeverity => this.action()?.confirmation?.rejectSeverity )
    protected acceptSeverity: Signal<ButtonSeverity> = computed( (): ButtonSeverity => this.action()?.confirmation?.acceptSeverity )

    public hide: OutputEmitterRef<void> = output()
    public handleAction: OutputEmitterRef<ElementActionEnum> = output()

    public constructor () {
        this.form = this.initForm()

        effect( (): boolean => this.showDialog = GenericUtil.nonNull( this.confirmation() ) )
    }

    private initForm (): FormGroup {
        return this.formBuilder.group( {
            confirmationName: this.formBuilder.control( undefined, [] ),
        } )
    }

    protected extractPropertyValue (element: M, action: ActionModel | undefined): string | undefined {
        const property: string | undefined = action?.confirmation?.confirmProperty
        if (GenericUtil.isNull( property )) return ''
        return Object( element )[property!]
    }

    protected submit (): void {
        if (FormUtil.isFormValid( this.form )) {
            this.handleAction.emit( this.action()!.id )
            this.hide.emit()
        } else {
            console.warn( this.translateService.instant( 'global.messages.invalid-form' ) )
        }
    }

    protected closeDialog (): void {
        this.confirmationName.reset()
        this.confirmationName.clearValidators()
        this.showDialog = false
        this.hide.emit()
    }

    protected get confirmationName (): FormControl {
        return this.form.get( 'confirmationName' ) as FormControl
    }
}
