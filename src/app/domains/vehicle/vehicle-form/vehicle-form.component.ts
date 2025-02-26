import { Component, Input, Signal, signal, WritableSignal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { VehicleFacade } from '../data/state/vehicle.facade'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { VehicleDto } from '../data/dto/vehicle.dto'
import { AsyncPipe, DatePipe } from '@angular/common'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule } from '@ngx-translate/core'
import { Params } from '@angular/router'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { VehicleModel } from '../../../shared/util-model/model/vehicle.model'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { DatePicker } from 'primeng/datepicker'
import { StringUtils } from '../../../shared/util-tool/util/string.util'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { InputMask } from 'primeng/inputmask'

@Component( {
    selector: 'app-vehicle-form',
    standalone: true,
    imports: [
        AsyncPipe,
        Button,
        CardModule,
        DatePipe,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        TranslateModule,
        ReactiveFormsModule,
        RegistryRequiredDirective,
        DatePicker,
        InputMask,

    ],
    templateUrl: './vehicle-form.component.html',
} )
export class VehicleFormComponent extends GenericFormComponent {
    @Input() public showTitle: boolean = true
    protected readonly vehicle: WritableSignal<VehicleModel | undefined> = signal( undefined )

    protected readonly startDateExample: Signal<Date> = signal( DateUtil.startDateExample )
    protected readonly endDateExample: Signal<Date> = signal( DateUtil.endDateExample )

    public constructor (
        protected readonly facade: VehicleFacade,
        private readonly datePipe: DatePipe,
    ) {
        super(
            AppRouteEnum.VEHICLES,
            facade.vehicleLoading,
        )

        facade.resetVehicle()

        this.handleContextEvent()
        this.handleIdParam()
        this.handleLoadedVehicle()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            registration: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.max( 20 ), CustomValidators.nonBlank() ],
            ),
            brand: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.max( 150 ), CustomValidators.nonBlank() ],
            ),
            model: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.max( 150 ), CustomValidators.nonBlank() ],
            ),
            presence: this.formBuilder.control( [] ),
            usable: this.formBuilder.control(
                true,
                [ Validators.required ],
            ),
        } )
    }

    private handleContextEvent (): void {
        this.subscriptions.add(
            this.contextEvent$.subscribe( (event: EventModel | undefined): void => {
                if (event?.begin) {
                    this.presence.addValidators( CustomValidators.minDate(
                        new Date( event?.begin ),
                        this.datePipe.transform(
                            new Date( event?.begin ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
                if (event?.end) {
                    this.presence.addValidators( CustomValidators.maxDate(
                        new Date( event?.end ),
                        this.datePipe.transform(
                            new Date( event?.end ),
                            this.translateService.instant( 'datetime.format.datetime' ),
                        )!,
                    ) )
                }
            } ),
        )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.VEHICLES )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( this.buildUri( AppRouteEnum.VEHICLES_CREATION ) ).catch( console.error )
                } else {
                    this.facade.fetchVehicle( params['id'], this.contextEventId() )
                }
            } ),
        )
    }

    private handleLoadedVehicle (): void {
        this.subscriptions.add(
            this.facade.vehicle?.subscribe( (vehicle: VehicleModel | undefined): void => {
                this.vehicle.set( vehicle )
                if (!vehicle) return
                this.registration.setValue( vehicle?.registration )
                this.brand.setValue( vehicle?.brand )
                this.model.setValue( vehicle?.model )
                this.presence.setValue( FormUtil.buildDateRange( vehicle?.begin, vehicle?.end ) )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    protected next (): void {
        const vehicle: VehicleDto = {
            registration: this.registration.value,
            brand: this.brand.value,
            model: this.model.value,
            begin: this.presence.value?.[0],
            end: this.presence.value?.[1],
        }

        this.subscriptions.add(
            (
                this.vehicle() ?
                this.facade.updateVehicle( this.vehicle()!.id, vehicle, this.contextEventId() )
                               : this.facade.createVehicle( vehicle, this.contextEventId() )
            ).subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }

    protected get registration (): FormControl {
        return this.form.get( 'registration' ) as FormControl
    }

    protected get brand (): FormControl {
        return this.form.get( 'brand' ) as FormControl
    }

    protected get model (): FormControl {
        return this.form.get( 'model' ) as FormControl
    }

    protected get presence (): FormControl {
        return this.form.get( 'presence' ) as FormControl
    }
}
