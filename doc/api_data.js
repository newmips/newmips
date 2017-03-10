define({ "api": [
  {
    "type": "get",
    "url": "/api/getToken/",
    "title": "Basic Auth",
    "name": "BearerToken",
    "group": "1_Authentication",
    "description": "<p>To be able to interact with the API, you need to generate a Bearer Token using the /api/getToken/ url. Set your HTTP header like so with basic64 encoding : Authorization clientID:clientSecret</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "ClientID",
            "description": "<p>Generated application's API credentials</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "ClientSecret",
            "description": "<p>Generated application's API credentials</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Bearer Token, required for further API calls</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "BadAuthorizationHeader",
            "description": "<p>There is invalid authorization header or none</p>"
          }
        ],
        "Error 401": [
          {
            "group": "Error 401",
            "optional": false,
            "field": "AuthenticationFailed",
            "description": "<p>Couldn't match clientID/clientSecret with database</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "1_Authentication"
  },
  {
    "type": "delete",
    "url": "/api/abattement/:id?token=TOKEN",
    "title": "6 - Delete abattement",
    "group": "Abattement",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of abattement to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No abattement with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Abattement",
    "name": "DeleteApiAbattementIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/abattement/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of abattement",
    "group": "Abattement",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the abattement to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "categorie",
              "classerepartition"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No abattement with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Abattement",
    "name": "GetApiAbattementIdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/abattement/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch abattement with specified id",
    "group": "Abattement",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of abattement to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "abattement",
            "description": "<p>Object of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.id",
            "description": "<p><code>id</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.version",
            "description": "<p><code>version</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.f_pourcentage",
            "description": "<p><code>f_pourcentage</code> of abattement</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No abattement with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Abattement",
    "name": "GetApiAbattementIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/abattement?token=TOKEN",
    "title": "1 - Fetch multiple abattement",
    "group": "Abattement",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "abattements",
            "description": "<p>List of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattements.id",
            "description": "<p><code>id</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattements.version",
            "description": "<p><code>version</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattements.f_pourcentage",
            "description": "<p><code>f_pourcentage</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Abattement",
    "name": "GetApiAbattementTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/abattement/?token=TOKEN",
    "title": "4 - Create abattement",
    "group": "Abattement",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_pourcentage",
            "description": "<p><code>f_pourcentage</code> of abattement</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_categorie_categorie",
            "description": "<p><code>id</code> of entity categorie to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_classerepartition_classeabattement",
            "description": "<p><code>id</code> of entity classerepartition to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "abattement",
            "description": "<p>Created abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.id",
            "description": "<p><code>id</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.f_pourcentage",
            "description": "<p><code>f_pourcentage</code> of abattement</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create abattement</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Abattement",
    "name": "PostApiAbattementTokenToken"
  },
  {
    "type": "put",
    "url": "/api/abattement/:id?token=TOKEN",
    "title": "5 - Update abattement",
    "group": "Abattement",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the abattement to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_pourcentage",
            "description": "<p>New value of <code>f_pourcentage</code> for abattement</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_categorie_categorie",
            "description": "<p><code>id</code> of entity categorie to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_classerepartition_classeabattement",
            "description": "<p><code>id</code> of entity classerepartition to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "abattement",
            "description": "<p>Updated abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.id",
            "description": "<p><code>id</code> of abattement</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "abattement.f_pourcentage",
            "description": "<p><code>f_pourcentage</code> of abattement</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No abattement with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update abattement</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Abattement",
    "name": "PutApiAbattementIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/adresse/:id?token=TOKEN",
    "title": "6 - Delete adresse",
    "group": "Adresse",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of adresse to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No adresse with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Adresse",
    "name": "DeleteApiAdresseIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/adresse/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch adresse with specified id",
    "group": "Adresse",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of adresse to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "adresse",
            "description": "<p>Object of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "adresse.id",
            "description": "<p><code>id</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "adresse.version",
            "description": "<p><code>version</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_rue",
            "description": "<p><code>f_rue</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_complement1",
            "description": "<p><code>f_complement1</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_complement2",
            "description": "<p><code>f_complement2</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_codepostal",
            "description": "<p><code>f_codepostal</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_ville",
            "description": "<p><code>f_ville</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_pays",
            "description": "<p><code>f_pays</code> of adresse</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No adresse with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Adresse",
    "name": "GetApiAdresseIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/adresse?token=TOKEN",
    "title": "1 - Fetch multiple adresse",
    "group": "Adresse",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "adresses",
            "description": "<p>List of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "adresses.id",
            "description": "<p><code>id</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "adresses.version",
            "description": "<p><code>version</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresses.f_rue",
            "description": "<p><code>f_rue</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresses.f_complement1",
            "description": "<p><code>f_complement1</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresses.f_complement2",
            "description": "<p><code>f_complement2</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresses.f_codepostal",
            "description": "<p><code>f_codepostal</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresses.f_ville",
            "description": "<p><code>f_ville</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresses.f_pays",
            "description": "<p><code>f_pays</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Adresse",
    "name": "GetApiAdresseTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/adresse/?token=TOKEN",
    "title": "4 - Create adresse",
    "group": "Adresse",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_rue",
            "description": "<p><code>f_rue</code> of adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_complement1",
            "description": "<p><code>f_complement1</code> of adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_complement2",
            "description": "<p><code>f_complement2</code> of adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codepostal",
            "description": "<p><code>f_codepostal</code> of adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_ville",
            "description": "<p><code>f_ville</code> of adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_pays",
            "description": "<p><code>f_pays</code> of adresse</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "adresse",
            "description": "<p>Created adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "adresse.id",
            "description": "<p><code>id</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_rue",
            "description": "<p><code>f_rue</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_complement1",
            "description": "<p><code>f_complement1</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_complement2",
            "description": "<p><code>f_complement2</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_codepostal",
            "description": "<p><code>f_codepostal</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_ville",
            "description": "<p><code>f_ville</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_pays",
            "description": "<p><code>f_pays</code> of adresse</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create adresse</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Adresse",
    "name": "PostApiAdresseTokenToken"
  },
  {
    "type": "put",
    "url": "/api/adresse/:id?token=TOKEN",
    "title": "5 - Update adresse",
    "group": "Adresse",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the adresse to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_rue",
            "description": "<p>New value of <code>f_rue</code> for adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_complement1",
            "description": "<p>New value of <code>f_complement1</code> for adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_complement2",
            "description": "<p>New value of <code>f_complement2</code> for adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codepostal",
            "description": "<p>New value of <code>f_codepostal</code> for adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_ville",
            "description": "<p>New value of <code>f_ville</code> for adresse</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_pays",
            "description": "<p>New value of <code>f_pays</code> for adresse</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "adresse",
            "description": "<p>Updated adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "adresse.id",
            "description": "<p><code>id</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_rue",
            "description": "<p><code>f_rue</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_complement1",
            "description": "<p><code>f_complement1</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_complement2",
            "description": "<p><code>f_complement2</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_codepostal",
            "description": "<p><code>f_codepostal</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_ville",
            "description": "<p><code>f_ville</code> of adresse</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "adresse.f_pays",
            "description": "<p><code>f_pays</code> of adresse</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No adresse with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update adresse</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Adresse",
    "name": "PutApiAdresseIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/anneedeclaration/:id?token=TOKEN",
    "title": "6 - Delete anneedeclaration",
    "group": "Anneedeclaration",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of anneedeclaration to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No anneedeclaration with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Anneedeclaration",
    "name": "DeleteApiAnneedeclarationIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/anneedeclaration/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch anneedeclaration with specified id",
    "group": "Anneedeclaration",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of anneedeclaration to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "anneedeclaration",
            "description": "<p>Object of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "anneedeclaration.id",
            "description": "<p><code>id</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "anneedeclaration.version",
            "description": "<p><code>version</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "anneedeclaration.f_annee_",
            "description": "<p><code>f_annee_</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclaration.f_datedebut",
            "description": "<p><code>f_datedebut</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclaration.f_datefin",
            "description": "<p><code>f_datefin</code> of anneedeclaration</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No anneedeclaration with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Anneedeclaration",
    "name": "GetApiAnneedeclarationIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/anneedeclaration?token=TOKEN",
    "title": "1 - Fetch multiple anneedeclaration",
    "group": "Anneedeclaration",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "anneedeclarations",
            "description": "<p>List of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "anneedeclarations.id",
            "description": "<p><code>id</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "anneedeclarations.version",
            "description": "<p><code>version</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "anneedeclarations.f_annee_",
            "description": "<p><code>f_annee_</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclarations.f_datedebut",
            "description": "<p><code>f_datedebut</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclarations.f_datefin",
            "description": "<p><code>f_datefin</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Anneedeclaration",
    "name": "GetApiAnneedeclarationTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/anneedeclaration/?token=TOKEN",
    "title": "4 - Create anneedeclaration",
    "group": "Anneedeclaration",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_annee_",
            "description": "<p><code>f_annee_</code> of anneedeclaration</p>"
          },
          {
            "group": "Body parameters",
            "type": "Date",
            "optional": false,
            "field": "f_datedebut",
            "description": "<p><code>f_datedebut</code> of anneedeclaration</p>"
          },
          {
            "group": "Body parameters",
            "type": "Date",
            "optional": false,
            "field": "f_datefin",
            "description": "<p><code>f_datefin</code> of anneedeclaration</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "anneedeclaration",
            "description": "<p>Created anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "anneedeclaration.id",
            "description": "<p><code>id</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "anneedeclaration.f_annee_",
            "description": "<p><code>f_annee_</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclaration.f_datedebut",
            "description": "<p><code>f_datedebut</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclaration.f_datefin",
            "description": "<p><code>f_datefin</code> of anneedeclaration</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create anneedeclaration</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Anneedeclaration",
    "name": "PostApiAnneedeclarationTokenToken"
  },
  {
    "type": "put",
    "url": "/api/anneedeclaration/:id?token=TOKEN",
    "title": "5 - Update anneedeclaration",
    "group": "Anneedeclaration",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the anneedeclaration to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_annee_",
            "description": "<p>New value of <code>f_annee_</code> for anneedeclaration</p>"
          },
          {
            "group": "Body parameters",
            "type": "Date",
            "optional": false,
            "field": "f_datedebut",
            "description": "<p>New value of <code>f_datedebut</code> for anneedeclaration</p>"
          },
          {
            "group": "Body parameters",
            "type": "Date",
            "optional": false,
            "field": "f_datefin",
            "description": "<p>New value of <code>f_datefin</code> for anneedeclaration</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "anneedeclaration",
            "description": "<p>Updated anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "anneedeclaration.id",
            "description": "<p><code>id</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "anneedeclaration.f_annee_",
            "description": "<p><code>f_annee_</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclaration.f_datedebut",
            "description": "<p><code>f_datedebut</code> of anneedeclaration</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "anneedeclaration.f_datefin",
            "description": "<p><code>f_datefin</code> of anneedeclaration</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No anneedeclaration with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update anneedeclaration</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Anneedeclaration",
    "name": "PutApiAnneedeclarationIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/api_credentials/:id?token=TOKEN",
    "title": "6 - Delete api_credentials",
    "group": "Api_credentials",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of api_credentials to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No api_credentials with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Api_credentials",
    "name": "DeleteApiApi_credentialsIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/api_credentials/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of api_credentials",
    "group": "Api_credentials",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the api_credentials to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "role",
              "group"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No api_credentials with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Api_credentials",
    "name": "GetApiApi_credentialsIdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/api_credentials/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch api_credentials with specified id",
    "group": "Api_credentials",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of api_credentials to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "api_credentials",
            "description": "<p>Object of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "api_credentials.id",
            "description": "<p><code>id</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "api_credentials.version",
            "description": "<p><code>version</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_client_key",
            "description": "<p><code>f_client_key</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_client_secret",
            "description": "<p><code>f_client_secret</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_token",
            "description": "<p><code>f_token</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_token_timeout_tmsp",
            "description": "<p><code>f_token_timeout_tmsp</code> of api_credentials</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No api_credentials with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Api_credentials",
    "name": "GetApiApi_credentialsIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/api_credentials?token=TOKEN",
    "title": "1 - Fetch multiple api_credentials",
    "group": "Api_credentials",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "api_credentialss",
            "description": "<p>List of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "api_credentialss.id",
            "description": "<p><code>id</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "api_credentialss.version",
            "description": "<p><code>version</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentialss.f_client_key",
            "description": "<p><code>f_client_key</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentialss.f_client_secret",
            "description": "<p><code>f_client_secret</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentialss.f_token",
            "description": "<p><code>f_token</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentialss.f_token_timeout_tmsp",
            "description": "<p><code>f_token_timeout_tmsp</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Api_credentials",
    "name": "GetApiApi_credentialsTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/api_credentials/?token=TOKEN",
    "title": "4 - Create api_credentials",
    "group": "Api_credentials",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_client_key",
            "description": "<p><code>f_client_key</code> of api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_client_secret",
            "description": "<p><code>f_client_secret</code> of api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_token",
            "description": "<p><code>f_token</code> of api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_token_timeout_tmsp",
            "description": "<p><code>f_token_timeout_tmsp</code> of api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_role_role",
            "description": "<p><code>id</code> of entity role to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_group_group",
            "description": "<p><code>id</code> of entity group to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "api_credentials",
            "description": "<p>Created api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "api_credentials.id",
            "description": "<p><code>id</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_client_key",
            "description": "<p><code>f_client_key</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_client_secret",
            "description": "<p><code>f_client_secret</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_token",
            "description": "<p><code>f_token</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_token_timeout_tmsp",
            "description": "<p><code>f_token_timeout_tmsp</code> of api_credentials</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create api_credentials</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Api_credentials",
    "name": "PostApiApi_credentialsTokenToken"
  },
  {
    "type": "put",
    "url": "/api/api_credentials/:id?token=TOKEN",
    "title": "5 - Update api_credentials",
    "group": "Api_credentials",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the api_credentials to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_client_key",
            "description": "<p>New value of <code>f_client_key</code> for api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_client_secret",
            "description": "<p>New value of <code>f_client_secret</code> for api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_token",
            "description": "<p>New value of <code>f_token</code> for api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_token_timeout_tmsp",
            "description": "<p>New value of <code>f_token_timeout_tmsp</code> for api_credentials</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_role_role",
            "description": "<p><code>id</code> of entity role to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_group_group",
            "description": "<p><code>id</code> of entity group to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "api_credentials",
            "description": "<p>Updated api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "api_credentials.id",
            "description": "<p><code>id</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_client_key",
            "description": "<p><code>f_client_key</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_client_secret",
            "description": "<p><code>f_client_secret</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_token",
            "description": "<p><code>f_token</code> of api_credentials</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "api_credentials.f_token_timeout_tmsp",
            "description": "<p><code>f_token_timeout_tmsp</code> of api_credentials</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No api_credentials with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update api_credentials</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Api_credentials",
    "name": "PutApiApi_credentialsIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/categorie/:id?token=TOKEN",
    "title": "6 - Delete categorie",
    "group": "Categorie",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of categorie to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No categorie with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Categorie",
    "name": "DeleteApiCategorieIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/categorie/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of categorie",
    "group": "Categorie",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the categorie to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "produit"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No categorie with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Categorie",
    "name": "GetApiCategorieIdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/categorie/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch categorie with specified id",
    "group": "Categorie",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of categorie to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "categorie",
            "description": "<p>Object of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "categorie.id",
            "description": "<p><code>id</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "categorie.version",
            "description": "<p><code>version</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categorie.f_libelle",
            "description": "<p><code>f_libelle</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categorie.f_codegestion",
            "description": "<p><code>f_codegestion</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "categorie.f_specialisee",
            "description": "<p><code>f_specialisee</code> of categorie</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No categorie with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Categorie",
    "name": "GetApiCategorieIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/categorie?token=TOKEN",
    "title": "1 - Fetch multiple categorie",
    "group": "Categorie",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "categories",
            "description": "<p>List of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "categories.id",
            "description": "<p><code>id</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "categories.version",
            "description": "<p><code>version</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categories.f_libelle",
            "description": "<p><code>f_libelle</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categories.f_codegestion",
            "description": "<p><code>f_codegestion</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "categories.f_specialisee",
            "description": "<p><code>f_specialisee</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Categorie",
    "name": "GetApiCategorieTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/categorie/?token=TOKEN",
    "title": "4 - Create categorie",
    "group": "Categorie",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p><code>f_libelle</code> of categorie</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p><code>f_codegestion</code> of categorie</p>"
          },
          {
            "group": "Body parameters",
            "type": "Boolean",
            "optional": false,
            "field": "f_specialisee",
            "description": "<p><code>f_specialisee</code> of categorie</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_categorie_listeproduits",
            "description": "<p><code>id</code> of entity produit to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "categorie",
            "description": "<p>Created categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "categorie.id",
            "description": "<p><code>id</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categorie.f_libelle",
            "description": "<p><code>f_libelle</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categorie.f_codegestion",
            "description": "<p><code>f_codegestion</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "categorie.f_specialisee",
            "description": "<p><code>f_specialisee</code> of categorie</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create categorie</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Categorie",
    "name": "PostApiCategorieTokenToken"
  },
  {
    "type": "put",
    "url": "/api/categorie/:id?token=TOKEN",
    "title": "5 - Update categorie",
    "group": "Categorie",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the categorie to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p>New value of <code>f_libelle</code> for categorie</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p>New value of <code>f_codegestion</code> for categorie</p>"
          },
          {
            "group": "Body parameters",
            "type": "Boolean",
            "optional": false,
            "field": "f_specialisee",
            "description": "<p>New value of <code>f_specialisee</code> for categorie</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_categorie_listeproduits",
            "description": "<p><code>id</code> of entity produit to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "categorie",
            "description": "<p>Updated categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "categorie.id",
            "description": "<p><code>id</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categorie.f_libelle",
            "description": "<p><code>f_libelle</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "categorie.f_codegestion",
            "description": "<p><code>f_codegestion</code> of categorie</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "categorie.f_specialisee",
            "description": "<p><code>f_specialisee</code> of categorie</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No categorie with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update categorie</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Categorie",
    "name": "PutApiCategorieIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/classerepartition/:id?token=TOKEN",
    "title": "6 - Delete classerepartition",
    "group": "Classerepartition",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of classerepartition to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No classerepartition with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Classerepartition",
    "name": "DeleteApiClasserepartitionIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/classerepartition/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch classerepartition with specified id",
    "group": "Classerepartition",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of classerepartition to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "classerepartition",
            "description": "<p>Object of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "classerepartition.id",
            "description": "<p><code>id</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "classerepartition.version",
            "description": "<p><code>version</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartition.f_code",
            "description": "<p><code>f_code</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartition.f_libelle",
            "description": "<p><code>f_libelle</code> of classerepartition</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No classerepartition with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Classerepartition",
    "name": "GetApiClasserepartitionIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/classerepartition?token=TOKEN",
    "title": "1 - Fetch multiple classerepartition",
    "group": "Classerepartition",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "classerepartitions",
            "description": "<p>List of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "classerepartitions.id",
            "description": "<p><code>id</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "classerepartitions.version",
            "description": "<p><code>version</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartitions.f_code",
            "description": "<p><code>f_code</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartitions.f_libelle",
            "description": "<p><code>f_libelle</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Classerepartition",
    "name": "GetApiClasserepartitionTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/classerepartition/?token=TOKEN",
    "title": "4 - Create classerepartition",
    "group": "Classerepartition",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_code",
            "description": "<p><code>f_code</code> of classerepartition</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p><code>f_libelle</code> of classerepartition</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "classerepartition",
            "description": "<p>Created classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "classerepartition.id",
            "description": "<p><code>id</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartition.f_code",
            "description": "<p><code>f_code</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartition.f_libelle",
            "description": "<p><code>f_libelle</code> of classerepartition</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create classerepartition</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Classerepartition",
    "name": "PostApiClasserepartitionTokenToken"
  },
  {
    "type": "put",
    "url": "/api/classerepartition/:id?token=TOKEN",
    "title": "5 - Update classerepartition",
    "group": "Classerepartition",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the classerepartition to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_code",
            "description": "<p>New value of <code>f_code</code> for classerepartition</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p>New value of <code>f_libelle</code> for classerepartition</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "classerepartition",
            "description": "<p>Updated classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "classerepartition.id",
            "description": "<p><code>id</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartition.f_code",
            "description": "<p><code>f_code</code> of classerepartition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "classerepartition.f_libelle",
            "description": "<p><code>f_libelle</code> of classerepartition</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No classerepartition with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update classerepartition</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Classerepartition",
    "name": "PutApiClasserepartitionIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/collectivite/:id?token=TOKEN",
    "title": "6 - Delete collectivite",
    "group": "Collectivite",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of collectivite to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No collectivite with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Collectivite",
    "name": "DeleteApiCollectiviteIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/collectivite/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of collectivite",
    "group": "Collectivite",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the collectivite to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "adresse"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No collectivite with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Collectivite",
    "name": "GetApiCollectiviteIdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/collectivite/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch collectivite with specified id",
    "group": "Collectivite",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of collectivite to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "collectivite",
            "description": "<p>Object of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "collectivite.id",
            "description": "<p><code>id</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "collectivite.version",
            "description": "<p><code>version</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_nom",
            "description": "<p><code>f_nom</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_codegestion",
            "description": "<p><code>f_codegestion</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_siret",
            "description": "<p><code>f_siret</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "collectivite.f_statut",
            "description": "<p><code>f_statut</code> of collectivite</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No collectivite with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Collectivite",
    "name": "GetApiCollectiviteIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/collectivite?token=TOKEN",
    "title": "1 - Fetch multiple collectivite",
    "group": "Collectivite",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "collectivites",
            "description": "<p>List of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "collectivites.id",
            "description": "<p><code>id</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "collectivites.version",
            "description": "<p><code>version</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivites.f_nom",
            "description": "<p><code>f_nom</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivites.f_codegestion",
            "description": "<p><code>f_codegestion</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivites.f_siret",
            "description": "<p><code>f_siret</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "collectivites.f_statut",
            "description": "<p><code>f_statut</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Collectivite",
    "name": "GetApiCollectiviteTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/collectivite/?token=TOKEN",
    "title": "4 - Create collectivite",
    "group": "Collectivite",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_nom",
            "description": "<p><code>f_nom</code> of collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p><code>f_codegestion</code> of collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_siret",
            "description": "<p><code>f_siret</code> of collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_statut",
            "description": "<p><code>f_statut</code> of collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_adresse",
            "description": "<p><code>id</code> of entity adresse to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "collectivite",
            "description": "<p>Created collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "collectivite.id",
            "description": "<p><code>id</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_nom",
            "description": "<p><code>f_nom</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_codegestion",
            "description": "<p><code>f_codegestion</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_siret",
            "description": "<p><code>f_siret</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "collectivite.f_statut",
            "description": "<p><code>f_statut</code> of collectivite</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create collectivite</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Collectivite",
    "name": "PostApiCollectiviteTokenToken"
  },
  {
    "type": "put",
    "url": "/api/collectivite/:id?token=TOKEN",
    "title": "5 - Update collectivite",
    "group": "Collectivite",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the collectivite to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_nom",
            "description": "<p>New value of <code>f_nom</code> for collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p>New value of <code>f_codegestion</code> for collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_siret",
            "description": "<p>New value of <code>f_siret</code> for collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_statut",
            "description": "<p>New value of <code>f_statut</code> for collectivite</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_adresse",
            "description": "<p><code>id</code> of entity adresse to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "collectivite",
            "description": "<p>Updated collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "collectivite.id",
            "description": "<p><code>id</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_nom",
            "description": "<p><code>f_nom</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_codegestion",
            "description": "<p><code>f_codegestion</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "collectivite.f_siret",
            "description": "<p><code>f_siret</code> of collectivite</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "collectivite.f_statut",
            "description": "<p><code>f_statut</code> of collectivite</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No collectivite with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update collectivite</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Collectivite",
    "name": "PutApiCollectiviteIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/declaration_/:id?token=TOKEN",
    "title": "6 - Delete declaration_",
    "group": "Declaration_",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of declaration_ to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No declaration_ with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Declaration_",
    "name": "DeleteApiDeclaration_IdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/declaration_/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of declaration_",
    "group": "Declaration_",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the declaration_ to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "msm",
              "anneedeclaration"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No declaration_ with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Declaration_",
    "name": "GetApiDeclaration_IdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/declaration_/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch declaration_ with specified id",
    "group": "Declaration_",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of declaration_ to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "declaration_",
            "description": "<p>Object of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "declaration_.id",
            "description": "<p><code>id</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "declaration_.version",
            "description": "<p><code>version</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_typedeclaration",
            "description": "<p><code>f_typedeclaration</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_etat",
            "description": "<p><code>f_etat</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_etatattestation",
            "description": "<p><code>f_etatattestation</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "declaration_.f_nomdeclaration",
            "description": "<p><code>f_nomdeclaration</code> of declaration_</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No declaration_ with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Declaration_",
    "name": "GetApiDeclaration_IdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/declaration_?token=TOKEN",
    "title": "1 - Fetch multiple declaration_",
    "group": "Declaration_",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "declaration_s",
            "description": "<p>List of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "declaration_s.id",
            "description": "<p><code>id</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "declaration_s.version",
            "description": "<p><code>version</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_s.f_typedeclaration",
            "description": "<p><code>f_typedeclaration</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_s.f_etat",
            "description": "<p><code>f_etat</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_s.f_etatattestation",
            "description": "<p><code>f_etatattestation</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "declaration_s.f_nomdeclaration",
            "description": "<p><code>f_nomdeclaration</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Declaration_",
    "name": "GetApiDeclaration_TokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/declaration_/?token=TOKEN",
    "title": "4 - Create declaration_",
    "group": "Declaration_",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_typedeclaration",
            "description": "<p><code>f_typedeclaration</code> of declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_etat",
            "description": "<p><code>f_etat</code> of declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_etatattestation",
            "description": "<p><code>f_etatattestation</code> of declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_nomdeclaration",
            "description": "<p><code>f_nomdeclaration</code> of declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_msm_msm",
            "description": "<p><code>id</code> of entity msm to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_anneedeclaration_anneeadeclarer",
            "description": "<p><code>id</code> of entity anneedeclaration to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "declaration_",
            "description": "<p>Created declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "declaration_.id",
            "description": "<p><code>id</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_typedeclaration",
            "description": "<p><code>f_typedeclaration</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_etat",
            "description": "<p><code>f_etat</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_etatattestation",
            "description": "<p><code>f_etatattestation</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "declaration_.f_nomdeclaration",
            "description": "<p><code>f_nomdeclaration</code> of declaration_</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create declaration_</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Declaration_",
    "name": "PostApiDeclaration_TokenToken"
  },
  {
    "type": "put",
    "url": "/api/declaration_/:id?token=TOKEN",
    "title": "5 - Update declaration_",
    "group": "Declaration_",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the declaration_ to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_typedeclaration",
            "description": "<p>New value of <code>f_typedeclaration</code> for declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_etat",
            "description": "<p>New value of <code>f_etat</code> for declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_etatattestation",
            "description": "<p>New value of <code>f_etatattestation</code> for declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_nomdeclaration",
            "description": "<p>New value of <code>f_nomdeclaration</code> for declaration_</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_msm_msm",
            "description": "<p><code>id</code> of entity msm to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_anneedeclaration_anneeadeclarer",
            "description": "<p><code>id</code> of entity anneedeclaration to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "declaration_",
            "description": "<p>Updated declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "declaration_.id",
            "description": "<p><code>id</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_typedeclaration",
            "description": "<p><code>f_typedeclaration</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_etat",
            "description": "<p><code>f_etat</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "declaration_.f_etatattestation",
            "description": "<p><code>f_etatattestation</code> of declaration_</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "declaration_.f_nomdeclaration",
            "description": "<p><code>f_nomdeclaration</code> of declaration_</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No declaration_ with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update declaration_</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Declaration_",
    "name": "PutApiDeclaration_IdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/group/:id?token=TOKEN",
    "title": "6 - Delete group",
    "group": "Group",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of group to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No group with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Group",
    "name": "DeleteApiGroupIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/group/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch group with specified id",
    "group": "Group",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of group to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>Object of group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "group.id",
            "description": "<p><code>id</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "group.version",
            "description": "<p><code>version</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "group.f_label",
            "description": "<p><code>f_label</code> of group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No group with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Group",
    "name": "GetApiGroupIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/group?token=TOKEN",
    "title": "1 - Fetch multiple group",
    "group": "Group",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "groups",
            "description": "<p>List of group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "groups.id",
            "description": "<p><code>id</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "groups.version",
            "description": "<p><code>version</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "groups.f_label",
            "description": "<p><code>f_label</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Group",
    "name": "GetApiGroupTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/group/?token=TOKEN",
    "title": "4 - Create group",
    "group": "Group",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_label",
            "description": "<p><code>f_label</code> of group</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>Created group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "group.id",
            "description": "<p><code>id</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "group.f_label",
            "description": "<p><code>f_label</code> of group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create group</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Group",
    "name": "PostApiGroupTokenToken"
  },
  {
    "type": "put",
    "url": "/api/group/:id?token=TOKEN",
    "title": "5 - Update group",
    "group": "Group",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the group to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_label",
            "description": "<p>New value of <code>f_label</code> for group</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "group",
            "description": "<p>Updated group</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "group.id",
            "description": "<p><code>id</code> of group</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "group.f_label",
            "description": "<p><code>f_label</code> of group</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No group with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update group</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Group",
    "name": "PutApiGroupIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/msm/:id?token=TOKEN",
    "title": "6 - Delete msm",
    "group": "Msm",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of msm to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No msm with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Msm",
    "name": "DeleteApiMsmIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/msm/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of msm",
    "group": "Msm",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the msm to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "adresse"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No msm with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Msm",
    "name": "GetApiMsmIdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/msm/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch msm with specified id",
    "group": "Msm",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of msm to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "msm",
            "description": "<p>Object of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "msm.id",
            "description": "<p><code>id</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "msm.version",
            "description": "<p><code>version</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_nom",
            "description": "<p><code>f_nom</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_codegestion",
            "description": "<p><code>f_codegestion</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msm.f_statut",
            "description": "<p><code>f_statut</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_siret_",
            "description": "<p><code>f_siret_</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_identifianttva",
            "description": "<p><code>f_identifianttva</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msm.f_typeinscription",
            "description": "<p><code>f_typeinscription</code> of msm</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No msm with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Msm",
    "name": "GetApiMsmIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/msm?token=TOKEN",
    "title": "1 - Fetch multiple msm",
    "group": "Msm",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "msms",
            "description": "<p>List of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "msms.id",
            "description": "<p><code>id</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "msms.version",
            "description": "<p><code>version</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msms.f_nom",
            "description": "<p><code>f_nom</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msms.f_codegestion",
            "description": "<p><code>f_codegestion</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msms.f_statut",
            "description": "<p><code>f_statut</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msms.f_siret_",
            "description": "<p><code>f_siret_</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msms.f_identifianttva",
            "description": "<p><code>f_identifianttva</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msms.f_typeinscription",
            "description": "<p><code>f_typeinscription</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Msm",
    "name": "GetApiMsmTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/msm/?token=TOKEN",
    "title": "4 - Create msm",
    "group": "Msm",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_nom",
            "description": "<p><code>f_nom</code> of msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p><code>f_codegestion</code> of msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_statut",
            "description": "<p><code>f_statut</code> of msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_siret_",
            "description": "<p><code>f_siret_</code> of msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_identifianttva",
            "description": "<p><code>f_identifianttva</code> of msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_typeinscription",
            "description": "<p><code>f_typeinscription</code> of msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_adresse",
            "description": "<p><code>id</code> of entity adresse to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "msm",
            "description": "<p>Created msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "msm.id",
            "description": "<p><code>id</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_nom",
            "description": "<p><code>f_nom</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_codegestion",
            "description": "<p><code>f_codegestion</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msm.f_statut",
            "description": "<p><code>f_statut</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_siret_",
            "description": "<p><code>f_siret_</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_identifianttva",
            "description": "<p><code>f_identifianttva</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msm.f_typeinscription",
            "description": "<p><code>f_typeinscription</code> of msm</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create msm</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Msm",
    "name": "PostApiMsmTokenToken"
  },
  {
    "type": "put",
    "url": "/api/msm/:id?token=TOKEN",
    "title": "5 - Update msm",
    "group": "Msm",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the msm to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_nom",
            "description": "<p>New value of <code>f_nom</code> for msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p>New value of <code>f_codegestion</code> for msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_statut",
            "description": "<p>New value of <code>f_statut</code> for msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_siret_",
            "description": "<p>New value of <code>f_siret_</code> for msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_identifianttva",
            "description": "<p>New value of <code>f_identifianttva</code> for msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "Enum",
            "optional": false,
            "field": "f_typeinscription",
            "description": "<p>New value of <code>f_typeinscription</code> for msm</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_adresse",
            "description": "<p><code>id</code> of entity adresse to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "msm",
            "description": "<p>Updated msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "msm.id",
            "description": "<p><code>id</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_nom",
            "description": "<p><code>f_nom</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_codegestion",
            "description": "<p><code>f_codegestion</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msm.f_statut",
            "description": "<p><code>f_statut</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_siret_",
            "description": "<p><code>f_siret_</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "msm.f_identifianttva",
            "description": "<p><code>f_identifianttva</code> of msm</p>"
          },
          {
            "group": "Success 200",
            "type": "Enum",
            "optional": false,
            "field": "msm.f_typeinscription",
            "description": "<p><code>f_typeinscription</code> of msm</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No msm with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update msm</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Msm",
    "name": "PutApiMsmIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/produit/:id?token=TOKEN",
    "title": "6 - Delete produit",
    "group": "Produit",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of produit to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No produit with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Produit",
    "name": "DeleteApiProduitIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/produit/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch produit with specified id",
    "group": "Produit",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of produit to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "produit",
            "description": "<p>Object of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "produit.id",
            "description": "<p><code>id</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "produit.version",
            "description": "<p><code>version</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_libelle",
            "description": "<p><code>f_libelle</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestion",
            "description": "<p><code>f_codegestion</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestiontype",
            "description": "<p><code>f_codegestiontype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestionsoustype",
            "description": "<p><code>f_codegestionsoustype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_prixunitaire",
            "description": "<p><code>f_prixunitaire</code> of produit</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No produit with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Produit",
    "name": "GetApiProduitIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/produit?token=TOKEN",
    "title": "1 - Fetch multiple produit",
    "group": "Produit",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "produits",
            "description": "<p>List of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "produits.id",
            "description": "<p><code>id</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "produits.version",
            "description": "<p><code>version</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produits.f_libelle",
            "description": "<p><code>f_libelle</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produits.f_codegestion",
            "description": "<p><code>f_codegestion</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produits.f_codegestiontype",
            "description": "<p><code>f_codegestiontype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produits.f_codegestionsoustype",
            "description": "<p><code>f_codegestionsoustype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produits.f_prixunitaire",
            "description": "<p><code>f_prixunitaire</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Produit",
    "name": "GetApiProduitTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/produit/?token=TOKEN",
    "title": "4 - Create produit",
    "group": "Produit",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p><code>f_libelle</code> of produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p><code>f_codegestion</code> of produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestiontype",
            "description": "<p><code>f_codegestiontype</code> of produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestionsoustype",
            "description": "<p><code>f_codegestionsoustype</code> of produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_prixunitaire",
            "description": "<p><code>f_prixunitaire</code> of produit</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "produit",
            "description": "<p>Created produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "produit.id",
            "description": "<p><code>id</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_libelle",
            "description": "<p><code>f_libelle</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestion",
            "description": "<p><code>f_codegestion</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestiontype",
            "description": "<p><code>f_codegestiontype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestionsoustype",
            "description": "<p><code>f_codegestionsoustype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_prixunitaire",
            "description": "<p><code>f_prixunitaire</code> of produit</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create produit</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Produit",
    "name": "PostApiProduitTokenToken"
  },
  {
    "type": "put",
    "url": "/api/produit/:id?token=TOKEN",
    "title": "5 - Update produit",
    "group": "Produit",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the produit to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p>New value of <code>f_libelle</code> for produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestion",
            "description": "<p>New value of <code>f_codegestion</code> for produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestiontype",
            "description": "<p>New value of <code>f_codegestiontype</code> for produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_codegestionsoustype",
            "description": "<p>New value of <code>f_codegestionsoustype</code> for produit</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_prixunitaire",
            "description": "<p>New value of <code>f_prixunitaire</code> for produit</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "produit",
            "description": "<p>Updated produit</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "produit.id",
            "description": "<p><code>id</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_libelle",
            "description": "<p><code>f_libelle</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestion",
            "description": "<p><code>f_codegestion</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestiontype",
            "description": "<p><code>f_codegestiontype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_codegestionsoustype",
            "description": "<p><code>f_codegestionsoustype</code> of produit</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "produit.f_prixunitaire",
            "description": "<p><code>f_prixunitaire</code> of produit</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No produit with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update produit</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Produit",
    "name": "PutApiProduitIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/profil/:id?token=TOKEN",
    "title": "6 - Delete profil",
    "group": "Profil",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of profil to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No profil with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Profil",
    "name": "DeleteApiProfilIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/profil/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch profil with specified id",
    "group": "Profil",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of profil to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "profil",
            "description": "<p>Object of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "profil.id",
            "description": "<p><code>id</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "profil.version",
            "description": "<p><code>version</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "profil.f_libelle_",
            "description": "<p><code>f_libelle_</code> of profil</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No profil with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Profil",
    "name": "GetApiProfilIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/profil?token=TOKEN",
    "title": "1 - Fetch multiple profil",
    "group": "Profil",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "profils",
            "description": "<p>List of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "profils.id",
            "description": "<p><code>id</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "profils.version",
            "description": "<p><code>version</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "profils.f_libelle_",
            "description": "<p><code>f_libelle_</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Profil",
    "name": "GetApiProfilTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/profil/?token=TOKEN",
    "title": "4 - Create profil",
    "group": "Profil",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle_",
            "description": "<p><code>f_libelle_</code> of profil</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "profil",
            "description": "<p>Created profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "profil.id",
            "description": "<p><code>id</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "profil.f_libelle_",
            "description": "<p><code>f_libelle_</code> of profil</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create profil</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Profil",
    "name": "PostApiProfilTokenToken"
  },
  {
    "type": "put",
    "url": "/api/profil/:id?token=TOKEN",
    "title": "5 - Update profil",
    "group": "Profil",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the profil to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle_",
            "description": "<p>New value of <code>f_libelle_</code> for profil</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "profil",
            "description": "<p>Updated profil</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "profil.id",
            "description": "<p><code>id</code> of profil</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "profil.f_libelle_",
            "description": "<p><code>f_libelle_</code> of profil</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No profil with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update profil</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Profil",
    "name": "PutApiProfilIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/role/:id?token=TOKEN",
    "title": "6 - Delete role",
    "group": "Role",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of role to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No role with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Role",
    "name": "DeleteApiRoleIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/role/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch role with specified id",
    "group": "Role",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of role to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "role",
            "description": "<p>Object of role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "role.id",
            "description": "<p><code>id</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "role.version",
            "description": "<p><code>version</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "role.f_label",
            "description": "<p><code>f_label</code> of role</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No role with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Role",
    "name": "GetApiRoleIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/role?token=TOKEN",
    "title": "1 - Fetch multiple role",
    "group": "Role",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "roles",
            "description": "<p>List of role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roles.id",
            "description": "<p><code>id</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roles.version",
            "description": "<p><code>version</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "roles.f_label",
            "description": "<p><code>f_label</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Role",
    "name": "GetApiRoleTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/role/?token=TOKEN",
    "title": "4 - Create role",
    "group": "Role",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_label",
            "description": "<p><code>f_label</code> of role</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "role",
            "description": "<p>Created role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "role.id",
            "description": "<p><code>id</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "role.f_label",
            "description": "<p><code>f_label</code> of role</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create role</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Role",
    "name": "PostApiRoleTokenToken"
  },
  {
    "type": "put",
    "url": "/api/role/:id?token=TOKEN",
    "title": "5 - Update role",
    "group": "Role",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the role to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_label",
            "description": "<p>New value of <code>f_label</code> for role</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "role",
            "description": "<p>Updated role</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "role.id",
            "description": "<p><code>id</code> of role</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "role.f_label",
            "description": "<p><code>f_label</code> of role</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No role with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update role</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Role",
    "name": "PutApiRoleIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/roleutilisateur/:id?token=TOKEN",
    "title": "6 - Delete roleutilisateur",
    "group": "Roleutilisateur",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of roleutilisateur to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No roleutilisateur with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Roleutilisateur",
    "name": "DeleteApiRoleutilisateurIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/roleutilisateur/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch roleutilisateur with specified id",
    "group": "Roleutilisateur",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of roleutilisateur to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roleutilisateur",
            "description": "<p>Object of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roleutilisateur.id",
            "description": "<p><code>id</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roleutilisateur.version",
            "description": "<p><code>version</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "roleutilisateur.f_libelle",
            "description": "<p><code>f_libelle</code> of roleutilisateur</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No roleutilisateur with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Roleutilisateur",
    "name": "GetApiRoleutilisateurIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/roleutilisateur?token=TOKEN",
    "title": "1 - Fetch multiple roleutilisateur",
    "group": "Roleutilisateur",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "roleutilisateurs",
            "description": "<p>List of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roleutilisateurs.id",
            "description": "<p><code>id</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roleutilisateurs.version",
            "description": "<p><code>version</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "roleutilisateurs.f_libelle",
            "description": "<p><code>f_libelle</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Roleutilisateur",
    "name": "GetApiRoleutilisateurTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/roleutilisateur/?token=TOKEN",
    "title": "4 - Create roleutilisateur",
    "group": "Roleutilisateur",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p><code>f_libelle</code> of roleutilisateur</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roleutilisateur",
            "description": "<p>Created roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roleutilisateur.id",
            "description": "<p><code>id</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "roleutilisateur.f_libelle",
            "description": "<p><code>f_libelle</code> of roleutilisateur</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create roleutilisateur</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Roleutilisateur",
    "name": "PostApiRoleutilisateurTokenToken"
  },
  {
    "type": "put",
    "url": "/api/roleutilisateur/:id?token=TOKEN",
    "title": "5 - Update roleutilisateur",
    "group": "Roleutilisateur",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the roleutilisateur to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_libelle",
            "description": "<p>New value of <code>f_libelle</code> for roleutilisateur</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "roleutilisateur",
            "description": "<p>Updated roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "roleutilisateur.id",
            "description": "<p><code>id</code> of roleutilisateur</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "roleutilisateur.f_libelle",
            "description": "<p><code>f_libelle</code> of roleutilisateur</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No roleutilisateur with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update roleutilisateur</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "Roleutilisateur",
    "name": "PutApiRoleutilisateurIdTokenToken"
  },
  {
    "type": "delete",
    "url": "/api/user/:id?token=TOKEN",
    "title": "6 - Delete user",
    "group": "User",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of user to delete</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No user with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "User",
    "name": "DeleteApiUserIdTokenToken"
  },
  {
    "type": "get",
    "url": "/api/user/:id/:association?token=TOKEN&limit=10&offset=0",
    "title": "3 - Fetch association of user",
    "group": "User",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the user to which <code>association</code> is related</p>"
          },
          {
            "group": "Params parameters",
            "type": "String",
            "allowedValues": [
              "role",
              "group"
            ],
            "optional": false,
            "field": "association",
            "description": "<p>Name of the related entity</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "Object",
            "description": "<p>Object of <code>association</code></p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No user with ID <code>id</code> found</p>"
          },
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "AssociationNotFound",
            "description": "<p>No association with <code>association</code></p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "User",
    "name": "GetApiUserIdAssociationTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/user/:id?token=TOKEN&limit=10&offset=0",
    "title": "2 - Fetch user with specified id",
    "group": "User",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p>The <code>id</code> of user to fetch</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "user",
            "description": "<p>Object of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "user.id",
            "description": "<p><code>id</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "user.version",
            "description": "<p><code>version</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_login",
            "description": "<p><code>f_login</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_password",
            "description": "<p><code>f_password</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_email",
            "description": "<p><code>f_email</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_token_password_reset",
            "description": "<p><code>f_token_password_reset</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "user.f_enabled",
            "description": "<p><code>f_enabled</code> of user</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No user with ID <code>id</code> found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "User",
    "name": "GetApiUserIdTokenTokenLimit10Offset0"
  },
  {
    "type": "get",
    "url": "/api/user?token=TOKEN",
    "title": "1 - Fetch multiple user",
    "group": "User",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "users",
            "description": "<p>List of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "users.id",
            "description": "<p><code>id</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "users.version",
            "description": "<p><code>version</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.f_login",
            "description": "<p><code>f_login</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.f_password",
            "description": "<p><code>f_password</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.f_email",
            "description": "<p><code>f_email</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "users.f_token_password_reset",
            "description": "<p><code>f_token_password_reset</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "users.f_enabled",
            "description": "<p><code>f_enabled</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>Limit used to fetch data</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>Offset used to fetch data</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "User",
    "name": "GetApiUserTokenToken",
    "parameter": {
      "fields": {
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "limit",
            "description": "<p>The number of rows to be fetched</p>"
          },
          {
            "group": "Query parameters",
            "type": "Integer",
            "optional": false,
            "field": "offset",
            "description": "<p>The offset by which rows will be fetched</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/api/user/?token=TOKEN",
    "title": "4 - Create user",
    "group": "User",
    "parameter": {
      "fields": {
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_login",
            "description": "<p><code>f_login</code> of user</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_email",
            "description": "<p><code>f_email</code> of user</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_role_role",
            "description": "<p><code>id</code> of entity role to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_group_group",
            "description": "<p><code>id</code> of entity group to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "user",
            "description": "<p>Created user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "user.id",
            "description": "<p><code>id</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_login",
            "description": "<p><code>f_login</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_email",
            "description": "<p><code>f_email</code> of user</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to create user</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "User",
    "name": "PostApiUserTokenToken"
  },
  {
    "type": "put",
    "url": "/api/user/:id?token=TOKEN",
    "title": "5 - Update user",
    "group": "User",
    "parameter": {
      "fields": {
        "Params parameters": [
          {
            "group": "Params parameters",
            "type": "Integer",
            "optional": false,
            "field": "id",
            "description": "<p><code>id</code> of the user to update</p>"
          }
        ],
        "Body parameters": [
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_login",
            "description": "<p>New value of <code>f_login</code> for user</p>"
          },
          {
            "group": "Body parameters",
            "type": "String",
            "optional": false,
            "field": "f_email",
            "description": "<p>New value of <code>f_email</code> for user</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_role_role",
            "description": "<p><code>id</code> of entity role to associate</p>"
          },
          {
            "group": "Body parameters",
            "type": "Integer",
            "optional": false,
            "field": "f_id_group_group",
            "description": "<p><code>id</code> of entity group to associate</p>"
          }
        ],
        "Query parameters": [
          {
            "group": "Query parameters",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>API Bearer Token, required for authentication</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "user",
            "description": "<p>Updated user</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "user.id",
            "description": "<p><code>id</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_login",
            "description": "<p><code>f_login</code> of user</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "user.f_email",
            "description": "<p><code>f_email</code> of user</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 404": [
          {
            "group": "Error 404",
            "type": "Object",
            "optional": false,
            "field": "NotFound",
            "description": "<p>No user with ID <code>id</code> found</p>"
          }
        ],
        "Error 500": [
          {
            "group": "Error 500",
            "type": "Object",
            "optional": false,
            "field": "ServerError",
            "description": "<p>An error occured when trying to update user</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "apiDoc/generatedTest.js",
    "groupTitle": "User",
    "name": "PutApiUserIdTokenToken"
  }
] });
