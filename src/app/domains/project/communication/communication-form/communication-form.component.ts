import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../../shared/util-tool/component/generic-form.component'
import { CommunicationModel } from '../data/model/communication.model'
import { CommunicationDto } from '../data/dto/communication.dto'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { RegistryValidators } from '../../../../shared/util-tool/util/registry.validator'
import { map, Observable } from 'rxjs'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { CommunicationFacade } from '../data/state/communication.facade'
import { CreateCommunication, UpdateCommunication } from '../data/state/communication.action'
import { Button } from 'primeng/button'
import { Card } from 'primeng/card'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { FormButtonPipe } from '../../../../shared/util-tool/pipe/form-button.pipe'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { FormIconPipe } from '../../../../shared/util-tool/pipe/form-icon.pipe'
import { FormTitlePipe } from '../../../../shared/util-tool/pipe/form-title.pipe'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { TranslatePipe } from '@ngx-translate/core'
import { DatePicker } from 'primeng/datepicker'
import { Textarea } from 'primeng/textarea'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'
import { CustomDatetimeModel } from '../../../../shared/util-model/model/custom-datetime.model'
import { Divider } from 'primeng/divider'
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete'
import { SelectItem } from 'primeng/api'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { MovementUtil } from '../../../../shared/util-tool/util/movement.util'

@Component( {
    selector: 'app-communication-form',
    standalone: true,
    imports: [
        Button,
        Card,
        DateFormatPipe,
        FormButtonPipe,
        FormComponent,
        FormFieldErrorComponent,
        FormIconPipe,
        FormTitlePipe,
        FormsModule,
        RegistryRequiredDirective,
        TranslatePipe,
        DatePicker,
        ReactiveFormsModule,
        Textarea,
        Divider,
        AutoComplete,
    ],
    templateUrl: './communication-form.component.html',
    styleUrl: './communication-form.component.scss',
} )
export class CommunicationFormComponent extends GenericFormComponent<CommunicationModel, CommunicationDto> implements OnDestroy {
    protected readonly facade: CommunicationFacade = inject( CommunicationFacade )
    protected readonly classicDatePipe: DateFormatPipe = inject( DateFormatPipe )

    protected readonly form: FormGroup
    protected readonly now: Date = new Date()

    protected readonly selectedMovement: WritableSignal<SelectItem<MovementModel> | undefined> = signal( undefined )

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetCommunication()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchCommunication( this.idParam! )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            movement: this.formBuilder.control( undefined, [ Validators.required ] ),
            dateTime: this.formBuilder.control(
                this.now,
                [
                    Validators.required,
                    ...GenericUtil.nonNull( this.registryFacade.selectedProject()?.begin ) ?
                        [
                            RegistryValidators.minDateTime(
                                this.registryFacade.selectedProject()!.begin!,
                                this.datePipe.transform( this.registryFacade.selectedProject()!.begin ),
                            ),
                        ] : [],
                    ...GenericUtil.nonNull( this.registryFacade.selectedProject()?.end ) ?
                        [
                            RegistryValidators.maxDateTime(
                                this.registryFacade.selectedProject()!.end!,
                                this.datePipe.transform( this.registryFacade.selectedProject()!.end ),
                            ),
                        ] : [],
                ],
            ),
            message: this.formBuilder.control(
                undefined,
                [ Validators.required, RegistryValidators.nonBlank(), Validators.maxLength( 250 ) ],
            ),
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            this.facade.communication$.pipe(
                map( (communication: CommunicationModel | undefined): void => {
                    const movementDateTime: CustomDatetimeModel | undefined = DateUtil.toCustomDateTime( communication?.movement?.dateTime )
                    if (movementDateTime) {
                        this.dateTime.addValidators( RegistryValidators.minDateTime(
                            movementDateTime,
                            this.datePipe.transform( movementDateTime ),
                        ) )
                    }

                    this.fillForm( communication )
                } ),
            ).subscribe(),
        )
    }

    protected fillForm (element: CommunicationModel | undefined): void {
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
        this.dateTime.patchValue( new Date( element?.dateTime ) )
        this.message.patchValue( element.message )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
            return
        }

        const dto: CommunicationDto = this.buildDto()
        const observable: Observable<CreateCommunication | UpdateCommunication> =
            this.facade.communication()
            ? this.facade.updateCommunication( this.facade.communication()!.id!, dto )
            : this.facade.createCommunication( dto )

        this.subscriptions.add(
            observable.pipe(
                map( (): void => this.navigateToRedirectUri() ),
            ).subscribe(),
        )
    }

    protected buildDto (): CommunicationDto {
        return {
            dateTime: this.dateTime.value,
            message: this.message.value,
            movementId: this.selectedMovement()!.value.id,
        }
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['communicationId']
    }

    protected handleMovementSelection (selectedMovement: SelectItem<MovementModel> | undefined): void {
        this.selectedMovement.set( selectedMovement )

        const movement: MovementModel | undefined = this.selectedMovement()?.value
        if (GenericUtil.nonNull( movement )) {
            const movementDateTime: CustomDatetimeModel = DateUtil.toCustomDateTime( movement!.dateTime )!
            this.dateTime.addValidators( RegistryValidators.minDateTime(
                movementDateTime,
                this.datePipe.transform( movementDateTime ),
            ) )
        }
    }

    protected handleMovementSearch (searched: AutoCompleteCompleteEvent): void {
        this.facade.searchMovements( searched.query )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get dateTime (): FormControl {
        return this.form.get( 'dateTime' ) as FormControl
    }

    protected get message (): FormControl {
        return this.form.get( 'message' ) as FormControl
    }

    protected get movement (): FormControl {
        return this.form.get( 'movement' ) as FormControl
    }
}
