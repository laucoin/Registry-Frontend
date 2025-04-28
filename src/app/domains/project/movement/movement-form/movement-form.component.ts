import { Component, computed, inject, OnDestroy, Signal, signal, WritableSignal } from '@angular/core'
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { MovementFacade } from '../data/state/movement.facade'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { MovementDto } from '../data/dto/movement.dto'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule, TranslatePipe } from '@ngx-translate/core'
import { DropdownModule } from 'primeng/dropdown'
import { MovementContentDto } from '../data/dto/movement-content.dto'
import { Select } from 'primeng/select'
import { DatePicker } from 'primeng/datepicker'
import { map, Observable, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { MovementContentModel } from '../../../../shared/util-model/model/movement-content.model'
import { ProjectModel } from '../../../../shared/util-model/model/project.model'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'
import { ProjectUtil } from '../../../../shared/util-tool/util/project.util'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { GenericFormComponent } from '../../../../shared/util-tool/component/generic-form.component'
import { ParticipantUtil } from '../../../../shared/util-tool/util/participant.util'
import { MovementContentFieldComponent } from './movement-content-field/movement-content-field.component'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'
import { FormTitlePipe } from '../../../../shared/util-tool/pipe/form-title.pipe'
import { FormButtonPipe } from '../../../../shared/util-tool/pipe/form-button.pipe'
import { AutoComplete } from 'primeng/autocomplete'
import { InputGroup } from 'primeng/inputgroup'
import { InputGroupAddon } from 'primeng/inputgroupaddon'
import { VehicleUtil } from '../../../../shared/util-tool/util/vehicle.util'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { MovementReasonModel } from '../data/model/movement-reason.model'
import { ProgressSpinner } from 'primeng/progressspinner'
import { Step, StepItem, StepPanel, Stepper } from 'primeng/stepper'
import { FormIconPipe } from '../../../../shared/util-tool/pipe/form-icon.pipe'
import { RadioButton } from 'primeng/radiobutton'
import { ParticipantTypeEnum } from '../../../../shared/util-model/enumeration/participant-type.enum'
import { ParticipantDto } from '../../configuration/participant/data/dto/participant.dto'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'
import {
    CreateGuestsMovement,
    CreateMovement,
    UpdateGuestsMovement,
    UpdateMovement,
} from '../data/state/movement.action'
import { MovementTypeEnum } from '../../../../shared/util-model/enumeration/movement-type.enum'

@Component( {
    selector: 'app-movement-form',
    standalone: true,
    imports: [
        Button,
        CardModule,
        DividerModule,
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
        ProgressSpinner,
        Stepper,
        StepItem,
        Step,
        StepPanel,
        FormIconPipe,
        RadioButton,
        FormsModule,
    ],
    templateUrl: './movement-form.component.html',
    styleUrl: './movement-form.component.scss',
} )
export class MovementFormComponent extends GenericFormComponent<MovementModel, MovementDto> implements OnDestroy {
    protected readonly facade: MovementFacade = inject( MovementFacade )

    protected readonly VehicleUtil: typeof VehicleUtil = VehicleUtil

    protected readonly now: Date = new Date()
    protected readonly informationForm: FormGroup
    protected readonly contentForm: FormGroup
    protected readonly vehicleForm: FormGroup

    protected readonly reasonRequired: WritableSignal<boolean> = signal( true )
    protected readonly isContentSelection: WritableSignal<boolean> = signal( true )
    protected readonly selectedReason: WritableSignal<MovementReasonModel | undefined> = signal( undefined )
    protected readonly hasVehicleOption: Signal<boolean> = computed( (): boolean => ProjectUtil.hasOption(
        this.registryFacade.selectedProject(),
        'VEHICLE',
    ) )
    protected readonly hasThirdStep: Signal<boolean> = computed( (): boolean =>
        (this.facade.movement()?.contentType === ParticipantTypeEnum.REGISTERED && this.hasVehicleOption())
        || (this.facade.movement()?.content.some( (content: MovementContentModel): boolean => GenericUtil.nonNull(
            content.vehicle ) ) ?? false),
    )
    protected readonly drivers: WritableSignal<SelectItem<ParticipantModel>[]> = signal( [] )

    protected activeTab: number = 1

    public constructor () {
        super()

        this.informationForm = this.initForm()
        this.contentForm = this.initContentForm()
        this.vehicleForm = this.initVehicleForm()

        this.loadData()

        this.handleLoadedElement()
        this.handleContentChange()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected override loadData (): void {
        this.facade.resetMovement()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchMovement( this.idParam! )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            dateTime: this.formBuilder.control( this.now, [ Validators.required ] ),
            type: this.formBuilder.control( undefined, [ Validators.required ] ),
            contentType: this.formBuilder.control( ParticipantTypeEnum.REGISTERED, [ Validators.required ] ),
        } )
    }

    private initContentForm (): FormGroup {
        return this.formBuilder.group( {
            reason: this.formBuilder.control( undefined, [] ),
            participantContent: this.formBuilder.control( [], [] ),
            guestContent: this.formBuilder.array( [], [] ),
        } )
    }

    private initVehicleForm (): FormGroup {
        return this.formBuilder.group( {
            vehiclesWithDrivers: this.formBuilder.array( [], [] ),
        } )
    }

    protected handleTypeChange (type: string | undefined): void {
        this.updateContentAndReasonRules( type, this.contentType.value )
    }

    protected handleContentTypeChange (contentType: string): void {
        this.updateContentAndReasonRules( this.type.value, contentType )
    }

    private updateContentAndReasonRules (type: string | undefined, contentType: string): void {
        this.selectedReason.set( undefined )
        this.reason.patchValue( undefined )

        this.isContentSelection.set( contentType == ParticipantTypeEnum.REGISTERED || type == 'OUT' )

        if (this.isContentSelection()) {
            this.guestContent.clear()
            this.guestContent.clearValidators()
            this.participantContent.addValidators( [ Validators.required ] )
        } else {
            this.participantContent.clearValidators()
            this.guestContent.addValidators( [ Validators.required ] )
            if (this.guestContent.length == 0) this.addGuest()
        }

        this.reasonRequired.set(
            type == MovementTypeEnum.OUT && contentType == ParticipantTypeEnum.REGISTERED ||
            type == MovementTypeEnum.IN && contentType == ParticipantTypeEnum.GUEST,
        )

        if (this.reasonRequired()) {
            this.reason.addValidators( [ Validators.required ] )
        } else {
            this.reason.clearValidators()
        }
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.movement$.pipe(
                tap( (movement: MovementModel | undefined): void => {
                    const contextProject: ProjectModel | undefined = movement?.project || this.registryFacade.selectedProject()
                    this.addProjectDateValidators( contextProject, this.dateTime )
                    this.fillForm( movement )
                } ),
            ).subscribe(),
        )
    }

    private handleContentChange (): void {
        this.subscriptions.add(
            this.participantContent.valueChanges.pipe(
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
        this.type.disable()
        this.contentType.patchValue( element.contentType )
        this.contentType.disable()
        if (element.type.value == MovementTypeEnum.IN && element.contentType == ParticipantTypeEnum.GUEST) {
            element.content.forEach( (content: MovementContentModel): void => this.addGuest( content.participant ) )
        } else {
            this.participantContent.patchValue( element.content )
        }
        this.updateContentAndReasonRules( element.type.value, element.contentType )
        this.selectedReason.set( element.reason )
        this.reason.patchValue( element.reason )
        this.buildVehiclesFromLoadedMovement()
    }

    protected submit (): void {
        switch (true) {
            case !FormUtil.isFormValid( this.informationForm ):
                console.warn( this.invalidFormMessage, this.informationForm.value )
                return
            case !FormUtil.isFormValid( this.contentForm ):
                console.warn( this.invalidFormMessage, this.contentForm.value )
                return
            case !FormUtil.isFormValid( this.vehicleForm ):
                console.warn( this.invalidFormMessage, this.vehicleForm.value )
                return
        }

        const dto: MovementDto = this.buildDto()
        const observable: Observable<CreateMovement | CreateGuestsMovement | UpdateMovement | UpdateGuestsMovement> =
            this.facade.movement()
            ? this.facade.updateMovement( this.facade.movement()!.id!, dto )
            : this.facade.createMovement( dto )

        this.subscriptions.add(
            observable.pipe(
                map( (): void => this.navigateToRedirectUri() ),
            ).subscribe(),
        )
    }

    protected buildDto (): MovementDto {
        return {
            dateTime: this.dateTime.value,
            type: this.type.value,
            reason: this.selectedReason()?.kind === 'REASON' ? this.selectedReason()?.value : undefined,
            activityId: this.selectedReason()?.kind === 'ACTIVITY' ? this.selectedReason()?.value : undefined,
            contentType: this.contentType.value,
            content: this.participantContent.value?.map( (content: MovementContentModel): MovementContentDto => ({
                poolName: content.poolName,
                participantId: content.participant.id,
                vehicleId: this.getVehicleFromDriver( content.participant.id ),
            }) ),
            guests: this.guestContent.value.map( (guest: ParticipantDto): ParticipantDto => ({
                id: guest.id,
                firstName: guest.firstName,
                lastName: guest.lastName,
                birthday: DateUtil.getDate( new Date( guest.birthday ) ),
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

    protected handleReasonsAndActivitiesSearch (textSearched: string | undefined): void {
        this.facade.searchReasonsAndActivities(
            textSearched,
            this.type.value,
            this.contentType.value,
        )
    }

    protected handleParticipantsAndGroupsSearch (textSearched: string | undefined): void {
        this.facade.searchParticipantsAndGroups(
            this.contentType.value,
            textSearched,
        )
    }

    protected handleVehiclesSearch (searched: string | undefined): void {
        this.facade.searchVehicles( searched )
    }

    protected addGuest (participant: ParticipantModel | undefined = undefined): void {
        this.guestContent.push( this.formBuilder.group( {
            id: this.formBuilder.control( participant?.id, [] ),
            firstName: this.formBuilder.control( participant?.firstName, [ Validators.required ] ),
            lastName: this.formBuilder.control( participant?.lastName, [ Validators.required ] ),
            birthday: this.formBuilder.control(
                participant?.birthday ? new Date( participant?.birthday ) : undefined,
                [ Validators.required ],
            ),
        } ) )
    }

    protected removeGuest (index: number): void {
        this.guestContent.removeAt( index )
    }

    protected guestFormGroup (index: number): FormGroup {
        return this.guestContent.at( index ) as FormGroup
    }

    protected participantId (index: number): FormControl {
        return this.guestFormGroup( index ).get( 'id' ) as FormControl
    }

    protected firstName (index: number): FormControl {
        return this.guestFormGroup( index ).get( 'firstName' ) as FormControl
    }

    protected lastName (index: number): FormControl {
        return this.guestFormGroup( index ).get( 'lastName' ) as FormControl
    }

    protected birthday (index: number): FormControl {
        return this.guestFormGroup( index ).get( 'birthday' ) as FormControl
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

    protected get dateTime (): FormControl {
        return this.informationForm.get( 'dateTime' ) as FormControl
    }

    protected get type (): FormControl {
        return this.informationForm.get( 'type' ) as FormControl
    }

    protected get contentType (): FormControl {
        return this.informationForm.get( 'contentType' ) as FormControl
    }

    protected get reason (): FormControl {
        return this.contentForm.get( 'reason' ) as FormControl
    }

    protected get participantContent (): FormControl {
        return this.contentForm.get( 'participantContent' ) as FormControl
    }

    protected get guestContent (): FormArray {
        return this.contentForm.get( 'guestContent' ) as FormArray
    }

    protected get vehiclesWithDrivers (): FormArray {
        return this.vehicleForm.get( 'vehiclesWithDrivers' ) as FormArray
    }
}
