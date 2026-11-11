import { ComponentHarness } from '@angular/cdk/testing';

export interface ProjectFormStepView {
	label: string;
	completed: boolean;
}

/**
 * Objectif: Pilote les étapes du formulaire de projet dans les tests.
 * Périmètre: Lit l'étape active, le libellé accessible et chaque étape (libellé, franchie ou non).
 * Limites: Ne change pas d'étape.
 */
export class ProjectFormStepperHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-form-stepper';

	private readonly stepper = this.locatorFor('sgdf-stepper');
	private readonly stepElements = this.locatorForAll('sgdf-step');

	public async active(): Promise<string> {
		return (await this.stepper()).getProperty<string>('active');
	}

	public async label(): Promise<string> {
		return (await this.stepper()).getProperty<string>('label');
	}

	public async steps(): Promise<ProjectFormStepView[]> {
		return Promise.all(
			(await this.stepElements()).map(async (step) => ({
				label: (await step.text()).trim(),
				completed: await step.getProperty<boolean>('completed'),
			})),
		);
	}
}
