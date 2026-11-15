import { BaseModel } from '@shared/models/model/base.model';

export interface InvitedUserModel extends BaseModel {
	firstName: string | undefined;
	lastName: string | undefined;
	email: string;
}
