import { Component, OnInit } from '@angular/core'
import { GenericEventFormComponent } from '../generic-event-form.component'
import { EventDto } from '../../data/dto/event.dto'
import { TranslateModule } from '@ngx-translate/core'
import { ReactiveFormsModule } from '@angular/forms'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common'
import { InputTextModule } from 'primeng/inputtext'
import { DividerModule } from 'primeng/divider'
import { Params } from '@angular/router'
import { AppRouteEnum } from '../../../../app-route.enum'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { filter, mergeMap, Observable } from 'rxjs'
import { CardModule } from 'primeng/card'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { RegistryRequiredDirective } from '../../../../shared/util-tool/directive/registry-required.directive'
import { Button } from 'primeng/button'
import { DatePicker } from 'primeng/datepicker'
import { ToggleSwitch } from 'primeng/toggleswitch'
import { StringUtils } from '../../../../shared/util-tool/util/string.util'
import { EventOptionModel } from '../../data/model/event-option.model'
import { SelectItem } from 'primeng/api'

@Component( {
    selector: 'app-event-edition-form',
    standalone: true,
    imports: [
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        DatePipe,
        InputTextModule,
        DividerModule,
        AsyncPipe,
        ProgressSpinnerModule,
        CardModule,
        RegistryRequiredDirective,
        Button,
        DatePicker,
        ToggleSwitch,
        NgForOf,
        NgIf,
    ],
    templateUrl: './event-edition-form.component.html',
    styleUrl: './event-edition-form.component.scss',
} )
export class EventEditionFormComponent extends GenericEventFormComponent implements OnInit {
    protected readonly event$: Observable<EventModel | undefined> = this.facade.element

    public ngOnInit (): void {
        this.facade.resetElement()

        this.handleIdParam()

        this.handleLoadedEvent()
    }

    private handleIdParam (): void {
        if (!StringUtils.isRouteActive( AppRouteEnum.EVENTS )) {
            return
        }
        this.subscriptions.add(
            this.eventOptions$.pipe(
                filter( (options: EventOptionModel[]): boolean => options && options.length > 0 ),
                mergeMap( (): Observable<Params> => this.route.params ),
            ).subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( AppRouteEnum.EVENTS_CREATION ).catch( console.error )
                }
                this.facade.fetchElement( params['id'] )
            } ),
        )
    }

    private handleLoadedEvent (): void {
        this.subscriptions.add(
            this.event$.subscribe( (event: EventModel | undefined): void => {
                if (!event) return
                this.name.setValue( event?.name )
                this.range.setValue( FormUtil.buildDateRange( event?.begin, event?.end ) )
                this.fillFormWithOptions( event?.options )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    private fillFormWithOptions (options: SelectItem<string>[] | undefined): void {
        options?.forEach( (option: SelectItem<string>): void => {
            this.getOptionControl( option.value ).setValue( true )
        } )
    }

    protected next (): void {
        const event: EventDto = {
            name: this.name.value,
            begin: this.range.value?.[0],
            end: this.range.value?.[1],
            options: this.buildOptions(),
        }

        this.subscriptions.add(
            this.facade.updateElement( this.route.snapshot.params['id'], event )
                .subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }
}
