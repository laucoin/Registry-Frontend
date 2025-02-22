import { Component, OnInit, signal, Signal } from '@angular/core'
import { Observable } from 'rxjs'
import { EventProfileFacade } from '../../data/state/event-profile.facade'
import { AppRouteEnum } from '../../../../app-route.enum'
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { EventProfileDto } from '../../data/dto/event-profile.dto'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { Params } from '@angular/router'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { TranslateModule } from '@ngx-translate/core'
import { AsyncPipe, DatePipe } from '@angular/common'
import { CardModule } from 'primeng/card'
import { DropdownModule } from 'primeng/dropdown'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { UserElementComponent } from '../../../user/user-element/user-element.component'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'
import { GenericEventProfileFormComponent } from '../generic-event-profile-form.component'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { Button } from 'primeng/button'
import { Select } from 'primeng/select'
import { DatePicker } from 'primeng/datepicker'
import { StringUtils } from '../../../../shared/util-tool/util/string.util'
import { DateUtil } from '../../../../shared/util-tool/util/date.util'

@Component( {
    selector: 'app-event-profile-edition-form',
    standalone: true,
    imports: [
        TranslateModule,
        AsyncPipe,
        CardModule,
        ReactiveFormsModule,
        DropdownModule,
        FormFieldErrorComponent,
        UserElementComponent,
        FormComponent,
        RegistryRequiredDirective,
        Button,
        Select,
        DatePicker,
        DatePipe,
    ],
    templateUrl: './event-profile-edition-form.component.html',
} )
export class EventProfileEditionFormComponent extends GenericEventProfileFormComponent implements OnInit {
    protected readonly profile$: Observable<EventProfileModel | undefined>

    protected readonly startDateExample: Signal<Date> = signal( DateUtil.startDateExample )
    protected readonly endDateExample: Signal<Date> = signal( DateUtil.endDateExample )

    public constructor (protected override readonly facade: EventProfileFacade) {
        super( facade )

        this.profile$ = facade.eventProfile
    }

    public ngOnInit (): void {
        this.handleIdParam()

        this.handleLoadedProfile()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            role: this.formBuilder.control( undefined, Validators.required ),
            range: this.formBuilder.control( undefined ),
        } )
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.PROFILES )) {
            return
        }
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( AppRouteEnum.PROFILES_INVITATION ).catch( console.error )
                }
                this.facade.fetchEventProfile( params['id'] )
            } ),
        )
    }

    private handleLoadedProfile (): void {
        this.subscriptions.add(
            this.profile$.subscribe(
                (profile: EventProfileModel | undefined): void => {
                    this.role.setValue( profile?.role.value )
                    this.range.setValue( FormUtil.buildDateRange( profile?.startAccess, profile?.endAccess ) )
                    FormUtil.markAllControlsAsDirty( this.form )
                } ),
        )
    }

    protected next (): void {
        const profile: EventProfileDto = {
            role: this.role.value,
            startAccess: this.range.value?.[0],
            endAccess: this.range.value?.[1],
        }

        this.subscriptions.add(
            this.facade.updateEventProfile( this.route.snapshot.params['id'], profile )
                .subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }
}
