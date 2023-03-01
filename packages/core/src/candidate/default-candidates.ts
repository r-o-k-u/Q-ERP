import { ComponentLayoutStyleEnum, LanguagesEnum } from '@gauzy/contracts';

export const DEFAULT_CANDIDATES = [
	{
		email: 'john@qwerty.co.ke',
		password: '123456',
		firstName: 'John',
		lastName: 'Smith',
		imageUrl: 'assets/images/avatars/alish.jpg',
		candidateLevel: 'D',
		preferredLanguage: LanguagesEnum.ENGLISH,
		preferredComponentLayout: ComponentLayoutStyleEnum.TABLE
	},
	{
		email: 'jaye@qwerty.co.ke',
		password: '123456',
		firstName: 'Jaye',
		lastName: 'Jeffreys',
		imageUrl: 'assets/images/avatars/avatar-default.svg',
		candidateLevel: 'B',
		preferredLanguage: LanguagesEnum.ENGLISH,
		preferredComponentLayout: ComponentLayoutStyleEnum.TABLE
	},
	{
		email: 'kasey@qwerty.co.ke',
		password: '123456',
		firstName: 'Kasey',
		lastName: 'Kraker',
		imageUrl: 'assets/images/avatars/avatar-default.svg',
		candidateLevel: null,
		preferredLanguage: LanguagesEnum.ENGLISH,
		preferredComponentLayout: ComponentLayoutStyleEnum.TABLE
	},
	{
		email: 'norris@qwerty.co.ke',
		password: '123456',
		firstName: 'Norris ',
		lastName: 'Nesbit',
		imageUrl: 'assets/images/avatars/avatar-default.svg',
		candidateLevel: 'A',
		preferredLanguage: LanguagesEnum.ENGLISH,
		preferredComponentLayout: ComponentLayoutStyleEnum.TABLE
	},
	{
		email: 'estella@qwerty.co.ke',
		password: '123456',
		firstName: 'Estella',
		lastName: 'Ennis',
		imageUrl: 'assets/images/avatars/avatar-default.svg',
		candidateLevel: null,
		preferredLanguage: LanguagesEnum.ENGLISH,
		preferredComponentLayout: ComponentLayoutStyleEnum.TABLE
	},
	{
		email: 'greg@qwerty.co.ke',
		password: '123456',
		firstName: 'Greg ',
		lastName: 'Grise',
		imageUrl: 'assets/images/avatars/avatar-default.svg',
		candidateLevel: 'A',
		preferredLanguage: LanguagesEnum.ENGLISH,
		preferredComponentLayout: ComponentLayoutStyleEnum.TABLE
	}
];
