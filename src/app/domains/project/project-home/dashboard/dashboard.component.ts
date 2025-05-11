import { Component, computed, inject, Signal } from '@angular/core'
import { Card } from 'primeng/card'
import { Divider } from 'primeng/divider'
import { MessageComponent } from '../../../../shared/util-ui/message/message.component'
import { PluralTranslationPipe } from '../../../../shared/util-tool/pipe/plural-translation.pipe'
import { Skeleton } from 'primeng/skeleton'
import { TranslatePipe } from '@ngx-translate/core'
import { ProjectOptionEnum } from '../../../../shared/util-model/enumeration/project-option.enum'
import { ProjectUtil } from '../../../../shared/util-tool/util/project.util'
import { GenericComponent } from '../../../../shared/util-tool/component/generic.component'
import { ProjectFacade } from '../../data/state/project.facade'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'
import { Panel } from 'primeng/panel'

@Component( {
    selector: 'app-dashboard',
    imports: [
        Card,
        Divider,
        MessageComponent,
        PluralTranslationPipe,
        Skeleton,
        TranslatePipe,
        Panel,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
} )
export class DashboardComponent extends GenericComponent {
    protected readonly projectFacade: ProjectFacade = inject( ProjectFacade )

    protected readonly ProjectUtil: typeof ProjectUtil = ProjectUtil
    protected readonly ProjectOptionEnum: typeof ProjectOptionEnum = ProjectOptionEnum

    protected readonly totalParticipants: Signal<number | undefined>
    protected readonly totalGuests: Signal<number | undefined>
    protected readonly totalPresentRegistered: Signal<number | undefined>
    protected readonly totalAbsentRegistered: Signal<number | undefined>
    protected readonly totalVehicles: Signal<number | undefined>
    protected readonly totalPresentVehicles: Signal<number | undefined>
    protected readonly totalAbsentVehicles: Signal<number | undefined>

    public constructor () {
        super()

        this.projectFacade.fetchParticipantsStatus( false )
        this.projectFacade.fetchVehiclesStatus( false )

        this.totalParticipants = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.participantsStatus() )) return undefined
            return this.projectFacade.participantsStatus()!.guests
                   + this.projectFacade.participantsStatus()!.registered.presentMajors
                   + this.projectFacade.participantsStatus()!.registered.presentMinors
                   + this.projectFacade.participantsStatus()!.registered.absentMajors
                   + this.projectFacade.participantsStatus()!.registered.absentMinors
        } )

        this.totalGuests = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.participantsStatus() )) return undefined
            return this.projectFacade.participantsStatus()!.guests
        } )

        this.totalPresentRegistered = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.participantsStatus() )) return undefined
            return this.projectFacade.participantsStatus()!.registered.presentMajors
                   + this.projectFacade.participantsStatus()!.registered.presentMinors
        } )

        this.totalAbsentRegistered = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.participantsStatus() )) return undefined
            return this.projectFacade.participantsStatus()!.registered.absentMajors
                   + this.projectFacade.participantsStatus()!.registered.absentMinors
        } )

        this.totalVehicles = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.vehiclesStatus() )) return undefined
            return this.projectFacade.vehiclesStatus()!.present
                   + this.projectFacade.vehiclesStatus()!.absent
        } )

        this.totalPresentVehicles = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.vehiclesStatus() )) return undefined
            return this.projectFacade.vehiclesStatus()!.present
        } )

        this.totalAbsentVehicles = computed( (): number | undefined => {
            if (GenericUtil.isNull( this.projectFacade.vehiclesStatus() )) return undefined
            return this.projectFacade.vehiclesStatus()!.absent
        } )
    }
}
