export interface CurrentUserModel {
	id: string;
	email: string;
	firstName: string | undefined;
	lastName: string | undefined;
	role: RoleModel;
}

interface RoleModel {
	value: string;
	label: string;
}
