import { environment } from '@gauzy/config';

export const DEFAULT_ORGANIZATION_TEAMS = [
	{
		name: 'Employees',
		defaultMembers: [
			`${environment.demoCredentialConfig.superAdminEmail}`,
			'ruslan@qwerty.co.ke',
			'alish@qwerty.co.ke',
			'julia@qwerty.co.ke'
		],
		manager: ['ruslan@qwerty.co.ke']
	},
	{
		name: 'Contractors',
		defaultMembers: [			
			'ckhandla94@gmail.com'
		],
		manager: ['ruslan@qwerty.co.ke']
	},
	{
		name: 'Designers',
		defaultMembers: ['julia@qwerty.co.ke'],
		manager: []
	},
	{
		name: 'QA',
		defaultMembers: ['julia@qwerty.co.ke'],
		manager: []
	}
];
