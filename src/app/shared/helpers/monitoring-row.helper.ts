import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { MonitoringRowModel, MonitoringStatusVariant } from '@shared/models/model/monitoring-row.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

const STATUS_VARIANTS: Record<PresenceStatusEnum, MonitoringStatusVariant> = {
    [ PresenceStatusEnum.IN ]: 'success',
    [ PresenceStatusEnum.OUT ]: 'warning',
    [ PresenceStatusEnum.OVERDUE ]: 'danger',
    [ PresenceStatusEnum.UNAVAILABLE ]: 'neutral',
}

/**
 * Purpose: Turns participants and vehicles into the rows of the monitoring lists.
 * Scope: Picks the title, the description and the color of the presence status, so every list shows a status the same way.
 * Limits: Pure functions; the status label comes from the backend and is never translated here.
 */
export class MonitoringRowHelper {
    public static statusVariant (status: PresenceStatusEnum): MonitoringStatusVariant {
        return STATUS_VARIANTS[ status ] ?? 'neutral'
    }

    public static fromParticipant (participant: ParticipantModel): MonitoringRowModel {
        return {
            id: participant.id,
            title: [ participant.firstName, participant.lastName?.toUpperCase() ].filter( Boolean ).join( ' ' ),
            subtitle: MonitoringRowHelper.groupNames( participant.groups ) ?? participant.type.label,
            statusLabel: participant.status.label,
            statusVariant: MonitoringRowHelper.statusVariant( participant.status.value ),
            icon: 'user',
        }
    }

    public static fromVehicle (vehicle: VehicleModel): MonitoringRowModel {
        return {
            id: vehicle.id,
            title: [ vehicle.brand, vehicle.model ].filter( Boolean ).join( ' ' ),
            subtitle: vehicle.licensePlate,
            statusLabel: vehicle.status.label,
            statusVariant: MonitoringRowHelper.statusVariant( vehicle.status.value ),
            icon: 'car',
        }
    }

    private static groupNames (groups: GroupModel[] | undefined): string | undefined {
        return groups?.length ? groups.map( (group: GroupModel): string => group.name ).join( ', ' ) : undefined
    }
}
