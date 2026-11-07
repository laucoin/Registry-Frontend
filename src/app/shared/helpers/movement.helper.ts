import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { PairModel } from '@shared/models/model/pair.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Purpose: Présente les mouvements.
 * Scope: Fusionne les contenus chargés dans une page de mouvements, construit les options d'activité et répartit adultes, enfants et bassins.
 * Limits: Aucun état ; ne charge pas les contenus.
 */
export const MovementHelper = {
	rebuildPageWithContent(movements: MovementModel[], contents: PairModel<MovementContentModel[]>[]): MovementModel[] {
		return movements.map((movement): MovementModel => ({
			...movement,
			content: contents.find((content) => content.first === movement.id)?.second ?? movement.content ?? [],
		}));
	},

	toActivitySelectItem(movement: MovementModel, datePipe: DateFormatPipe): SelectOptionModel<MovementModel> {
		return {
			label: `${movement.reason?.label} (${datePipe.transform(movement.dateTime, 'datetime')})`,
			value: movement,
		};
	},

	getAdults(movement: MovementModel): MovementContentModel[] {
		return movement.content.filter((content) => content.participant.major);
	},

	getChildren(movement: MovementModel): MovementContentModel[] {
		return movement.content.filter((content) => !content.participant.major);
	},

	getIndependent(movement: MovementModel): MovementContentModel[] {
		const hasPool = movement.content.some((content) => !!content.poolName);
		return hasPool ? movement.content.filter((content) => !content.poolName) : [];
	},

	getVehicles(movement: MovementModel): MovementContentModel[] {
		const seen = new Set<string>();
		return movement.content.filter((content) => {
			if (!content.vehicle || seen.has(content.vehicle.id)) return false;
			seen.add(content.vehicle.id);
			return true;
		});
	},

	getPools(movement: MovementModel): Record<string, MovementContentModel[]> {
		const poolNames = [...new Set(movement.content.flatMap((item) => (item.poolName ? [item.poolName] : [])))];
		return Object.fromEntries(
			poolNames.map((name) => [name, movement.content.filter((item) => item.poolName === name)]),
		);
	},
} as const;
