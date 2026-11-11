import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { VehicleHelper } from '@shared/helpers/vehicle.helper';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { MovementContentModel } from '@shared/models/model/movement-content.model';

import '@sgdf/ui/avatar';
import '@sgdf/ui/button';
import '@sgdf/ui/icon';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/tag';

/**
 * Objectif: Liste les personnes d'un mouvement, avec leur véhicule.
 * Périmètre: Affiche chaque personne et propose, quand c'est permis, de créer son mouvement inverse.
 * Limites: Ne crée rien ; le mouvement parent ouvre le formulaire pré-rempli.
 */
@Component({
	selector: 'app-movement-people',
	imports: [TranslocoPipe, TitleCasePipe, UpperCasePipe, PluralTranslationPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movement-people.component.html',
})
export class MovementPeopleComponent {
	protected readonly VehicleHelper = VehicleHelper;
	protected readonly MovementTypeEnum = MovementTypeEnum;

	public readonly contents = input.required<MovementContentModel[]>();
	public readonly type = input.required<MovementTypeEnum>();
	public readonly canReverse = input(false);

	public readonly reversed = output<MovementContentModel[]>();
}
