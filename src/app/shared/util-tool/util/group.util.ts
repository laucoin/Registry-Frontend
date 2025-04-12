import { GroupModel } from '../../util-model/model/group.model'
import { SelectItem } from 'primeng/api'
import { PairModel } from '../../util-model/model/pair.model'
import { ParticipantModel } from '../../util-model/model/participant.model'

export class GroupUtil {
    public static toSelectItem (group: GroupModel): SelectItem<GroupModel> {
        return {
            label: group.name,
            value: group,
        }
    }

    public static rebuildPageWithMembers (
        groups: GroupModel[],
        members: PairModel<ParticipantModel[]>[],
    ): GroupModel[] {
        return groups.map( (group: GroupModel): GroupModel => ({
            ...group,
            members: members.find( (content: PairModel<ParticipantModel[]>): boolean => content.first === group.id )?.second ?? [],
        }) )
    }

    public static getAdults (group: GroupModel): ParticipantModel[] {
        return group.members.filter( (member: ParticipantModel): boolean => member.major )
    }

    public static getChildren (group: GroupModel): ParticipantModel[] {
        return group.members.filter( (member: ParticipantModel): boolean => !member.major )
    }
}
