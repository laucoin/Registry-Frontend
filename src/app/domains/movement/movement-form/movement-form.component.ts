import { Component, computed, inject, OnDestroy, Signal, signal, WritableSignal } from '@angular/core'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { MovementFacade } from '../data/state/movement.facade'
import { MovementModel } from '../../../shared/util-model/model/movement.model'
import { MovementDto } from '../data/dto/movement.dto'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { DropdownModule } from 'primeng/dropdown'
import { MovementContentDto } from '../data/dto/movement-content.dto'
import { Select } from 'primeng/select'
import { DatePicker } from 'primeng/datepicker'
import { combineLatest, map, Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { ParticipantModel } from '../../../shared/util-model/model/participant.model'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { MovementContentModel } from '../../../shared/util-model/model/movement-content.model'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { EventUtil } from '../../../shared/util-tool/util/event.util'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { CreateMovement, UpdateMovement } from '../data/state/movement.action'
import { ParticipantUtil } from '../../../shared/util-tool/util/participant.util'
import { MovementContentFieldComponent } from './movement-content-field/movement-content-field.component'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { FormTitlePipe } from '../../../shared/util-tool/pipe/form-title.pipe'
import { FormButtonPipe } from '../../../shared/util-tool/pipe/form-button.pipe'
import { AutoComplete } from 'primeng/autocomplete'
import { InputGroup } from 'primeng/inputgroup'
import { InputGroupAddon } from 'primeng/inputgroupaddon'
import { VehicleUtil } from '../../../shared/util-tool/util/vehicle.util'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'

@Component( {
    selector: 'app-movement-form',
    standalone: true,
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        InputTextModule,
        ReactiveFormsModule,
        TranslateModule,
        DropdownModule,
        Select,
        DatePicker,
        RegistryRequiredDirective,
        MovementContentFieldComponent,
        TranslatePipe,
        DateFormatPipe,
        MovementContentFieldComponent,
        PluralTranslationPipe,
        FormTitlePipe,
        FormButtonPipe,
        AutoComplete,
        InputGroup,
        InputGroupAddon,

    ],
    templateUrl: './movement-form.component.html',
    styleUrl: './movement-form.component.scss',
} )
export class MovementFormComponent extends GenericFormComponent<MovementModel, MovementDto> implements OnDestroy {
    protected readonly facade: MovementFacade = inject( MovementFacade )

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil

    protected readonly now: Date = new Date()
    protected readonly form: FormGroup

    protected readonly hasVehicleOption: Signal<boolean> = computed( (): boolean => EventUtil.hasOption(
        this.contextEvent(),
        'VEHICLE',
    ) )
    protected readonly drivers: WritableSignal<SelectItem<ParticipantModel>[]> = signal( [] )

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
        this.handleContentChange()
    }

    protected override loadData (): void {
        this.facade.resetMovement()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchMovement( this.idParam!, this.contextEventId() )
        } else {
            super.loadData()
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            dateTime: this.formBuilder.control( this.now, [ Validators.required ] ),
            type: this.formBuilder.control( undefined, [ Validators.required ] ),
            content: this.formBuilder.control( [], [ Validators.required ] ),
            vehiclesWithDrivers: this.formBuilder.array( [], [] ),
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            combineLatest( [ this.facade.movement$, this.registryFacade.contextEvent$ ] ).pipe(
                map( ([ movement, event ]: [ MovementModel | undefined, EventModel | undefined ]): void => {
                    const contextEvent: EventModel | undefined = movement?.event || event
                    this.addEventDateValidators( contextEvent, this.dateTime )
                    this.fillForm( movement )
                } ),
            ).subscribe(),
        )
    }

    private handleContentChange (): void {
        this.subscriptions.add(
            this.content.valueChanges.pipe(
                map( (item: MovementContentModel[]): void => this.drivers.set(
                    item.map( (element: MovementContentModel): SelectItem<ParticipantModel> => ParticipantUtil.toSelectItem(
                        element.participant ) ),
                ) ),
            ).subscribe(),
        )
    }

    protected fillForm (element: MovementModel | undefined): void {
        if (!element) return

        this.dateTime.patchValue( new Date( element?.dateTime ) )
        this.type.patchValue( element.type.value )
        this.content.patchValue( element.content )
        this.buildVehiclesFromLoadedMovement()
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
            return
        }

        const dto: MovementDto = this.buildDto()
        const observable: Observable<CreateMovement | UpdateMovement> =
            this.facade.movement()
            ? this.facade.updateMovement( this.facade.movement()!.id!, dto, this.contextEventId() )
            : this.facade.createMovement( dto, this.contextEventId() )

        this.subscriptions.add(
            observable.pipe(
                map( (): void => this.navigateToRedirectUri( AppRouteEnum.MOVEMENTS ) ),
            ).subscribe(),
        )
    }

    protected buildDto (): MovementDto {
        return {
            dateTime: this.dateTime.value,
            type: this.type.value,
            content: this.content.value?.map( (content: MovementContentModel): MovementContentDto => ({
                poolName: content.poolName,
                participantId: content.participant.id,
                vehicleId: this.getVehicleFromDriver( content.participant.id ),
            }) ),
        }
    }

    private getVehicleFromDriver (driverId: string): string | undefined {
        const group: FormGroup | undefined = this.vehiclesWithDrivers.value
                                                 .find( (formGroup: FormGroup): boolean => Object.values( formGroup )[1].id === driverId )
        return group ? Object.values( group )[0]?.id : undefined
    }

    private buildVehiclesFromLoadedMovement (): void {
        this.vehiclesWithDrivers.clear()
        this.facade.movement()?.content
            .filter( (content: MovementContentModel): boolean => !!content.vehicle )
            .forEach( (content: MovementContentModel): void => {
                this.vehiclesWithDrivers.push(
                    this.formBuilder.group( {
                        vehicle: this.formBuilder.control( content.vehicle!, [ Validators.required ] ),
                        driver: this.formBuilder.control( content.participant!, [ Validators.required ] ),
                    } ),
                )
            } )
    }

    protected handleParticipantsAndGroupsSearch (searched: string | undefined): void {
        this.facade.searchParticipantsAndGroups(
            searched,
            this.contextEventId(),
        )
    }

    protected handleVehiclesSearch (searched: string | undefined): void {
        this.facade.searchVehicles(
            searched,
            this.contextEventId(),
        )
    }

    protected addVehicle (vehicle: VehicleModel): void {
        this.vehiclesWithDrivers.push( this.formBuilder.group( {
            vehicle: this.formBuilder.control( vehicle, [ Validators.required ] ),
            driver: this.formBuilder.control( undefined, [ Validators.required ] ),
        } ) )
    }

    protected removeVehicle (index: number): void {
        this.vehiclesWithDrivers.removeAt( index )
    }

    protected vehicleDriverFormGroup (index: number): FormGroup {
        return this.vehiclesWithDrivers.at( index ) as FormGroup
    }

    protected vehicle (index: number): FormControl {
        return this.vehicleDriverFormGroup( index ).get( 'vehicle' ) as FormControl
    }

    protected driver (index: number): FormControl {
        return this.vehicleDriverFormGroup( index ).get( 'driver' ) as FormControl
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['movementId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get dateTime (): FormControl {
        return this.form.get( 'dateTime' ) as FormControl
    }

    protected get type (): FormControl {
        return this.form.get( 'type' ) as FormControl
    }

    protected get content (): FormControl {
        return this.form.get( 'content' ) as FormControl
    }

    protected get vehiclesWithDrivers (): FormArray {
        return this.form.get( 'vehiclesWithDrivers' ) as FormArray
    }
}
