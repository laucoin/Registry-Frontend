import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core'
import { Card } from 'primeng/card'
import { Divider } from 'primeng/divider'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'
import { Skeleton } from 'primeng/skeleton'
import { TranslatePipe } from '@ngx-translate/core'
import { GenericComponent } from '../../../../shared/util-tool/component/generic.component'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { SelectedProjectFacade } from '../../data/state/selected-project/selected-project.facade'
import { Panel } from 'primeng/panel'
import { ElementCardComponent } from '../../../../shared/util-ui/element-card/element-card.component'
import { SeverityCircleComponent } from '../../../../shared/util-ui/severity-circle/severity-circle.component'
import { SeverityTagComponent } from '../../../../shared/util-ui/severity-tag/severity-tag.component'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { DateFormatPipe } from '../../../../shared/util-tool/pipe/date-format.pipe'
import { ParticipantTypeEnum } from '../../../../shared/util-model/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '../../../../shared/util-model/enumeration/presence-status.enum'
import {
    SeverityInformationComponent,
} from '../../../../shared/util-ui/severity-information/severity-information.component'

@Component( {
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        Card,
        Divider,
        PluralTranslationPipe,
        Skeleton,
        TranslatePipe,
        Panel,
        ElementCardComponent,
        SeverityCircleComponent,
        SeverityTagComponent,
        TitleCasePipe,
        UpperCasePipe,
        DateFormatPipe,
        SeverityInformationComponent,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
} )
export class DashboardComponent extends GenericComponent {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )

    protected readonly ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum
    protected readonly PresenceStatusEnum: typeof PresenceStatusEnum = PresenceStatusEnum

    protected readonly totalParticipants: Signal<number | undefined>
    protected readonly totalGuests: Signal<number | undefined>
    protected readonly totalPresentRegistered: Signal<number | undefined>
    protected readonly totalAbsentRegistered: Signal<number | undefined>
    protected readonly totalVehicles: Signal<number | undefined>
    protected readonly totalPresentVehicles: Signal<number | undefined>
    protected readonly totalAbsentVehicles: Signal<number | undefined>

    public constructor () {
        super()

        this.facade.loadProjectHomeInformation( false )

        this.totalParticipants = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.guests
                   + this.facade.participantsStatus()!.registered.presentMajors
                   + this.facade.participantsStatus()!.registered.presentMinors
                   + this.facade.participantsStatus()!.registered.absentMajors
                   + this.facade.participantsStatus()!.registered.absentMinors
        } )

        this.totalGuests = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.guests
        } )

        this.totalPresentRegistered = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.registered.presentMajors
                   + this.facade.participantsStatus()!.registered.presentMinors
        } )

        this.totalAbsentRegistered = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.registered.absentMajors
                   + this.facade.participantsStatus()!.registered.absentMinors
        } )

        this.totalVehicles = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.vehiclesStatus() )) return undefined
            return this.facade.vehiclesStatus()!.present
                   + this.facade.vehiclesStatus()!.absent
        } )

        this.totalPresentVehicles = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.vehiclesStatus() )) return undefined
            return this.facade.vehiclesStatus()!.present
        } )

        this.totalAbsentVehicles = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.facade.vehiclesStatus() )) return undefined
            return this.facade.vehiclesStatus()!.absent
        } )
    }
}
