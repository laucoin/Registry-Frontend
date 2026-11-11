import type { SgdfStatusVariant } from '@sgdf/ui';

import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

const STATUS_VARIANTS: Record<PresenceStatusEnum, SgdfStatusVariant> = {
	[PresenceStatusEnum.IN]: 'success',
	[PresenceStatusEnum.OUT]: 'warning',
	[PresenceStatusEnum.OVERDUE]: 'danger',
	[PresenceStatusEnum.UNAVAILABLE]: 'neutral',
};

function groupNames(groups: GroupModel[] | undefined): string | undefined {
	return groups?.length ? groups.map((group) => group.name).join(', ') : undefined;
}

/**
 * Objectif: Transforme les participants et les véhicules en lignes des listes de suivi.
 * Périmètre: Choisit le titre, la description et la couleur du statut de présence, pour que chaque liste affiche un statut de la même façon.
 * Limites: Fonctions pures ; le libellé du statut vient du backend et n'est jamais traduit ici.
 */
export const MonitoringRowHelper = {
	statusVariant(status: PresenceStatusEnum | undefined): SgdfStatusVariant {
		return status ? (STATUS_VARIANTS[status] ?? 'neutral') : 'neutral';
	},

	fullName(participant: ParticipantModel): string {
		return [participant.firstName, participant.lastName?.toUpperCase()].filter(Boolean).join(' ');
	},

	participantDetail(participant: ParticipantModel): string | undefined {
		return groupNames(participant.groups) ?? participant.type?.label;
	},

	fromParticipant(participant: ParticipantModel): MonitoringRowModel {
		return {
			id: participant.id,
			title: MonitoringRowHelper.fullName(participant),
			subtitle: MonitoringRowHelper.participantDetail(participant),
			statusLabel: participant.status?.label,
			statusVariant: MonitoringRowHelper.statusVariant(participant.status?.value),
			icon: 'user',
			overdue: participant.status?.value === PresenceStatusEnum.OVERDUE,
		};
	},

	fromVehicle(vehicle: VehicleModel): MonitoringRowModel {
		return {
			id: vehicle.id,
			title: [vehicle.brand, vehicle.model].filter(Boolean).join(' '),
			subtitle: vehicle.licensePlate,
			statusLabel: vehicle.status.label,
			statusVariant: MonitoringRowHelper.statusVariant(vehicle.status.value),
			icon: 'car',
		};
	},
} as const;
