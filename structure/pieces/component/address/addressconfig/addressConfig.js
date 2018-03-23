/**
 * Component config, we use BANO API
 */
var config = {
    endpoint: {
        url: "https://api-adresse.data.gouv.fr/search/",
        query_parm: 'q',
        type: 'get', //HTTP request type
        arraydata: 'features', //objet name which contain list of result, if equal '.' whe take response as list, 
        whereisdata: 'properties', //objet name which contain attributes or '.' , 
        autocomplete_field: 'label', //field of properties, we use this field to select proposition. We can use ',' as separator to display in autocomplete more than one field value,
        enable: true//If  enable, do query and get data, else data should be to set manually by user
    },
    attributes: {
        //set attribute in order
        housenumber: {
            readonly: false, //if true readonly
            required: true, //if true set field required on create or update
            addInForm: true, //if true add it in form
            type: 'number', //type of field,  must be html type, default text,
            maxLength: '',
            label: 'housenumber', //attribute name in data, means this attribute must exist in data, whe use it for db column name
            defaultValue: '',
            sql: {
                type: 'INTEGER',
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
            required: true,
            addInForm: true,
            type: 'text', //
            maxLength: '',
            label: 'street',
            defaultValue: '',
            sql: {
                type: 'STRING',
                newmipsType: "string",
                defaultValue: null
            },
            lang: {
                fr: 'Nom rue',
                en: ''
            }
        },
        complement1: {
            readonly: false,
            required: false,
            addInForm: true,
            type: 'text', //
            max: '',
            label: 'complement1',
            defaultValue: '',
            sql: {
                type: 'STRING',
                newmipsType: "string",
                defaultValue: null
            },
            lang: {
                fr: 'Complément rue',
                en: 'complement1'
            }
        },
        postcode: {
            readonly: false,
            required: true,
            addInForm: true,
            type: 'number', //
            maxLength: '',
            minLength: '',
            pattern:"[0-9]{5}",
            label: 'postcode',
            defaultValue: '',
            sql: {
                type: 'INTEGER',
                newmipsType: "string",
                defaultValue: null
            },
            lang: {
                fr: 'Code postal',
                en: 'zipcode'
            }
        },
        city: {
            readonly: false,
            required: true,
            addInForm: true,
            type: 'text', //
            max: '',
            label: 'city',
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
            required: true,
            addInForm: true,
            type: 'text', //
            max: '',
            label: 'country',
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
        //house type
        place: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: '',
            label: 'place',
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
            type: 'text', //
            max: ''
        },
        complement3: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: ''
        },
        state: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: '',
        },
        type: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: ''
        }, //
        village: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: ''
        }, //village
        description: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'textarea', //
            max: ''
        },
        lat: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: ''
        },
        long: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: ''
        }

    }

};
module.exports = config;