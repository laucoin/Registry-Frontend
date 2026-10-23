import '@sgdf/ui/table'
import '@sgdf/ui/table-row'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/icon'
import '@sgdf/ui/tag'
import '@sgdf/ui/button'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/avatar'
import '@sgdf/ui/tab-group'
import '@sgdf/ui/badge'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

interface MonitoringItem {
	title: string
	description: string
	status: string
	overdue?: boolean
	communicable?: boolean
}

interface MonitoringTab {
	key: string
	icon: string
	count: number
	items: MonitoringItem[]
}

/**
 * Purpose: Tracks what is happening on the project through tabs of activities, movements, people, groups and vehicles.
 * Scope: Displays each tab as a list with the status of its items.
 * Limits: Static placeholder values until the data is plugged; no lazy loading, navigation or communication yet.
 */
@Component({
	imports: [
		TranslocoPipe
	],
	selector: 'app-project-operational-monitoring',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('project-home')],
	styleUrl: './project-operational-monitoring.component.css',
	templateUrl: './project-operational-monitoring.component.html',
})
export class ProjectOperationalMonitoringComponent {
	protected readonly tabs: MonitoringTab[] = [
		{
			key: 'activities', icon: 'bullseye', count: 6, items: [
				{
					title: 'Sortie lac de Paladru',
					description: 'Sortie lac de Paladru · 18 personnes · 2 groupes · 2 véhicules',
					status: 'Secteur Est · depuis 08:15',
					overdue: true,
					communicable: true
				},
				{
					title: 'Ravitaillement intendance',
					description: 'Intendance du camp · 4 personnes · 1 groupe · 1 véhicule',
					status: 'Supermarché Voiron · depuis 09:20',
					communicable: true
				},
				{
					title: 'Visite infirmerie',
					description: 'Suivi santé · 3 personnes · 1 groupe · 1 véhicule',
					status: 'Centre médical · depuis 10:05',
					communicable: true
				},
			]
		},
		{
			key: 'idleMovements', icon: 'car', count: 6, items: [
				{
					title: 'Déplacement équipe technique',
					description: 'Sans activité · 6 personnes · 1 groupe · 1 véhicule',
					status: 'Zone matériel · depuis 09:41',
					communicable: true
				},
				{
					title: 'Courses urgentes',
					description: 'Sans activité · 2 personnes · 1 véhicule',
					status: 'Saint-Laurent · depuis 10:18',
					communicable: true
				},
				{
					title: 'Transfert matériel cuisine',
					description: 'Sans activité · 4 personnes · 1 groupe · 1 véhicule',
					status: 'Hangar nord · terminé à 11:45'
				},
			]
		},
		{
			key: 'individualStatus', icon: 'user', count: 9, items: [
				{ title: 'Camille Renaud', description: 'Inscrite · Responsable santé', status: 'En sortie depuis 09:41' },
				{ title: 'Théo Marchand', description: 'Inscrit · Caravelle Paris', status: 'En sortie depuis 10:05' },
				{ title: 'Dr. Sylvie Bloch', description: 'Invitée · Médecin de secteur', status: 'Présente depuis 10:32' },
			]
		},
		{
			key: 'groupStatus', icon: 'people-group', count: 6, items: [
				{ title: 'Hugo Lemoine', description: 'Équipe intendance · Inscrit · Intendance', status: 'En sortie depuis 09:20' },
				{ title: 'Camille Renaud', description: 'Équipe santé · Inscrite · Responsable santé', status: 'En sortie depuis 09:41' },
				{ title: 'Léa Fontaine', description: 'Équipe territoriale · Inscrite · Responsable d\'unité', status: 'Présente depuis 11:15' },
			]
		},
		{
			key: 'vehicleStatus', icon: 'car', count: 6, items: [
				{ title: 'Minibus 03', description: '9 places · Hugo Lemoine', status: 'En sortie depuis 08:15' },
				{ title: 'Fourgon 12', description: '3 places · Hugo Lemoine', status: 'Présent depuis 07:10' },
				{ title: 'Véhicule santé 01', description: '5 places · Sylvie Bloch', status: 'Présent depuis 11:40' },
			]
		},
	]
}
