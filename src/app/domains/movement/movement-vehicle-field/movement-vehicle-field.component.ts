import { Component, EventEmitter, forwardRef, Input, OnChanges, Output, signal, WritableSignal } from '@angular/core'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { Button } from 'primeng/button'
import { TranslatePipe } from '@ngx-translate/core'
import {
    AbstractControl,
    ControlValueAccessor,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { SelectItem } from 'primeng/api'
import { RegistryFacade } from '../../../shared/util-common/state/registry.facade'
import { VehicleUtil } from '../../../shared/util-tool/util/vehicle.util'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { StateUtil } from '../../../shared/util-tool/state/state.util'
import { NgForOf } from '@angular/common'
import { Select } from 'primeng/select'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputGroup } from 'primeng/inputgroup'
import { InputGroupAddon } from 'primeng/inputgroupaddon'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'

@Component( {
    selector: 'app-movement-vehicle-field',
    imports: [
        AutoComplete,
        Button,
        TranslatePipe,
        NgForOf,
        ReactiveFormsModule,
        Select,
        FormFieldErrorComponent,
        InputGroup,
        InputGroupAddon,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef( (): typeof MovementVehicleFieldComponent => MovementVehicleFieldComponent ),
            multi: true,
        },
    ],
    templateUrl: './movement-vehicle-field.component.html',
    styleUrl: './movement-vehicle-field.component.scss',
} )
export class MovementVehicleFieldComponent implements ControlValueAccessor, OnChanges {
    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil

    @Input( { required: true } ) public formArray!: FormArray
    @Input() public suggestions: SelectItem<VehicleModel>[] = []
    @Input() public participants: SelectItem<ParticipantModel>[] = []
    @Input() public fluid: boolean = true
    @Input() public unique: boolean = true
    @Input() public inputId: string | undefined
    @Input() public searchLabel: string | undefined
    @Input() public emptyPlaceholder: string | undefined

    @Output() public handleSearch: EventEmitter<AutoCompleteCompleteEvent> = new EventEmitter<AutoCompleteCompleteEvent>()

    protected drivers: WritableSignal<SelectItem<ParticipantModel>[]> = signal( [] )

    private onChange: ((value: FormGroup[]) => void) | undefined = undefined
    private onTouched: (() => void) | undefined = undefined

    protected readonly disabled: WritableSignal<boolean> = signal( false )

    public constructor (
        private readonly registryFacade: RegistryFacade,
        private readonly formBuilder: FormBuilder,
    ) {}

    public ngOnChanges (): void {
        this.drivers.set(
            this.participants.filter( (participant: SelectItem<ParticipantModel>): boolean => participant.value.major ),
        )
    }

    public writeValue (value: FormGroup[]): void {
        value.forEach( (item: FormGroup): void => {
            this.addVehicle( item.get( 'vehicle' )?.value )
            item.get( 'driver' )?.setValue( item.get( 'driver' )?.value )
        } )
    }

    protected onElementSelection (element: SelectItem<VehicleModel>): void {
        const sameVehicle: FormGroup | undefined = this.formArray.controls
                                                       .map( (group: AbstractControl): FormGroup => group as FormGroup )
                                                       .find( (group: FormGroup): boolean =>
                                                           group.get( 'vehicle' )?.value.id == element.value.id,
                                                       )

        if (sameVehicle !== undefined) {
            this.registryFacade.notify(
                StateUtil.buildNotificationMessage(
                    'warn',
                    'warning.title.duplicated-selection.vehicle',
                    'warning.message.duplicated-selection.vehicle',
                    undefined,
                    { name: element.label },
                ),
            )
            return
        }

        this.addVehicle( element.value )
    }

    private addVehicle (vehicle: VehicleModel): void {
        this.formArray.push( this.formBuilder.group( {
            vehicle: this.formBuilder.control( vehicle, [ Validators.required ] ),
            driver: this.formBuilder.control( undefined, [ Validators.required ] ),
        } ) )
    }

    protected onRemoveVehicle (index: number): void {
        this.formArray.removeAt( index )
    }

    public registerOnChange (fn: (value: FormGroup[]) => void): void {
        this.onChange = fn
    }

    public registerOnTouched (fn: () => void): void {
        this.onTouched = fn
    }

    public setDisabledState? (isDisabled: boolean): void {
        this.disabled.set( isDisabled )
    }

    protected formGroup (index: number): FormGroup {
        return this.formArray.at( index ) as FormGroup
    }

    protected vehicle (index: number): FormControl {
        return this.formGroup( index ).get( 'vehicle' ) as FormControl
    }

    protected driver (index: number): FormControl {
        return this.formGroup( index ).get( 'driver' ) as FormControl
    }
}
