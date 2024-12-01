import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'

export interface ParticipantPageParamsModel extends PageParamsModel {
    isPresent: boolean
    startDate: string | undefined
    endDate: string | undefined
}
