/**
 * Component config, we use BANO API
 */
const config = {
	endpoint: {
		url: "https://api-adresse.data.gouv.fr/search/",
		query_parm: 'q',
		type: 'get', // HTTP request type
		arraydata: 'features', // Objet name which contain list of result, if equal '.' whe take response as list,
		whereisdata: 'properties', //Oobjet name which contain attributes or '.' ,
		autocomplete_field: 'label', // Field of properties, we use this field to select proposition. We can use ',' as separator to display in autocomplete more than one field value,
		enable: true // If enable, do query and get data, else data should be to set manually by user
	},
	attributes: {
		// Set attribute in order
		housenumber: {
			readonly: false, // If true readonly
			required: false, // If true set field required on create or update
			addInForm: true, // If true add it in form
			type: 'string', // Type of field, must be html type, default text,
			maxLength: '',
			apiField: 'housenumber', // Attribute name in data, means this attribute must exist in data, whe use it for db column name
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "string",
				defaultValue: null
			},
			lang: {
				fr: 'Numéro rue',
				en: 'Street number'
			}
		},
		street: {
			readonly: false,
			required: false,
			addInForm: true,
			type: 'text', //
			maxLength: '',
			apiField: 'street',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "string",
				defaultValue: null
			},
			lang: {
				fr: 'Nom rue',
				en: 'Street name'
			}
		},
		complement1: {
			readonly: false,
			required: false,
			addInForm: true,
			type: 'text', //
			max: '',
			apiField: 'complement1',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "string",
				defaultValue: null
			},
			lang: {
				fr: 'Complément rue',
				en: 'Street complement'
			}
		},
		postcode: {
			readonly: false,
			required: false,
			addInForm: true,
			type: 'text',
			maxLength: '5',
			minLength: '',
			pattern: "[0-9]{5}",
			apiField: 'postcode',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "string",
				defaultValue: null
			},
			lang: {
				fr: 'Code postal',
				en: 'Zipcode'
			}
		},
		city: {
			readonly: false,
			required: false,
			addInForm: true,
			type: 'text',
			max: '',
			apiField: 'city',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "string",
				defaultValue: null
			},
			lang: {
				fr: 'Ville',
				en: 'City'
			}
		},
		country: {
			readonly: false,
			required: false,
			addInForm: true,
			type: 'text',
			max: '',
			apiField: 'country',
			defaultValue: 'FRANCE',
			sql: {
				type: 'STRING',
				newmipsType: "string",
				defaultValue: null
			},
			lang: {
				fr: 'Pays',
				en: 'Country'
			}
		},
		lat: {
			readonly: false,
			required: false,
			addInForm: true,
			type: {
				create: 'hidden',
				update: '',
				show: 'hidden'
			},
			max: '',
			apiField: '',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "double",
				defaultValue: null
			},
			lang: {
				fr: 'Latitude',
				en: 'Latitude'
			}
		},
		lon: {
			readonly: false,
			required: false,
			addInForm: true,
			type: {
				create: 'hidden',
				update: '',
				show: 'hidden'
			},
			max: '',
			apiField: '',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "double",
				defaultValue: null
			},
			lang: {
				fr: 'Longitude',
				en: 'Longitude'
			}
		},
		label: {
			readonly: false,
			required: false,
			addInForm: true,
			type: 'hidden',
			max: '',
			apiField: 'label',
			defaultValue: '',
			sql: {
				type: 'STRING',
				newmipsType: "STRING",
				defaultValue: null
			},
			lang: {
				fr: 'Libellé',
				en: 'Label'
			}
		},
		//house type
		place: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'hidden',
			max: '',
			apiField: 'place',
			defaultValue: '',
			sql: {
				type: 'STRING'
			},
			lang: {
				fr: 'Lieu dit',
				en: 'Place'
			}
		},
		complement2: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'text',
			max: ''
		},
		complement3: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'text',
			max: ''
		},
		state: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'text',
			max: '',
		},
		type: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'text',
			max: ''
		},
		village: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'text',
			max: ''
		},
		description: {
			readonly: false,
			required: false,
			addInForm: false,
			type: 'textarea',
			max: ''
		}
	}
};
module.exports = config;