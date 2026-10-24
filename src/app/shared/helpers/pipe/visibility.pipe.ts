import { Pipe, PipeTransform } from '@angular/core'
import { GenericModel } from '@shared/models/model/generic.model'
import { GenericHelper } from '@shared/helpers/generic.helper'

/**
 * Purpose: Donne la clé de traduction de la visibilité d'un élément.
 * Scope: Ajoute visible.true ou visible.false à un préfixe optionnel.
 * Limits: Renvoie une clé ; la traduction est faite par l'appelant.
 */
@Pipe( {
    name: 'visibilityName', standalone: true,
} )
export class VisibilityNamePipe<T extends GenericModel> implements PipeTransform {
    public transform (value: T | undefined, prefix: string | undefined): string {
        const formattedPrefix: string = prefix ? `${prefix}.` : ''
        return formattedPrefix + (GenericHelper.isNull( value ) || !value?.visible ? 'visible.false' : 'visible.true')
    }
}
