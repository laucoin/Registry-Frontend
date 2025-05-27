import { Component, computed, inject, OnDestroy, Signal } from '@angular/core'
import { SelectedProjectFacade } from '../../data/state/selected-project/selected-project.facade'
import { Carousel, CarouselResponsiveOptions } from 'primeng/carousel'
import { GenericComponent } from '../../../../shared/util-tool/component/generic.component'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { TranslatePipe } from '@ngx-translate/core'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { AlertModel } from '../../../../shared/util-model/model/alert.model'
import { Button } from 'primeng/button'
import { AlertElementComponent } from '../../../../shared/util-ui/alert-element/alert-element.component'
import { RouterLink } from '@angular/router'
import { Subscription, tap } from 'rxjs'
import { AlertFacade } from '../../alert/data/state/alert.facade'

@Component( {
    selector: 'app-current-alerts',
    imports: [
        Carousel,
        DateFormatPipe,
        TranslatePipe,
        Button,
        AlertElementComponent,
        RouterLink,
    ],
    templateUrl: './current-alerts.component.html',
    styleUrl: './current-alerts.component.scss',
} )
export class CurrentAlertsComponent extends GenericComponent implements OnDestroy {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    protected readonly alertFacade: AlertFacade = inject( AlertFacade )

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly carouselBreakpoints: CarouselResponsiveOptions[] = [
        {
            breakpoint: '1200px',
            numVisible: 2,
            numScroll: 1,
        },
        {
            breakpoint: '992px',
            numVisible: 1,
            numScroll: 1,
        },
    ]

    protected readonly hasOtherCurrentAlert: Signal<boolean> = computed( (): boolean => {
        const page: number | undefined = this.facade.currentAlertsPage()?.pageNumber
        const totalPages: number | undefined = this.facade.currentAlertsPage()?.totalPages
        return GenericUtil.nonNull( page ) && GenericUtil.nonNull( totalPages ) ? page! < totalPages! : false
    } )

    protected readonly content: Signal<(AlertModel | undefined)[]> = computed( (): (AlertModel | undefined)[] => {
        const previousContent: AlertModel[] = (this.facade.currentAlertsPage()?.content ?? [])
        return this.hasOtherCurrentAlert() ? [ ...previousContent, undefined ] : previousContent
    } )

    public constructor () {
        super()

        this.handleAlertsActions()
        this.loadData( false )
    }

    private loadData (force: boolean): void {
        this.facade.fetchCurrentAlertsPage( 0, 20, force )
    }

    private handleAlertsActions (): void {
        this.subscriptions.add(
            this.alertFacade.handleAlertChange().pipe(
                tap( (): void => {
                    if ((this.facade.currentAlertsPage()?.content ?? []).length > 0) {
                        this.loadData( true )
                    }
                } ),
            ).subscribe(),
        )
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }
}
