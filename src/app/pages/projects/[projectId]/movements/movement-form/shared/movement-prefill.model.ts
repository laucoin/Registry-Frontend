import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'

/**
 * Purpose: Ce avec quoi démarre un formulaire de mouvement ouvert depuis l'accueil du projet.
 * Scope: Le type, le motif et les participants connus d'un mouvement prévu ou d'une présence à régulariser.
 * Limits: Ne porte aucune date ; le formulaire garde l'heure courante.
 */
export interface MovementPrefillModel {
    type: MovementTypeEnum
    reason: MovementReasonModel | undefined
    content: MovementContentModel[]
}
