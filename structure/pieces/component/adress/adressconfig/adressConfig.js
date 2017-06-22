/**
 * Enable elements to addInForm on component
 */

var config = {
    endpoint: {
        url: "https://api-adresse.data.gouv.fr/search/",
        query_parm: 'q',
        type: 'get',//HTTP request type
        arraydata: 'features', //objet name which contain list of result, if equal '.' whe take response as list, 
        whereisdata: 'properties', //objet name which contain attributes or '.' , 
        autocomplete_field:'label',//field of properties, we use this field to select proposition. We can use ',' as separator to display in autocomplete more than one field value,
        enable: true//If  enable, do query and get data, else data should be to set manually by user
    },
    language: 'fr',
    attributes: {
        //set attribute in order
        housenumber: {
            readonly: true, //if true edit it
            required: true, //if true set field required on create or update
            addInForm: true, //if true add it in form
            type: 'number', //type of field,  must be html type, default input,
            maxLength: '',
            label: 'housenumber', //attribute name in data, means this attribute must exist in data, whe use it for db column name 
            sql: {
                type: 'INTEGER'
            },
            lang: {
                fr: 'Numéro rue',
                en: 'Street number'
            }
        },
        street: {
            readonly: true,
            required: true,
            addInForm: true,
            type: 'text', //
            maxLength: '',
            label: 'street',
            sql: {
                type: 'STRING'
            },
            lang: {
                fr: 'Nom rue',
                en: ''
            }
        },
        postcode: {
            readonly: true,
            required: true,
            addInForm: true,
            type: 'number', //
            maxLength: '5',
            minLength: '5',
            label: 'postcode',
            sql: {
                type: 'INTEGER'
            },
            lang: {
                fr: 'Code postal',
                en: 'zipcode'
            }
        },
        city: {
            readonly: true,
            required: true,
            addInForm: true,
            type: 'text', //
            max: '',
            dataName: 'city',
            label: 'city',
            sql: {
                type: 'STRING'

            },
            lang: {
                fr: 'Ville',
                en: 'City'
            }
        },
        complement1: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //
            max: '',
            label: 'complement1',
            sql: {
                type: 'STRING'
            },
            lang: {
                fr: 'complement1',
                en: 'complement1'
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
        country: {
            readonly: true,
            required: false,
            addInForm: false,
            type: 'text', //
            max: '',
            lang: '',
            dataName: 'country'
        },
        state: {
            readonly: true,
            required: true,
            addInForm: false,
            type: 'text', //
            max: '',
            dataName: 'state'
        },
        type: {
            readonly: false,
            required: false,
            addInForm: false,
            type: 'text', //

            max: ''
        }, //house type
        place: {
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
            max: '',
        }

    }

};
module.exports = config;