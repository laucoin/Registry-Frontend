import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'

/**
 * Purpose: Présente les mouvements.
 * Scope: Fusionne les contenus chargés dans une page de mouvements, construit les options d'activité et répartit adultes, enfants et bassins.
 * Limits: Aucun état ; ne charge pas les contenus.
 */
export class MovementHelper {
    public static rebuildPageWithContent (
        movements: MovementModel[],
        contents: PairModel<MovementContentModel[]>[],
    ): MovementModel[] {
        return movements.map( (movement: MovementModel): MovementModel => ({
            ...movement,
            content: contents.find( (content: PairModel<MovementContentModel[]>): boolean => content.first === movement.id )?.second ?? movement.content ?? [],
        }) )
    }

    public static toActivitySelectItem (movement: MovementModel, datePipe: DateFormatPipe): SelectOptionModel<MovementModel> {
        return {
            label: `${movement.reason?.label} (${datePipe.transform( movement.dateTime, 'datetime' )})`,
            value: movement,
        }
    }

    public static getAdults (movement: MovementModel): MovementContentModel[] {
        return movement.content.filter( (content: MovementContentModel): boolean => content.participant.major )
    }

    public static getChildren (movement: MovementModel): MovementContentModel[] {
        return movement.content.filter( (content: MovementContentModel): boolean => !content.participant.major )
    }

    public static getPools (movement: MovementModel): Record<string, MovementContentModel[]> {
        return movement.content.reduce(
            (
                grouped: Record<string, MovementContentModel[]>,
                item: MovementContentModel,
            ): Record<string, MovementContentModel[]> => {
                if (item.poolName) {
                    if (!grouped[item.poolName]) {
                        grouped[item.poolName] = []
                    }
                    grouped[item.poolName].push( item )
                }
                return grouped
            }, {} as Record<string, MovementContentModel[]>,
        )
    }
}
