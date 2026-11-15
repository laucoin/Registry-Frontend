import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export interface MovementReasonResponseDto extends SelectOptionModel<string> {
	type?: MovementTypeEnum;
	kind: MovementReasonKindEnum;
}
