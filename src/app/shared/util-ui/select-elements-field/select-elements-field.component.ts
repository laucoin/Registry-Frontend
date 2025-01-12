import {
    Component,
    ContentChildren,
    EventEmitter,
    forwardRef,
    Input,
    Output,
    QueryList,
    signal,
    WritableSignal,
} from '@angular/core'
import { ControlValueAccessor, FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete'
import { Button } from 'primeng/button'
import { RegistryTemplateDirective } from '../../util-tool/directive/registry-template.directive'
import { SelectItem } from 'primeng/api'
import { BaseModel } from '../../util-model/model/base.model'
import { RegistryFacade } from '../../util-common/state/registry.facade'
import { StateUtil } from '../../util-tool/state/state.util'

@Component( {
    selector: 'app-select-elements-field',
    imports: [
        ReactiveFormsModule,
        Button,
        FormsModule,
        AutoComplete,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof SelectElementsFieldComponent => SelectElementsFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './select-elements-field.component.html',
    styleUrl: './select-elements-field.component.scss',
} )
export class SelectElementsFieldComponent<T extends BaseModel> implements ControlValueAccessor {
    @ContentChildren( RegistryTemplateDirective ) public templates: QueryList<RegistryTemplateDirective> | undefined

    @Input( { required: true } ) public formControl!: FormControl
    @Input() public suggestions: SelectItem<T>[] = []
    @Input() public fluid: boolean = true
    @Input() public unique: boolean = true
    @Input() public inputId: string | undefined
    @Input() public searchLabel: string | undefined
    @Input() public emptyPlaceholder: string | undefined

    @Output() public handleSearch: EventEmitter<AutoCompleteCompleteEvent> = new EventEmitter<AutoCompleteCompleteEvent>()

    private onChange: ((value: SelectItem<T>[]) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected readonly disabled: WritableSignal<boolean> = signal( false )

    public constructor (private readonly registryFacade: RegistryFacade) {}

    protected onElementSelection (event: AutoCompleteSelectEvent): void {
        const currentSelection: SelectItem<T>[] = this.formControl.value ?? []

        if (currentSelection.find( (item: SelectItem<T>): boolean => item.value.id == event.value.value.id )) {
            this.registryFacade.notify(
                StateUtil.buildNotificationMessage(
                    'warn',
                    'warning.title.duplicated-selection.normal',
                    'warning.message.duplicated-selection.normal',
                    undefined,
                    { name: event.value.label },
                ),
            )
            return
        }
        this.formControl.setValue( [ ...currentSelection, event.value ] )
    }

    protected onElementRemoving (element: T): void {
        this.formControl.setValue( this.formControl.value.filter( (item: SelectItem<T>): boolean => item.value != element ) )
    }

    public writeValue (): void {
        // Do nothing
    }

    public registerOnChange (fn: (value: SelectItem<T>[]) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState? (isDisabled: boolean): void {
        this.disabled.set( isDisabled )
    }
}
