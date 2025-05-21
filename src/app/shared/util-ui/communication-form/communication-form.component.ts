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
import { GenericFormComponent } from '../../util-tool/component/generic-form.component'
import { CommunicationModel } from '../../../domains/project/communication/data/model/communication.model'
import { CommunicationDto } from '../../../domains/project/communication/data/dto/communication.dto'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { CommunicationFacade } from '../../../domains/project/communication/data/state/communication.facade'
import { GenericUtil } from '../../util-tool/util/generic.util'
import { RegistryValidators } from '../../util-tool/util/registry.validator'
import { Observable, tap } from 'rxjs'
import { MenuItem, SelectItem } from 'primeng/api'
import { MovementModel } from '../../util-model/model/movement.model'
import { MovementUtil } from '../../util-tool/util/movement.util'
import { AlertModel } from '../../util-model/model/alert.model'
import { AlertUtil } from '../../util-tool/util/alert.util'
import { DateFormatPipe } from '../../util-tool/pipe/date-format.pipe'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { FormFieldErrorComponent } from '../form-field-error/form-field-error.component'
import { Textarea } from 'primeng/textarea'
import { TranslatePipe } from '@ngx-translate/core'
import { ProjectUtil } from '../../util-tool/util/project.util'
import { ProjectOptionEnum } from '../../util-model/enumeration/project-option.enum'
import { Menu } from 'primeng/menu'
import { Ripple } from 'primeng/ripple'
import { ProjectOptionIconPipe } from '../../util-tool/pipe/project-option-icon.pipe'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { Divider } from 'primeng/divider'
import { FormUtil } from '../../util-tool/util/form.util'
import {
    CreateCommunication,
    UpdateCommunication,
} from '../../../domains/project/communication/data/state/communication.action'
import { InputText } from 'primeng/inputtext'
import { AlertFacade } from '../../../domains/project/alert/data/state/alert.facade'
import { AlertDto } from '../../../domains/project/alert/data/dto/alert.dto'

enum CommunicationModulableFieldEnum {
    MOVEMENT = 'movement',
    ALERT = 'alert',
}

enum AlertModulableFieldEnum {
    SELECT = 'SELECT',
    NEW = 'NEW',
}

@Component( {
    selector: 'app-communication-form',
    standalone: true,
    imports: [
        Button,
        Card,
        FormFieldErrorComponent,
        FormsModule,
        Textarea,
        TranslatePipe,
        ReactiveFormsModule,
        Menu,
        Ripple,
        AutoComplete,
        DateFormatPipe,
        Divider,
        InputText,
    ],
    templateUrl: './communication-form.component.html',
    styleUrl: './communication-form.component.scss',
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
        this.handleAlertSelection( GenericUtil.nonNull( this.initialAlert() ) ? AlertUtil.toSelectItem(
            this.initialAlert()!,
            this.classicDatePipe,
        ) : undefined )
    }

    private setMovementIfNecessary (): void {
        this.movement.patchValue( this.initialMovement()?.id )
        this.handleMovementSelection( GenericUtil.nonNull( this.initialMovement() ) ? MovementUtil.toActivitySelectItem(
            this.initialMovement()!,
            this.classicDatePipe,
        ) : undefined )
    }

    protected override loadData (): void {
        this.facade.resetCommunication()

        if (GenericUtil.nonNull( this.idParam )) {
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
            const movement: SelectItem<MovementModel> = MovementUtil.toActivitySelectItem(
                element.movement,
                this.classicDatePipe,
            )
            this.movement.patchValue( movement )
            this.handleMovementSelection( movement )
            this.movement.disable()
        }

        if (element?.alert) {
            const alert: SelectItem<AlertModel> = AlertUtil.toSelectItem(
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
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
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
        const observable: Observable<CreateCommunication | UpdateCommunication> =
            this.facade.communication()
            ? this.facade.updateCommunication( this.facade.communication()!.id!, dto )
            : this.facade.createCommunication( dto )

        this.subscriptions.add(
            observable.pipe(
                tap( (): void => this.resetForm() ),
            ).subscribe(),
        )
    }

    private submitAlert (): void {
        const dto: AlertDto = this.buildAlertDto()

        this.subscriptions.add(
            this.alertFacade.createAlert( dto ).pipe(
                tap( (): void => this.resetForm() ),
            ).subscribe(),
        )
    }

    protected override buildDto (): CommunicationDto {
        const dateTime: Date = GenericUtil.nonNull( this.facade.communication()?.dateTime )
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
        const dateTime: Date = GenericUtil.nonNull( this.facade.communication()?.dateTime )
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
                    return GenericUtil.isNull( this.initialAlert() ) && ProjectUtil.hasOption(
                        this.registryFacade.selectedProject(),
                        ProjectOptionEnum.ALERT,
                    )
                case action.id === CommunicationModulableFieldEnum.MOVEMENT:
                    return GenericUtil.isNull( this.initialMovement() )
                default:
                    return true
            }
        } ).map( (action: MenuItem): MenuItem => ({
            ...action,
            disabled: action.disabled || (action.id === CommunicationModulableFieldEnum.ALERT && GenericUtil.nonNull(
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
