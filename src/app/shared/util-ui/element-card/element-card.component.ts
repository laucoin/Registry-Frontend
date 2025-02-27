import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    output,
    OutputEmitterRef,
    signal,
    Signal,
    WritableSignal,
} from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { MenuItem } from 'primeng/api'
import { AvatarModule } from 'primeng/avatar'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { MenuModule } from 'primeng/menu'
import { ActionModel } from '../../util-model/model/action.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { GenericModel } from '../../util-model/model/generic.model'
import { HistoryModel } from '../../util-model/model/history.model'
import { ElementSkeletonComponent } from '../element-skeleton/element-skeleton.component'
import { DialogModule } from 'primeng/dialog'
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { Popover } from 'primeng/popover'
import { Ripple } from 'primeng/ripple'
import { ContextMenu } from 'primeng/contextmenu'
import { FormUtil } from '../../util-tool/util/form.util'
import { GenericComponent } from '../../util-tool/component/generic.component'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'

@Component( {
    selector: 'app-element-card',
    standalone: true,
    imports: [
        CardModule,
        AvatarModule,
        ElementSkeletonComponent,
        Button,
        MenuModule,
        TranslateModule,
        DialogModule,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        ReactiveFormsModule,
        Popover,
        Ripple,
        ContextMenu,
    ],
    templateUrl: './element-card.component.html',
    styleUrl: './element-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class ElementCardComponent<T extends GenericModel, A> extends GenericComponent {
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    protected readonly FormUtil: typeof FormUtil = FormUtil

    protected readonly form: FormGroup

    protected showDialog: boolean = false

    public readonly element: InputSignal<T> = input.required()
    public readonly actions: InputSignal<ActionModel<A>[]> = input<ActionModel<A>[]>( [] )
    public readonly icon: InputSignal<string | undefined> = input()
    public readonly loading: InputSignal<boolean> = input( false )
    public readonly actionMenuVisible: InputSignal<boolean> = input( true )

    protected readonly items: Signal<MenuItem[]>
    protected readonly creationLabel: Signal<string>
    protected readonly lastEditionLabel: Signal<string>
    protected readonly dialogContent: WritableSignal<ActionModel<A> | undefined> = signal( undefined )

    public readonly action: OutputEmitterRef<A> = output()

    public constructor () {
        super()

        this.form = this.initForm()

        this.items = computed( (): MenuItem[] => this.definedMenuItems(
            this.registryFacade.currentUser(),
            this.actions(),
        ) )

        this.creationLabel = computed( (): string => this.buildHistoryItem(
            this.element().creation,
            'global.date-and-time-format.element-created',
        ) )

        this.lastEditionLabel = computed( (): string => this.buildHistoryItem(
            this.element().lastEdition,
            'global.date-and-time-format.element-last-update',
        ) )
    }

    private initForm (): FormGroup {
        return this.formBuilder.group( {
            confirmationName: this.formBuilder.control( undefined, [] ),
        } )
    }

    private definedMenuItems (currentUser: CurrentUserModel | undefined, actions: ActionModel<A>[]): MenuItem[] {
        if (!currentUser) return []
        return actions
            .map( (action: ActionModel<A>): MenuItem => ({
                label: action.name,
                icon: action.icon,
                disabled: action.disabled,
                command: (): void => this.showConfirmationIfNecessary( action ),
            }) )
    }

    private buildHistoryItem (history: HistoryModel, translationPrefix: string): string {
        const key: string = `${translationPrefix}${history.user ? '-user' : ''}`
        return this.translateService.instant(
            key,
            {
                datetime: this.datePipe.transform( history.dateTime, 'datetime' ),
                user: history.user?.email,
            },
        )
    }

    private showConfirmationIfNecessary (action: ActionModel<A>): void {
        if (action.confirmation) {
            if (action.confirmation.confirmProperty) {
                const value: string | undefined = this.propertyValue( action.confirmation.confirmProperty )
                if (value) {
                    this.confirmationName.addValidators( [ Validators.required, Validators.pattern( value ) ] )
                }
            }

            this.showDialog = true
            this.dialogContent.set( action )
        } else {
            this.action.emit( action.id )
        }
    }

    protected cancelAction (): void {
        this.confirmationName.reset()
        this.confirmationName.clearValidators()
        this.showDialog = false
        this.dialogContent.set( undefined )
    }

    protected confirmAction (action: ActionModel<A> | undefined): void {
        if (this.isConfirmationFormValid()) {
            if (action) {
                this.action.emit( action.id )
            }

            this.cancelAction()
        } else {
            console.warn( this.translateService.instant( 'global.messages.invalid-form' ) )
        }
    }

    protected isConfirmationFormValid (): boolean {
        FormUtil.markAllControlsAsDirty( this.form )
        return !this.form.invalid
    }

    protected propertyValue (property: string | undefined): string {
        if (!property) return ''
        return Object( this.element() )[property]
    }

    protected get confirmationName (): FormControl {
        return this.form.get( 'confirmationName' ) as FormControl
    }
}
