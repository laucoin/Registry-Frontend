import { MovementModel } from '../../util-model/model/movement.model'
import { PairModel } from '../../util-model/model/pair.model'
import { MovementContentModel } from '../../util-model/model/movement-content.model'

export class MovementUtil {
    public static rebuildPageWithContent (
        movements: MovementModel[],
        contents: PairModel<MovementContentModel[]>[],
    ): MovementModel[] {
        return movements.map( (movement: MovementModel): MovementModel => ({
            ...movement,
            content: contents.find( (content: PairModel<MovementContentModel[]>): boolean => content.first === movement.id )?.second ?? [],
        }) )
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

    public static getDrivers (movement: MovementModel): MovementContentModel[] {
        return movement.content.filter( (content: MovementContentModel): boolean => !content.participant.major )
    }
}
