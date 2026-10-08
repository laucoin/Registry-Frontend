import {
    Component,
    computed,
    inject,
    input,
    InputSignal,
    OnDestroy,
    OnInit,
    Signal,
    signal,
    WritableSignal,
} from '@angular/core'
import { GenericFormComponent } from '@shared/ui/base/generic-form.component'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationDto } from '@pages/projects/[projectId]/movements/communication/data/dto/communication.dto'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { RegistryValidators } from '@shared/helpers/registry.validator'
import { tap } from 'rxjs'
import { MenuItem, SelectItem } from 'primeng/api'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertHelper } from '@shared/helpers/alert.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormFieldErrorComponent } from '@shared/ui/common/form-field-error/form-field-error.component'
import { Textarea } from 'primeng/textarea'
import {TranslocoPipe} from '@jsverse/transloco'
import { ProjectHelper } from '@shared/helpers/project.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { Menu } from 'primeng/menu'
import { Ripple } from 'primeng/ripple'
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { Divider } from 'primeng/divider'
import { FormHelper } from '@shared/helpers/form.helper'
import { InputText } from 'primeng/inputtext'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertDto } from '@pages/projects/[projectId]/alerts/data/dto/alert.dto'

enum CommunicationModulableFieldEnum {
    MOVEMENT = 'movement',
    ALERT = 'alert',
}

enum AlertModulableFieldEnum {
    SELECT = 'SELECT',
    NEW = 'NEW',
}

import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'

@Component( {
    selector: 'app-communication-form',
    imports: [
        FormErrorComponent,
        Button,
        Card,
        FormFieldErrorComponent,
        FormsModule,
        Textarea,
        TranslocoPipe,
        ReactiveFormsModule,
        Menu,
        Ripple,
        AutoComplete,
        DateFormatPipe,
        Divider,
        InputText,
    ],
    templateUrl: './communication-form.component.html',
    styleUrl: './communication-form.component.css',
} )
export class CommunicationFormComponent extends GenericFormComponent<CommunicationModel, CommunicationDto> implements OnInit, OnDestroy {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )
    protected readonly alertFacade: AlertFacade = inject( AlertFacade )
    protected readonly classicDatePipe: DateFormatPipe = inject( DateFormatPipe )
    protected readonly optionPipe: ProjectOptionIconPipe = inject( ProjectOptionIconPipe )

    protected readonly form: FormGroup
    protected readonly now: Date = new Date()
    protected readonly AlertModulableFieldEnum: typeof AlertModulableFieldEnum = AlertModulableFieldEnum

    public readonly redirect: InputSignal<boolean> = input( true )
    public readonly initialAlert: InputSignal<AlertModel | undefined> = input<AlertModel | undefined>()
    public readonly initialMovement: InputSignal<MovementModel | undefined> = input<MovementModel | undefined>(
        undefined )

    private readonly allActions: Signal<MenuItem[]> = signal( [
        {
            id: CommunicationModulableFieldEnum.MOVEMENT,
            label: 'communications.form.actions.add-movement',
            icon: 'pi pi-sort-alt',
            disabled: false,
            command: (): void => this.movementSelectorVisible.set( true ),
        },
        {
            id: CommunicationModulableFieldEnum.ALERT,
            label: 'communications.form.actions.link-alert',
            icon: this.optionPipe.transform( ProjectOptionEnum.ALERT ),
            disabled: false,
            command: (): void => this.alertSelectorMode.set( AlertModulableFieldEnum.SELECT ),
        },
        {
            id: CommunicationModulableFieldEnum.ALERT,
            label: 'communications.form.actions.add-alert',
            icon: this.optionPipe.transform( ProjectOptionEnum.ALERT ),
            disabled: false,
            command: (): void => {
                this.alertSelectorMode.set( AlertModulableFieldEnum.NEW )
                this.newAlertTitle.addValidators( [
                    Validators.required, RegistryValidators.nonBlank(), Validators.maxLength( 50 ),
                ] )
            },
        },
    ] )

    protected readonly actions: Signal<MenuItem[]> = computed( () => this.buildModulableFields( this.allActions() ) )

    protected readonly movementSelectorVisible: WritableSignal<boolean> = signal( false )
    protected readonly alertSelectorMode: WritableSignal<AlertModulableFieldEnum | undefined> = signal<AlertModulableFieldEnum | undefined>(
        undefined )
    protected readonly selectedMovement: WritableSignal<SelectItem<MovementModel> | undefined> = signal( undefined )
    protected readonly selectedAlert: WritableSignal<SelectItem<AlertModel> | undefined> = signal( undefined )

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    public ngOnInit (): void {
        this.setAlertIfNecessary()
        this.setMovementIfNecessary()
    }

    private setAlertIfNecessary (): void {
        this.alert.patchValue( this.initialAlert()?.id )
        this.handleAlertSelection( GenericHelper.nonNull( this.initialAlert() ) ? AlertHelper.toSelectItem(
            this.initialAlert()!,
            this.classicDatePipe,
        ) : undefined )
    }

    private setMovementIfNecessary (): void {
        this.movement.patchValue( this.initialMovement()?.id )
        this.handleMovementSelection( GenericHelper.nonNull( this.initialMovement() ) ? MovementHelper.toActivitySelectItem(
            this.initialMovement()!,
            this.classicDatePipe,
        ) : undefined )
    }

    protected override loadData (): void {
        this.facade.resetCommunication()

        if (GenericHelper.nonNull( this.idParam )) {
            this.facade.fetchCommunication( this.idParam! )
        }
    }

    protected override initForm (): FormGroup {
        return this.formBuilder.group( {
            movement: this.formBuilder.control( undefined, [] ),
            alert: this.formBuilder.control( undefined, [] ),
            newAlertTitle: this.formBuilder.control( undefined, [] ),
            message: this.formBuilder.control(
                undefined,
                [ Validators.required, RegistryValidators.nonBlank(), Validators.maxLength( 250 ) ],
            ),
        }, {
            validators: [ RegistryValidators.atLeastOneRequired( 'movement', 'alert' ) ],
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.communication$.pipe(
                tap( (communication: CommunicationModel | undefined): void => this.fillForm( communication ) ),
            ).subscribe(),
        )
    }

    protected override fillForm (element: CommunicationModel | undefined): void {
        if (!element) return

        if (element?.movement) {
            const movement: SelectItem<MovementModel> = MovementHelper.toActivitySelectItem(
                element.movement,
                this.classicDatePipe,
            )
            this.movement.patchValue( movement )
            this.handleMovementSelection( movement )
            this.movement.disable()
        }

        if (element?.alert) {
            const alert: SelectItem<AlertModel> = AlertHelper.toSelectItem(
                element.alert,
                this.classicDatePipe,
            )
            this.alert.patchValue( alert )
            this.handleAlertSelection( alert )
            this.alert.disable()
        }
        this.message.patchValue( element.message )
    }

    protected resetForm (): void {
        this.facade.resetCommunication()
        this.form.reset()

        this.movementSelectorVisible.set( false )
        this.handleMovementSelection( undefined )
        this.movement.enable()
        this.setMovementIfNecessary()

        this.alertSelectorMode.set( undefined )
        this.newAlertTitle.clearValidators()
        this.handleAlertSelection( undefined )
        this.alert.enable()
        this.setAlertIfNecessary()
    }

    protected handleMovementSelection (selectedMovement: SelectItem<MovementModel> | undefined): void {
        this.selectedMovement.set( selectedMovement )
    }

    protected handleAlertSelection (selectedAlert: SelectItem<AlertModel> | undefined): void {
        this.selectedAlert.set( selectedAlert )
    }

    protected submit (): void {
        if (this.saving()) return

        if (!FormHelper.isFormValid( this.form )) {
            this.logInvalidForm( this.form.value )
            return
        }

        if (this.alertSelectorMode() === AlertModulableFieldEnum.NEW) {
            this.submitAlert()
        } else {
            this.submitCommunication()
        }
    }

    private submitCommunication (): void {
        const dto: CommunicationDto = this.buildDto()
        this.save(
            (this.facade.communication()
             ? this.facade.updateCommunication( this.facade.communication()!.id, dto )
             : this.facade.createCommunication( dto )
            ).pipe( tap( (): void => this.resetForm() ) ),
            false,
        )
    }

    private submitAlert (): void {
        this.save( this.alertFacade.createAlert( this.buildAlertDto() ).pipe( tap( (): void => this.resetForm() ) ), false )
    }

    protected override buildDto (): CommunicationDto {
        const dateTime: Date = GenericHelper.nonNull( this.facade.communication()?.dateTime )
                               ? new Date( this.facade.communication()!.dateTime )
                               : new Date()
        return {
            dateTime: dateTime.toISOString(),
            message: this.message.value,
            movementId: this.selectedMovement()?.value?.id,
            alertId: this.selectedAlert()?.value?.id,
        }
    }

    private buildAlertDto (): AlertDto {
        const dateTime: Date = GenericHelper.nonNull( this.facade.communication()?.dateTime )
                               ? new Date( this.facade.communication()!.dateTime )
                               : new Date()
        return {
            title: this.newAlertTitle.value,
            dateTime: dateTime.toISOString(),
            message: this.message.value,
            movementId: this.selectedMovement()?.value?.id,
        }
    }

    protected handleMovementSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchMovements( searched.query )
    }

    protected handleAlertSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchAlerts( searched.query )
    }

    protected removeMovementField (): void {
        this.handleMovementSelection( undefined )
        this.movementSelectorVisible.set( false )
    }

    protected removeAlertField (): void {
        this.handleAlertSelection( undefined )
        this.newAlertTitle.patchValue( undefined )
        this.alertSelectorMode.set( undefined )
    }

    protected override get idParam (): string | undefined {
        return this.route.snapshot.params['communicationId']
    }

    private buildModulableFields (actions: MenuItem[]): MenuItem[] {
        return actions.filter( (action: MenuItem): boolean => {
            switch (true) {
                case action.id === CommunicationModulableFieldEnum.ALERT:
                    return GenericHelper.isNull( this.initialAlert() ) && ProjectHelper.hasOption(
                        this.registryFacade.selectedProject(),
                        ProjectOptionEnum.ALERT,
                    )
                case action.id === CommunicationModulableFieldEnum.MOVEMENT:
                    return GenericHelper.isNull( this.initialMovement() )
                default:
                    return true
            }
        } ).map( (action: MenuItem): MenuItem => ({
            ...action,
            disabled: action.disabled || (action.id === CommunicationModulableFieldEnum.ALERT && GenericHelper.nonNull(
                this.alertSelectorMode() )) || (action.id === CommunicationModulableFieldEnum.MOVEMENT && this.movementSelectorVisible()),
        }) )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get message (): FormControl {
        return this.form.get( 'message' ) as FormControl
    }

    protected get movement (): FormControl {
        return this.form.get( 'movement' ) as FormControl
    }

    protected get alert (): FormControl {
        return this.form.get( 'alert' ) as FormControl
    }

    protected get newAlertTitle (): FormControl {
        return this.form.get( 'newAlertTitle' ) as FormControl
    }
}
