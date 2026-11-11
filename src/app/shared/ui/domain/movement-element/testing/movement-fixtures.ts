import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';

export function person(id: string, major: boolean, poolName?: string, vehicleId?: string): MovementContentModel {
	return {
		poolName,
		participant: { id, firstName: id, lastName: `${id}son`, major },
		vehicle: vehicleId
			? { id: vehicleId, brand: 'Renault', model: 'Trafic', licensePlate: vehicleId.toUpperCase() }
			: undefined,
	} as unknown as MovementContentModel;
}

export function movementOf(overrides: Partial<MovementModel> = {}): MovementModel {
	return {
		id: 'm1',
		visible: true,
		dateTime: new Date('2026-01-01T10:00:00Z'),
		type: { value: 'IN', label: 'Entrée' },
		reason: undefined,
		lastCommunicationDateTime: undefined,
		content: [person('ada', true, 'car 1', 'v1'), person('bob', false)],
		...overrides,
	} as unknown as MovementModel;
}
