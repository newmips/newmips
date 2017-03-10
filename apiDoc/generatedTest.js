/**
 * @apiDefine token
 * @apiParam (Query parameters) {String} token API Bearer Token, required for authentication
 */

/**
 * @apiDefine tokenLimitOffset
 * @apiParam (Query parameters) {String} token API Bearer Token, required for authentication
 * @apiParam (Query parameters) {Integer} limit The number of rows to be fetched
 * @apiParam (Query parameters) {Integer} offset The offset by which rows will be fetched
 */

/**
 * @api {get} /api/getToken/ Basic Auth

 * @apiName BearerToken
 * @apiGroup 1-Authentication

 * @apiDescription To be able to interact with the API, you need to generate a Bearer Token using the /api/getToken/ url.
 * Set your HTTP header like so with basic64 encoding : Authorization clientID:clientSecret

 * @apiHeader {String} ClientID Generated application's API credentials
 * @apiHeader {String} ClientSecret Generated application's API credentials

 * @apiSuccess {String} token Bearer Token, required for further API calls

 * @apiError (Error 500) BadAuthorizationHeader There is invalid authorization header or none
 * @apiError (Error 401) AuthenticationFailed Couldn't match clientID/clientSecret with database
 */

/**
 * @api {get} /api/declaration_?token=TOKEN 1 - Fetch multiple declaration_
 * @apiGroup Declaration_
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} declaration_s List of declaration_
 * @apiSuccess {Integer} declaration_s.id <code>id</code> of declaration_
 * @apiSuccess {Integer} declaration_s.version <code>version</code> of declaration_
 * @apiSuccess {Enum} declaration_s.f_typedeclaration <code>f_typedeclaration</code> of declaration_
 * @apiSuccess {Enum} declaration_s.f_etat <code>f_etat</code> of declaration_
 * @apiSuccess {Enum} declaration_s.f_etatattestation <code>f_etatattestation</code> of declaration_
 * @apiSuccess {String} declaration_s.f_nomdeclaration <code>f_nomdeclaration</code> of declaration_
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/declaration_/:id?token=TOKEN&limit=10&offset=0 2 - Fetch declaration_ with specified id
 * @apiGroup Declaration_
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of declaration_ to fetch
 * @apiSuccess {Object} declaration_ Object of declaration_
 * @apiSuccess {Integer} declaration_.id <code>id</code> of declaration_
 * @apiSuccess {Integer} declaration_.version <code>version</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_typedeclaration <code>f_typedeclaration</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_etat <code>f_etat</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_etatattestation <code>f_etatattestation</code> of declaration_
 * @apiSuccess {String} declaration_.f_nomdeclaration <code>f_nomdeclaration</code> of declaration_
 * @apiError (Error 404) {Object} NotFound No declaration_ with ID <code>id</code> found
 */

/**
 * @api {get} /api/declaration_/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of declaration_
 * @apiGroup Declaration_
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the declaration_ to which <code>association</code> is related
 * @apiParam (Params parameters) {String=msm,anneedeclaration} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No declaration_ with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/declaration_/?token=TOKEN 4 - Create declaration_
 * @apiGroup Declaration_
 * @apiUse token
 * @apiParam (Body parameters) {Enum} f_typedeclaration <code>f_typedeclaration</code> of declaration_
 * @apiParam (Body parameters) {Enum} f_etat <code>f_etat</code> of declaration_
 * @apiParam (Body parameters) {Enum} f_etatattestation <code>f_etatattestation</code> of declaration_
 * @apiParam (Body parameters) {String} f_nomdeclaration <code>f_nomdeclaration</code> of declaration_
 * @apiParam (Body parameters) {Integer} f_id_msm_msm <code>id</code> of entity msm to associate
 * @apiParam (Body parameters) {Integer} f_id_anneedeclaration_anneeadeclarer <code>id</code> of entity anneedeclaration to associate
 * @apiSuccess {Object} declaration_ Created declaration_
 * @apiSuccess {Integer} declaration_.id <code>id</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_typedeclaration <code>f_typedeclaration</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_etat <code>f_etat</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_etatattestation <code>f_etatattestation</code> of declaration_
 * @apiSuccess {String} declaration_.f_nomdeclaration <code>f_nomdeclaration</code> of declaration_
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create declaration_
 */

/**
 * @api {put} /api/declaration_/:id?token=TOKEN 5 - Update declaration_
 * @apiGroup Declaration_
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the declaration_ to update
 * @apiParam (Body parameters) {Enum} f_typedeclaration New value of <code>f_typedeclaration</code> for declaration_
 * @apiParam (Body parameters) {Enum} f_etat New value of <code>f_etat</code> for declaration_
 * @apiParam (Body parameters) {Enum} f_etatattestation New value of <code>f_etatattestation</code> for declaration_
 * @apiParam (Body parameters) {String} f_nomdeclaration New value of <code>f_nomdeclaration</code> for declaration_
 * @apiParam (Body parameters) {Integer} f_id_msm_msm <code>id</code> of entity msm to associate
 * @apiParam (Body parameters) {Integer} f_id_anneedeclaration_anneeadeclarer <code>id</code> of entity anneedeclaration to associate
 * @apiSuccess {Object} declaration_ Updated declaration_
 * @apiSuccess {Integer} declaration_.id <code>id</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_typedeclaration <code>f_typedeclaration</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_etat <code>f_etat</code> of declaration_
 * @apiSuccess {Enum} declaration_.f_etatattestation <code>f_etatattestation</code> of declaration_
 * @apiSuccess {String} declaration_.f_nomdeclaration <code>f_nomdeclaration</code> of declaration_
 * @apiError (Error 404) {Object} NotFound No declaration_ with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update declaration_
 */

/**
 * @api {delete} /api/declaration_/:id?token=TOKEN 6 - Delete declaration_
 * @apiGroup Declaration_
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of declaration_ to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No declaration_ with ID <code>id</code> found
 */

/**
 * @api {get} /api/user?token=TOKEN 1 - Fetch multiple user
 * @apiGroup User
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} users List of user
 * @apiSuccess {Integer} users.id <code>id</code> of user
 * @apiSuccess {Integer} users.version <code>version</code> of user
 * @apiSuccess {String} users.f_login <code>f_login</code> of user
 * @apiSuccess {String} users.f_password <code>f_password</code> of user
 * @apiSuccess {String} users.f_email <code>f_email</code> of user
 * @apiSuccess {String} users.f_token_password_reset <code>f_token_password_reset</code> of user
 * @apiSuccess {Integer} users.f_enabled <code>f_enabled</code> of user
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/user/:id?token=TOKEN&limit=10&offset=0 2 - Fetch user with specified id
 * @apiGroup User
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of user to fetch
 * @apiSuccess {Object} user Object of user
 * @apiSuccess {Integer} user.id <code>id</code> of user
 * @apiSuccess {Integer} user.version <code>version</code> of user
 * @apiSuccess {String} user.f_login <code>f_login</code> of user
 * @apiSuccess {String} user.f_password <code>f_password</code> of user
 * @apiSuccess {String} user.f_email <code>f_email</code> of user
 * @apiSuccess {String} user.f_token_password_reset <code>f_token_password_reset</code> of user
 * @apiSuccess {Integer} user.f_enabled <code>f_enabled</code> of user
 * @apiError (Error 404) {Object} NotFound No user with ID <code>id</code> found
 */

/**
 * @api {get} /api/user/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of user
 * @apiGroup User
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the user to which <code>association</code> is related
 * @apiParam (Params parameters) {String=role,group} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No user with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/user/?token=TOKEN 4 - Create user
 * @apiGroup User
 * @apiUse token
 * @apiParam (Body parameters) {String} f_login <code>f_login</code> of user
 * @apiParam (Body parameters) {String} f_email <code>f_email</code> of user
 * @apiParam (Body parameters) {Integer} f_id_role_role <code>id</code> of entity role to associate
 * @apiParam (Body parameters) {Integer} f_id_group_group <code>id</code> of entity group to associate
 * @apiSuccess {Object} user Created user
 * @apiSuccess {Integer} user.id <code>id</code> of user
 * @apiSuccess {String} user.f_login <code>f_login</code> of user
 * @apiSuccess {String} user.f_email <code>f_email</code> of user
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create user
 */

/**
 * @api {put} /api/user/:id?token=TOKEN 5 - Update user
 * @apiGroup User
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the user to update
 * @apiParam (Body parameters) {String} f_login New value of <code>f_login</code> for user
 * @apiParam (Body parameters) {String} f_email New value of <code>f_email</code> for user
 * @apiParam (Body parameters) {Integer} f_id_role_role <code>id</code> of entity role to associate
 * @apiParam (Body parameters) {Integer} f_id_group_group <code>id</code> of entity group to associate
 * @apiSuccess {Object} user Updated user
 * @apiSuccess {Integer} user.id <code>id</code> of user
 * @apiSuccess {String} user.f_login <code>f_login</code> of user
 * @apiSuccess {String} user.f_email <code>f_email</code> of user
 * @apiError (Error 404) {Object} NotFound No user with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update user
 */

/**
 * @api {delete} /api/user/:id?token=TOKEN 6 - Delete user
 * @apiGroup User
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of user to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No user with ID <code>id</code> found
 */

/**
 * @api {get} /api/role?token=TOKEN 1 - Fetch multiple role
 * @apiGroup Role
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} roles List of role
 * @apiSuccess {Integer} roles.id <code>id</code> of role
 * @apiSuccess {Integer} roles.version <code>version</code> of role
 * @apiSuccess {String} roles.f_label <code>f_label</code> of role
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/role/:id?token=TOKEN&limit=10&offset=0 2 - Fetch role with specified id
 * @apiGroup Role
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of role to fetch
 * @apiSuccess {Object} role Object of role
 * @apiSuccess {Integer} role.id <code>id</code> of role
 * @apiSuccess {Integer} role.version <code>version</code> of role
 * @apiSuccess {String} role.f_label <code>f_label</code> of role
 * @apiError (Error 404) {Object} NotFound No role with ID <code>id</code> found
 */

/**
 * @api {post} /api/role/?token=TOKEN 4 - Create role
 * @apiGroup Role
 * @apiUse token
 * @apiParam (Body parameters) {String} f_label <code>f_label</code> of role
 * @apiSuccess {Object} role Created role
 * @apiSuccess {Integer} role.id <code>id</code> of role
 * @apiSuccess {String} role.f_label <code>f_label</code> of role
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create role
 */

/**
 * @api {put} /api/role/:id?token=TOKEN 5 - Update role
 * @apiGroup Role
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the role to update
 * @apiParam (Body parameters) {String} f_label New value of <code>f_label</code> for role
 * @apiSuccess {Object} role Updated role
 * @apiSuccess {Integer} role.id <code>id</code> of role
 * @apiSuccess {String} role.f_label <code>f_label</code> of role
 * @apiError (Error 404) {Object} NotFound No role with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update role
 */

/**
 * @api {delete} /api/role/:id?token=TOKEN 6 - Delete role
 * @apiGroup Role
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of role to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No role with ID <code>id</code> found
 */

/**
 * @api {get} /api/group?token=TOKEN 1 - Fetch multiple group
 * @apiGroup Group
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} groups List of group
 * @apiSuccess {Integer} groups.id <code>id</code> of group
 * @apiSuccess {Integer} groups.version <code>version</code> of group
 * @apiSuccess {String} groups.f_label <code>f_label</code> of group
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/group/:id?token=TOKEN&limit=10&offset=0 2 - Fetch group with specified id
 * @apiGroup Group
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of group to fetch
 * @apiSuccess {Object} group Object of group
 * @apiSuccess {Integer} group.id <code>id</code> of group
 * @apiSuccess {Integer} group.version <code>version</code> of group
 * @apiSuccess {String} group.f_label <code>f_label</code> of group
 * @apiError (Error 404) {Object} NotFound No group with ID <code>id</code> found
 */

/**
 * @api {post} /api/group/?token=TOKEN 4 - Create group
 * @apiGroup Group
 * @apiUse token
 * @apiParam (Body parameters) {String} f_label <code>f_label</code> of group
 * @apiSuccess {Object} group Created group
 * @apiSuccess {Integer} group.id <code>id</code> of group
 * @apiSuccess {String} group.f_label <code>f_label</code> of group
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create group
 */

/**
 * @api {put} /api/group/:id?token=TOKEN 5 - Update group
 * @apiGroup Group
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the group to update
 * @apiParam (Body parameters) {String} f_label New value of <code>f_label</code> for group
 * @apiSuccess {Object} group Updated group
 * @apiSuccess {Integer} group.id <code>id</code> of group
 * @apiSuccess {String} group.f_label <code>f_label</code> of group
 * @apiError (Error 404) {Object} NotFound No group with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update group
 */

/**
 * @api {delete} /api/group/:id?token=TOKEN 6 - Delete group
 * @apiGroup Group
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of group to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No group with ID <code>id</code> found
 */

/**
 * @api {get} /api/api_credentials?token=TOKEN 1 - Fetch multiple api_credentials
 * @apiGroup Api_credentials
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} api_credentialss List of api_credentials
 * @apiSuccess {Integer} api_credentialss.id <code>id</code> of api_credentials
 * @apiSuccess {Integer} api_credentialss.version <code>version</code> of api_credentials
 * @apiSuccess {String} api_credentialss.f_client_key <code>f_client_key</code> of api_credentials
 * @apiSuccess {String} api_credentialss.f_client_secret <code>f_client_secret</code> of api_credentials
 * @apiSuccess {String} api_credentialss.f_token <code>f_token</code> of api_credentials
 * @apiSuccess {String} api_credentialss.f_token_timeout_tmsp <code>f_token_timeout_tmsp</code> of api_credentials
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/api_credentials/:id?token=TOKEN&limit=10&offset=0 2 - Fetch api_credentials with specified id
 * @apiGroup Api_credentials
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of api_credentials to fetch
 * @apiSuccess {Object} api_credentials Object of api_credentials
 * @apiSuccess {Integer} api_credentials.id <code>id</code> of api_credentials
 * @apiSuccess {Integer} api_credentials.version <code>version</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_client_key <code>f_client_key</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_client_secret <code>f_client_secret</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_token <code>f_token</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_token_timeout_tmsp <code>f_token_timeout_tmsp</code> of api_credentials
 * @apiError (Error 404) {Object} NotFound No api_credentials with ID <code>id</code> found
 */

/**
 * @api {get} /api/api_credentials/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of api_credentials
 * @apiGroup Api_credentials
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the api_credentials to which <code>association</code> is related
 * @apiParam (Params parameters) {String=role,group} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No api_credentials with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/api_credentials/?token=TOKEN 4 - Create api_credentials
 * @apiGroup Api_credentials
 * @apiUse token
 * @apiParam (Body parameters) {String} f_client_key <code>f_client_key</code> of api_credentials
 * @apiParam (Body parameters) {String} f_client_secret <code>f_client_secret</code> of api_credentials
 * @apiParam (Body parameters) {String} f_token <code>f_token</code> of api_credentials
 * @apiParam (Body parameters) {String} f_token_timeout_tmsp <code>f_token_timeout_tmsp</code> of api_credentials
 * @apiParam (Body parameters) {Integer} f_id_role_role <code>id</code> of entity role to associate
 * @apiParam (Body parameters) {Integer} f_id_group_group <code>id</code> of entity group to associate
 * @apiSuccess {Object} api_credentials Created api_credentials
 * @apiSuccess {Integer} api_credentials.id <code>id</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_client_key <code>f_client_key</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_client_secret <code>f_client_secret</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_token <code>f_token</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_token_timeout_tmsp <code>f_token_timeout_tmsp</code> of api_credentials
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create api_credentials
 */

/**
 * @api {put} /api/api_credentials/:id?token=TOKEN 5 - Update api_credentials
 * @apiGroup Api_credentials
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the api_credentials to update
 * @apiParam (Body parameters) {String} f_client_key New value of <code>f_client_key</code> for api_credentials
 * @apiParam (Body parameters) {String} f_client_secret New value of <code>f_client_secret</code> for api_credentials
 * @apiParam (Body parameters) {String} f_token New value of <code>f_token</code> for api_credentials
 * @apiParam (Body parameters) {String} f_token_timeout_tmsp New value of <code>f_token_timeout_tmsp</code> for api_credentials
 * @apiParam (Body parameters) {Integer} f_id_role_role <code>id</code> of entity role to associate
 * @apiParam (Body parameters) {Integer} f_id_group_group <code>id</code> of entity group to associate
 * @apiSuccess {Object} api_credentials Updated api_credentials
 * @apiSuccess {Integer} api_credentials.id <code>id</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_client_key <code>f_client_key</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_client_secret <code>f_client_secret</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_token <code>f_token</code> of api_credentials
 * @apiSuccess {String} api_credentials.f_token_timeout_tmsp <code>f_token_timeout_tmsp</code> of api_credentials
 * @apiError (Error 404) {Object} NotFound No api_credentials with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update api_credentials
 */

/**
 * @api {delete} /api/api_credentials/:id?token=TOKEN 6 - Delete api_credentials
 * @apiGroup Api_credentials
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of api_credentials to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No api_credentials with ID <code>id</code> found
 */

/**
 * @api {get} /api/categorie?token=TOKEN 1 - Fetch multiple categorie
 * @apiGroup Categorie
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} categories List of categorie
 * @apiSuccess {Integer} categories.id <code>id</code> of categorie
 * @apiSuccess {Integer} categories.version <code>version</code> of categorie
 * @apiSuccess {String} categories.f_libelle <code>f_libelle</code> of categorie
 * @apiSuccess {String} categories.f_codegestion <code>f_codegestion</code> of categorie
 * @apiSuccess {Boolean} categories.f_specialisee <code>f_specialisee</code> of categorie
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/categorie/:id?token=TOKEN&limit=10&offset=0 2 - Fetch categorie with specified id
 * @apiGroup Categorie
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of categorie to fetch
 * @apiSuccess {Object} categorie Object of categorie
 * @apiSuccess {Integer} categorie.id <code>id</code> of categorie
 * @apiSuccess {Integer} categorie.version <code>version</code> of categorie
 * @apiSuccess {String} categorie.f_libelle <code>f_libelle</code> of categorie
 * @apiSuccess {String} categorie.f_codegestion <code>f_codegestion</code> of categorie
 * @apiSuccess {Boolean} categorie.f_specialisee <code>f_specialisee</code> of categorie
 * @apiError (Error 404) {Object} NotFound No categorie with ID <code>id</code> found
 */

/**
 * @api {get} /api/categorie/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of categorie
 * @apiGroup Categorie
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the categorie to which <code>association</code> is related
 * @apiParam (Params parameters) {String=produit} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No categorie with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/categorie/?token=TOKEN 4 - Create categorie
 * @apiGroup Categorie
 * @apiUse token
 * @apiParam (Body parameters) {String} f_libelle <code>f_libelle</code> of categorie
 * @apiParam (Body parameters) {String} f_codegestion <code>f_codegestion</code> of categorie
 * @apiParam (Body parameters) {Boolean} f_specialisee <code>f_specialisee</code> of categorie
 * @apiParam (Body parameters) {Integer} f_id_categorie_listeproduits <code>id</code> of entity produit to associate
 * @apiSuccess {Object} categorie Created categorie
 * @apiSuccess {Integer} categorie.id <code>id</code> of categorie
 * @apiSuccess {String} categorie.f_libelle <code>f_libelle</code> of categorie
 * @apiSuccess {String} categorie.f_codegestion <code>f_codegestion</code> of categorie
 * @apiSuccess {Boolean} categorie.f_specialisee <code>f_specialisee</code> of categorie
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create categorie
 */

/**
 * @api {put} /api/categorie/:id?token=TOKEN 5 - Update categorie
 * @apiGroup Categorie
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the categorie to update
 * @apiParam (Body parameters) {String} f_libelle New value of <code>f_libelle</code> for categorie
 * @apiParam (Body parameters) {String} f_codegestion New value of <code>f_codegestion</code> for categorie
 * @apiParam (Body parameters) {Boolean} f_specialisee New value of <code>f_specialisee</code> for categorie
 * @apiParam (Body parameters) {Integer} f_id_categorie_listeproduits <code>id</code> of entity produit to associate
 * @apiSuccess {Object} categorie Updated categorie
 * @apiSuccess {Integer} categorie.id <code>id</code> of categorie
 * @apiSuccess {String} categorie.f_libelle <code>f_libelle</code> of categorie
 * @apiSuccess {String} categorie.f_codegestion <code>f_codegestion</code> of categorie
 * @apiSuccess {Boolean} categorie.f_specialisee <code>f_specialisee</code> of categorie
 * @apiError (Error 404) {Object} NotFound No categorie with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update categorie
 */

/**
 * @api {delete} /api/categorie/:id?token=TOKEN 6 - Delete categorie
 * @apiGroup Categorie
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of categorie to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No categorie with ID <code>id</code> found
 */

/**
 * @api {get} /api/produit?token=TOKEN 1 - Fetch multiple produit
 * @apiGroup Produit
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} produits List of produit
 * @apiSuccess {Integer} produits.id <code>id</code> of produit
 * @apiSuccess {Integer} produits.version <code>version</code> of produit
 * @apiSuccess {String} produits.f_libelle <code>f_libelle</code> of produit
 * @apiSuccess {String} produits.f_codegestion <code>f_codegestion</code> of produit
 * @apiSuccess {String} produits.f_codegestiontype <code>f_codegestiontype</code> of produit
 * @apiSuccess {String} produits.f_codegestionsoustype <code>f_codegestionsoustype</code> of produit
 * @apiSuccess {String} produits.f_prixunitaire <code>f_prixunitaire</code> of produit
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/produit/:id?token=TOKEN&limit=10&offset=0 2 - Fetch produit with specified id
 * @apiGroup Produit
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of produit to fetch
 * @apiSuccess {Object} produit Object of produit
 * @apiSuccess {Integer} produit.id <code>id</code> of produit
 * @apiSuccess {Integer} produit.version <code>version</code> of produit
 * @apiSuccess {String} produit.f_libelle <code>f_libelle</code> of produit
 * @apiSuccess {String} produit.f_codegestion <code>f_codegestion</code> of produit
 * @apiSuccess {String} produit.f_codegestiontype <code>f_codegestiontype</code> of produit
 * @apiSuccess {String} produit.f_codegestionsoustype <code>f_codegestionsoustype</code> of produit
 * @apiSuccess {String} produit.f_prixunitaire <code>f_prixunitaire</code> of produit
 * @apiError (Error 404) {Object} NotFound No produit with ID <code>id</code> found
 */

/**
 * @api {post} /api/produit/?token=TOKEN 4 - Create produit
 * @apiGroup Produit
 * @apiUse token
 * @apiParam (Body parameters) {String} f_libelle <code>f_libelle</code> of produit
 * @apiParam (Body parameters) {String} f_codegestion <code>f_codegestion</code> of produit
 * @apiParam (Body parameters) {String} f_codegestiontype <code>f_codegestiontype</code> of produit
 * @apiParam (Body parameters) {String} f_codegestionsoustype <code>f_codegestionsoustype</code> of produit
 * @apiParam (Body parameters) {String} f_prixunitaire <code>f_prixunitaire</code> of produit
 * @apiSuccess {Object} produit Created produit
 * @apiSuccess {Integer} produit.id <code>id</code> of produit
 * @apiSuccess {String} produit.f_libelle <code>f_libelle</code> of produit
 * @apiSuccess {String} produit.f_codegestion <code>f_codegestion</code> of produit
 * @apiSuccess {String} produit.f_codegestiontype <code>f_codegestiontype</code> of produit
 * @apiSuccess {String} produit.f_codegestionsoustype <code>f_codegestionsoustype</code> of produit
 * @apiSuccess {String} produit.f_prixunitaire <code>f_prixunitaire</code> of produit
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create produit
 */

/**
 * @api {put} /api/produit/:id?token=TOKEN 5 - Update produit
 * @apiGroup Produit
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the produit to update
 * @apiParam (Body parameters) {String} f_libelle New value of <code>f_libelle</code> for produit
 * @apiParam (Body parameters) {String} f_codegestion New value of <code>f_codegestion</code> for produit
 * @apiParam (Body parameters) {String} f_codegestiontype New value of <code>f_codegestiontype</code> for produit
 * @apiParam (Body parameters) {String} f_codegestionsoustype New value of <code>f_codegestionsoustype</code> for produit
 * @apiParam (Body parameters) {String} f_prixunitaire New value of <code>f_prixunitaire</code> for produit
 * @apiSuccess {Object} produit Updated produit
 * @apiSuccess {Integer} produit.id <code>id</code> of produit
 * @apiSuccess {String} produit.f_libelle <code>f_libelle</code> of produit
 * @apiSuccess {String} produit.f_codegestion <code>f_codegestion</code> of produit
 * @apiSuccess {String} produit.f_codegestiontype <code>f_codegestiontype</code> of produit
 * @apiSuccess {String} produit.f_codegestionsoustype <code>f_codegestionsoustype</code> of produit
 * @apiSuccess {String} produit.f_prixunitaire <code>f_prixunitaire</code> of produit
 * @apiError (Error 404) {Object} NotFound No produit with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update produit
 */

/**
 * @api {delete} /api/produit/:id?token=TOKEN 6 - Delete produit
 * @apiGroup Produit
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of produit to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No produit with ID <code>id</code> found
 */

/**
 * @api {get} /api/classerepartition?token=TOKEN 1 - Fetch multiple classerepartition
 * @apiGroup Classerepartition
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} classerepartitions List of classerepartition
 * @apiSuccess {Integer} classerepartitions.id <code>id</code> of classerepartition
 * @apiSuccess {Integer} classerepartitions.version <code>version</code> of classerepartition
 * @apiSuccess {String} classerepartitions.f_code <code>f_code</code> of classerepartition
 * @apiSuccess {String} classerepartitions.f_libelle <code>f_libelle</code> of classerepartition
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/classerepartition/:id?token=TOKEN&limit=10&offset=0 2 - Fetch classerepartition with specified id
 * @apiGroup Classerepartition
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of classerepartition to fetch
 * @apiSuccess {Object} classerepartition Object of classerepartition
 * @apiSuccess {Integer} classerepartition.id <code>id</code> of classerepartition
 * @apiSuccess {Integer} classerepartition.version <code>version</code> of classerepartition
 * @apiSuccess {String} classerepartition.f_code <code>f_code</code> of classerepartition
 * @apiSuccess {String} classerepartition.f_libelle <code>f_libelle</code> of classerepartition
 * @apiError (Error 404) {Object} NotFound No classerepartition with ID <code>id</code> found
 */

/**
 * @api {post} /api/classerepartition/?token=TOKEN 4 - Create classerepartition
 * @apiGroup Classerepartition
 * @apiUse token
 * @apiParam (Body parameters) {String} f_code <code>f_code</code> of classerepartition
 * @apiParam (Body parameters) {String} f_libelle <code>f_libelle</code> of classerepartition
 * @apiSuccess {Object} classerepartition Created classerepartition
 * @apiSuccess {Integer} classerepartition.id <code>id</code> of classerepartition
 * @apiSuccess {String} classerepartition.f_code <code>f_code</code> of classerepartition
 * @apiSuccess {String} classerepartition.f_libelle <code>f_libelle</code> of classerepartition
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create classerepartition
 */

/**
 * @api {put} /api/classerepartition/:id?token=TOKEN 5 - Update classerepartition
 * @apiGroup Classerepartition
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the classerepartition to update
 * @apiParam (Body parameters) {String} f_code New value of <code>f_code</code> for classerepartition
 * @apiParam (Body parameters) {String} f_libelle New value of <code>f_libelle</code> for classerepartition
 * @apiSuccess {Object} classerepartition Updated classerepartition
 * @apiSuccess {Integer} classerepartition.id <code>id</code> of classerepartition
 * @apiSuccess {String} classerepartition.f_code <code>f_code</code> of classerepartition
 * @apiSuccess {String} classerepartition.f_libelle <code>f_libelle</code> of classerepartition
 * @apiError (Error 404) {Object} NotFound No classerepartition with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update classerepartition
 */

/**
 * @api {delete} /api/classerepartition/:id?token=TOKEN 6 - Delete classerepartition
 * @apiGroup Classerepartition
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of classerepartition to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No classerepartition with ID <code>id</code> found
 */

/**
 * @api {get} /api/abattement?token=TOKEN 1 - Fetch multiple abattement
 * @apiGroup Abattement
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} abattements List of abattement
 * @apiSuccess {Integer} abattements.id <code>id</code> of abattement
 * @apiSuccess {Integer} abattements.version <code>version</code> of abattement
 * @apiSuccess {Integer} abattements.f_pourcentage <code>f_pourcentage</code> of abattement
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/abattement/:id?token=TOKEN&limit=10&offset=0 2 - Fetch abattement with specified id
 * @apiGroup Abattement
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of abattement to fetch
 * @apiSuccess {Object} abattement Object of abattement
 * @apiSuccess {Integer} abattement.id <code>id</code> of abattement
 * @apiSuccess {Integer} abattement.version <code>version</code> of abattement
 * @apiSuccess {Integer} abattement.f_pourcentage <code>f_pourcentage</code> of abattement
 * @apiError (Error 404) {Object} NotFound No abattement with ID <code>id</code> found
 */

/**
 * @api {get} /api/abattement/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of abattement
 * @apiGroup Abattement
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the abattement to which <code>association</code> is related
 * @apiParam (Params parameters) {String=categorie,classerepartition} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No abattement with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/abattement/?token=TOKEN 4 - Create abattement
 * @apiGroup Abattement
 * @apiUse token
 * @apiParam (Body parameters) {Integer} f_pourcentage <code>f_pourcentage</code> of abattement
 * @apiParam (Body parameters) {Integer} f_id_categorie_categorie <code>id</code> of entity categorie to associate
 * @apiParam (Body parameters) {Integer} f_id_classerepartition_classeabattement <code>id</code> of entity classerepartition to associate
 * @apiSuccess {Object} abattement Created abattement
 * @apiSuccess {Integer} abattement.id <code>id</code> of abattement
 * @apiSuccess {Integer} abattement.f_pourcentage <code>f_pourcentage</code> of abattement
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create abattement
 */

/**
 * @api {put} /api/abattement/:id?token=TOKEN 5 - Update abattement
 * @apiGroup Abattement
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the abattement to update
 * @apiParam (Body parameters) {Integer} f_pourcentage New value of <code>f_pourcentage</code> for abattement
 * @apiParam (Body parameters) {Integer} f_id_categorie_categorie <code>id</code> of entity categorie to associate
 * @apiParam (Body parameters) {Integer} f_id_classerepartition_classeabattement <code>id</code> of entity classerepartition to associate
 * @apiSuccess {Object} abattement Updated abattement
 * @apiSuccess {Integer} abattement.id <code>id</code> of abattement
 * @apiSuccess {Integer} abattement.f_pourcentage <code>f_pourcentage</code> of abattement
 * @apiError (Error 404) {Object} NotFound No abattement with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update abattement
 */

/**
 * @api {delete} /api/abattement/:id?token=TOKEN 6 - Delete abattement
 * @apiGroup Abattement
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of abattement to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No abattement with ID <code>id</code> found
 */

/**
 * @api {get} /api/profil?token=TOKEN 1 - Fetch multiple profil
 * @apiGroup Profil
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} profils List of profil
 * @apiSuccess {Integer} profils.id <code>id</code> of profil
 * @apiSuccess {Integer} profils.version <code>version</code> of profil
 * @apiSuccess {String} profils.f_libelle_ <code>f_libelle_</code> of profil
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/profil/:id?token=TOKEN&limit=10&offset=0 2 - Fetch profil with specified id
 * @apiGroup Profil
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of profil to fetch
 * @apiSuccess {Object} profil Object of profil
 * @apiSuccess {Integer} profil.id <code>id</code> of profil
 * @apiSuccess {Integer} profil.version <code>version</code> of profil
 * @apiSuccess {String} profil.f_libelle_ <code>f_libelle_</code> of profil
 * @apiError (Error 404) {Object} NotFound No profil with ID <code>id</code> found
 */

/**
 * @api {post} /api/profil/?token=TOKEN 4 - Create profil
 * @apiGroup Profil
 * @apiUse token
 * @apiParam (Body parameters) {String} f_libelle_ <code>f_libelle_</code> of profil
 * @apiSuccess {Object} profil Created profil
 * @apiSuccess {Integer} profil.id <code>id</code> of profil
 * @apiSuccess {String} profil.f_libelle_ <code>f_libelle_</code> of profil
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create profil
 */

/**
 * @api {put} /api/profil/:id?token=TOKEN 5 - Update profil
 * @apiGroup Profil
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the profil to update
 * @apiParam (Body parameters) {String} f_libelle_ New value of <code>f_libelle_</code> for profil
 * @apiSuccess {Object} profil Updated profil
 * @apiSuccess {Integer} profil.id <code>id</code> of profil
 * @apiSuccess {String} profil.f_libelle_ <code>f_libelle_</code> of profil
 * @apiError (Error 404) {Object} NotFound No profil with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update profil
 */

/**
 * @api {delete} /api/profil/:id?token=TOKEN 6 - Delete profil
 * @apiGroup Profil
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of profil to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No profil with ID <code>id</code> found
 */

/**
 * @api {get} /api/roleutilisateur?token=TOKEN 1 - Fetch multiple roleutilisateur
 * @apiGroup Roleutilisateur
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} roleutilisateurs List of roleutilisateur
 * @apiSuccess {Integer} roleutilisateurs.id <code>id</code> of roleutilisateur
 * @apiSuccess {Integer} roleutilisateurs.version <code>version</code> of roleutilisateur
 * @apiSuccess {String} roleutilisateurs.f_libelle <code>f_libelle</code> of roleutilisateur
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/roleutilisateur/:id?token=TOKEN&limit=10&offset=0 2 - Fetch roleutilisateur with specified id
 * @apiGroup Roleutilisateur
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of roleutilisateur to fetch
 * @apiSuccess {Object} roleutilisateur Object of roleutilisateur
 * @apiSuccess {Integer} roleutilisateur.id <code>id</code> of roleutilisateur
 * @apiSuccess {Integer} roleutilisateur.version <code>version</code> of roleutilisateur
 * @apiSuccess {String} roleutilisateur.f_libelle <code>f_libelle</code> of roleutilisateur
 * @apiError (Error 404) {Object} NotFound No roleutilisateur with ID <code>id</code> found
 */

/**
 * @api {post} /api/roleutilisateur/?token=TOKEN 4 - Create roleutilisateur
 * @apiGroup Roleutilisateur
 * @apiUse token
 * @apiParam (Body parameters) {String} f_libelle <code>f_libelle</code> of roleutilisateur
 * @apiSuccess {Object} roleutilisateur Created roleutilisateur
 * @apiSuccess {Integer} roleutilisateur.id <code>id</code> of roleutilisateur
 * @apiSuccess {String} roleutilisateur.f_libelle <code>f_libelle</code> of roleutilisateur
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create roleutilisateur
 */

/**
 * @api {put} /api/roleutilisateur/:id?token=TOKEN 5 - Update roleutilisateur
 * @apiGroup Roleutilisateur
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the roleutilisateur to update
 * @apiParam (Body parameters) {String} f_libelle New value of <code>f_libelle</code> for roleutilisateur
 * @apiSuccess {Object} roleutilisateur Updated roleutilisateur
 * @apiSuccess {Integer} roleutilisateur.id <code>id</code> of roleutilisateur
 * @apiSuccess {String} roleutilisateur.f_libelle <code>f_libelle</code> of roleutilisateur
 * @apiError (Error 404) {Object} NotFound No roleutilisateur with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update roleutilisateur
 */

/**
 * @api {delete} /api/roleutilisateur/:id?token=TOKEN 6 - Delete roleutilisateur
 * @apiGroup Roleutilisateur
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of roleutilisateur to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No roleutilisateur with ID <code>id</code> found
 */

/**
 * @api {get} /api/collectivite?token=TOKEN 1 - Fetch multiple collectivite
 * @apiGroup Collectivite
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} collectivites List of collectivite
 * @apiSuccess {Integer} collectivites.id <code>id</code> of collectivite
 * @apiSuccess {Integer} collectivites.version <code>version</code> of collectivite
 * @apiSuccess {String} collectivites.f_nom <code>f_nom</code> of collectivite
 * @apiSuccess {String} collectivites.f_codegestion <code>f_codegestion</code> of collectivite
 * @apiSuccess {String} collectivites.f_siret <code>f_siret</code> of collectivite
 * @apiSuccess {Enum} collectivites.f_statut <code>f_statut</code> of collectivite
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/collectivite/:id?token=TOKEN&limit=10&offset=0 2 - Fetch collectivite with specified id
 * @apiGroup Collectivite
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of collectivite to fetch
 * @apiSuccess {Object} collectivite Object of collectivite
 * @apiSuccess {Integer} collectivite.id <code>id</code> of collectivite
 * @apiSuccess {Integer} collectivite.version <code>version</code> of collectivite
 * @apiSuccess {String} collectivite.f_nom <code>f_nom</code> of collectivite
 * @apiSuccess {String} collectivite.f_codegestion <code>f_codegestion</code> of collectivite
 * @apiSuccess {String} collectivite.f_siret <code>f_siret</code> of collectivite
 * @apiSuccess {Enum} collectivite.f_statut <code>f_statut</code> of collectivite
 * @apiError (Error 404) {Object} NotFound No collectivite with ID <code>id</code> found
 */

/**
 * @api {get} /api/collectivite/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of collectivite
 * @apiGroup Collectivite
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the collectivite to which <code>association</code> is related
 * @apiParam (Params parameters) {String=adresse} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No collectivite with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/collectivite/?token=TOKEN 4 - Create collectivite
 * @apiGroup Collectivite
 * @apiUse token
 * @apiParam (Body parameters) {String} f_nom <code>f_nom</code> of collectivite
 * @apiParam (Body parameters) {String} f_codegestion <code>f_codegestion</code> of collectivite
 * @apiParam (Body parameters) {String} f_siret <code>f_siret</code> of collectivite
 * @apiParam (Body parameters) {Enum} f_statut <code>f_statut</code> of collectivite
 * @apiParam (Body parameters) {Integer} f_id_adresse <code>id</code> of entity adresse to associate
 * @apiSuccess {Object} collectivite Created collectivite
 * @apiSuccess {Integer} collectivite.id <code>id</code> of collectivite
 * @apiSuccess {String} collectivite.f_nom <code>f_nom</code> of collectivite
 * @apiSuccess {String} collectivite.f_codegestion <code>f_codegestion</code> of collectivite
 * @apiSuccess {String} collectivite.f_siret <code>f_siret</code> of collectivite
 * @apiSuccess {Enum} collectivite.f_statut <code>f_statut</code> of collectivite
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create collectivite
 */

/**
 * @api {put} /api/collectivite/:id?token=TOKEN 5 - Update collectivite
 * @apiGroup Collectivite
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the collectivite to update
 * @apiParam (Body parameters) {String} f_nom New value of <code>f_nom</code> for collectivite
 * @apiParam (Body parameters) {String} f_codegestion New value of <code>f_codegestion</code> for collectivite
 * @apiParam (Body parameters) {String} f_siret New value of <code>f_siret</code> for collectivite
 * @apiParam (Body parameters) {Enum} f_statut New value of <code>f_statut</code> for collectivite
 * @apiParam (Body parameters) {Integer} f_id_adresse <code>id</code> of entity adresse to associate
 * @apiSuccess {Object} collectivite Updated collectivite
 * @apiSuccess {Integer} collectivite.id <code>id</code> of collectivite
 * @apiSuccess {String} collectivite.f_nom <code>f_nom</code> of collectivite
 * @apiSuccess {String} collectivite.f_codegestion <code>f_codegestion</code> of collectivite
 * @apiSuccess {String} collectivite.f_siret <code>f_siret</code> of collectivite
 * @apiSuccess {Enum} collectivite.f_statut <code>f_statut</code> of collectivite
 * @apiError (Error 404) {Object} NotFound No collectivite with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update collectivite
 */

/**
 * @api {delete} /api/collectivite/:id?token=TOKEN 6 - Delete collectivite
 * @apiGroup Collectivite
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of collectivite to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No collectivite with ID <code>id</code> found
 */

/**
 * @api {get} /api/adresse?token=TOKEN 1 - Fetch multiple adresse
 * @apiGroup Adresse
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} adresses List of adresse
 * @apiSuccess {Integer} adresses.id <code>id</code> of adresse
 * @apiSuccess {Integer} adresses.version <code>version</code> of adresse
 * @apiSuccess {String} adresses.f_rue <code>f_rue</code> of adresse
 * @apiSuccess {String} adresses.f_complement1 <code>f_complement1</code> of adresse
 * @apiSuccess {String} adresses.f_complement2 <code>f_complement2</code> of adresse
 * @apiSuccess {String} adresses.f_codepostal <code>f_codepostal</code> of adresse
 * @apiSuccess {String} adresses.f_ville <code>f_ville</code> of adresse
 * @apiSuccess {String} adresses.f_pays <code>f_pays</code> of adresse
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/adresse/:id?token=TOKEN&limit=10&offset=0 2 - Fetch adresse with specified id
 * @apiGroup Adresse
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of adresse to fetch
 * @apiSuccess {Object} adresse Object of adresse
 * @apiSuccess {Integer} adresse.id <code>id</code> of adresse
 * @apiSuccess {Integer} adresse.version <code>version</code> of adresse
 * @apiSuccess {String} adresse.f_rue <code>f_rue</code> of adresse
 * @apiSuccess {String} adresse.f_complement1 <code>f_complement1</code> of adresse
 * @apiSuccess {String} adresse.f_complement2 <code>f_complement2</code> of adresse
 * @apiSuccess {String} adresse.f_codepostal <code>f_codepostal</code> of adresse
 * @apiSuccess {String} adresse.f_ville <code>f_ville</code> of adresse
 * @apiSuccess {String} adresse.f_pays <code>f_pays</code> of adresse
 * @apiError (Error 404) {Object} NotFound No adresse with ID <code>id</code> found
 */

/**
 * @api {post} /api/adresse/?token=TOKEN 4 - Create adresse
 * @apiGroup Adresse
 * @apiUse token
 * @apiParam (Body parameters) {String} f_rue <code>f_rue</code> of adresse
 * @apiParam (Body parameters) {String} f_complement1 <code>f_complement1</code> of adresse
 * @apiParam (Body parameters) {String} f_complement2 <code>f_complement2</code> of adresse
 * @apiParam (Body parameters) {String} f_codepostal <code>f_codepostal</code> of adresse
 * @apiParam (Body parameters) {String} f_ville <code>f_ville</code> of adresse
 * @apiParam (Body parameters) {String} f_pays <code>f_pays</code> of adresse
 * @apiSuccess {Object} adresse Created adresse
 * @apiSuccess {Integer} adresse.id <code>id</code> of adresse
 * @apiSuccess {String} adresse.f_rue <code>f_rue</code> of adresse
 * @apiSuccess {String} adresse.f_complement1 <code>f_complement1</code> of adresse
 * @apiSuccess {String} adresse.f_complement2 <code>f_complement2</code> of adresse
 * @apiSuccess {String} adresse.f_codepostal <code>f_codepostal</code> of adresse
 * @apiSuccess {String} adresse.f_ville <code>f_ville</code> of adresse
 * @apiSuccess {String} adresse.f_pays <code>f_pays</code> of adresse
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create adresse
 */

/**
 * @api {put} /api/adresse/:id?token=TOKEN 5 - Update adresse
 * @apiGroup Adresse
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the adresse to update
 * @apiParam (Body parameters) {String} f_rue New value of <code>f_rue</code> for adresse
 * @apiParam (Body parameters) {String} f_complement1 New value of <code>f_complement1</code> for adresse
 * @apiParam (Body parameters) {String} f_complement2 New value of <code>f_complement2</code> for adresse
 * @apiParam (Body parameters) {String} f_codepostal New value of <code>f_codepostal</code> for adresse
 * @apiParam (Body parameters) {String} f_ville New value of <code>f_ville</code> for adresse
 * @apiParam (Body parameters) {String} f_pays New value of <code>f_pays</code> for adresse
 * @apiSuccess {Object} adresse Updated adresse
 * @apiSuccess {Integer} adresse.id <code>id</code> of adresse
 * @apiSuccess {String} adresse.f_rue <code>f_rue</code> of adresse
 * @apiSuccess {String} adresse.f_complement1 <code>f_complement1</code> of adresse
 * @apiSuccess {String} adresse.f_complement2 <code>f_complement2</code> of adresse
 * @apiSuccess {String} adresse.f_codepostal <code>f_codepostal</code> of adresse
 * @apiSuccess {String} adresse.f_ville <code>f_ville</code> of adresse
 * @apiSuccess {String} adresse.f_pays <code>f_pays</code> of adresse
 * @apiError (Error 404) {Object} NotFound No adresse with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update adresse
 */

/**
 * @api {delete} /api/adresse/:id?token=TOKEN 6 - Delete adresse
 * @apiGroup Adresse
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of adresse to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No adresse with ID <code>id</code> found
 */

/**
 * @api {get} /api/msm?token=TOKEN 1 - Fetch multiple msm
 * @apiGroup Msm
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} msms List of msm
 * @apiSuccess {Integer} msms.id <code>id</code> of msm
 * @apiSuccess {Integer} msms.version <code>version</code> of msm
 * @apiSuccess {String} msms.f_nom <code>f_nom</code> of msm
 * @apiSuccess {String} msms.f_codegestion <code>f_codegestion</code> of msm
 * @apiSuccess {Enum} msms.f_statut <code>f_statut</code> of msm
 * @apiSuccess {String} msms.f_siret_ <code>f_siret_</code> of msm
 * @apiSuccess {String} msms.f_identifianttva <code>f_identifianttva</code> of msm
 * @apiSuccess {Enum} msms.f_typeinscription <code>f_typeinscription</code> of msm
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/msm/:id?token=TOKEN&limit=10&offset=0 2 - Fetch msm with specified id
 * @apiGroup Msm
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of msm to fetch
 * @apiSuccess {Object} msm Object of msm
 * @apiSuccess {Integer} msm.id <code>id</code> of msm
 * @apiSuccess {Integer} msm.version <code>version</code> of msm
 * @apiSuccess {String} msm.f_nom <code>f_nom</code> of msm
 * @apiSuccess {String} msm.f_codegestion <code>f_codegestion</code> of msm
 * @apiSuccess {Enum} msm.f_statut <code>f_statut</code> of msm
 * @apiSuccess {String} msm.f_siret_ <code>f_siret_</code> of msm
 * @apiSuccess {String} msm.f_identifianttva <code>f_identifianttva</code> of msm
 * @apiSuccess {Enum} msm.f_typeinscription <code>f_typeinscription</code> of msm
 * @apiError (Error 404) {Object} NotFound No msm with ID <code>id</code> found
 */

/**
 * @api {get} /api/msm/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of msm
 * @apiGroup Msm
 * @apiUse tokenLimitOffset
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the msm to which <code>association</code> is related
 * @apiParam (Params parameters) {String=adresse} association Name of the related entity
 * @apiSuccess {Object} Object Object of <code>association</code>
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 * @apiError (Error 404) {Object} NotFound No msm with ID <code>id</code> found
 * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>
 */

/**
 * @api {post} /api/msm/?token=TOKEN 4 - Create msm
 * @apiGroup Msm
 * @apiUse token
 * @apiParam (Body parameters) {String} f_nom <code>f_nom</code> of msm
 * @apiParam (Body parameters) {String} f_codegestion <code>f_codegestion</code> of msm
 * @apiParam (Body parameters) {Enum} f_statut <code>f_statut</code> of msm
 * @apiParam (Body parameters) {String} f_siret_ <code>f_siret_</code> of msm
 * @apiParam (Body parameters) {String} f_identifianttva <code>f_identifianttva</code> of msm
 * @apiParam (Body parameters) {Enum} f_typeinscription <code>f_typeinscription</code> of msm
 * @apiParam (Body parameters) {Integer} f_id_adresse <code>id</code> of entity adresse to associate
 * @apiSuccess {Object} msm Created msm
 * @apiSuccess {Integer} msm.id <code>id</code> of msm
 * @apiSuccess {String} msm.f_nom <code>f_nom</code> of msm
 * @apiSuccess {String} msm.f_codegestion <code>f_codegestion</code> of msm
 * @apiSuccess {Enum} msm.f_statut <code>f_statut</code> of msm
 * @apiSuccess {String} msm.f_siret_ <code>f_siret_</code> of msm
 * @apiSuccess {String} msm.f_identifianttva <code>f_identifianttva</code> of msm
 * @apiSuccess {Enum} msm.f_typeinscription <code>f_typeinscription</code> of msm
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create msm
 */

/**
 * @api {put} /api/msm/:id?token=TOKEN 5 - Update msm
 * @apiGroup Msm
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the msm to update
 * @apiParam (Body parameters) {String} f_nom New value of <code>f_nom</code> for msm
 * @apiParam (Body parameters) {String} f_codegestion New value of <code>f_codegestion</code> for msm
 * @apiParam (Body parameters) {Enum} f_statut New value of <code>f_statut</code> for msm
 * @apiParam (Body parameters) {String} f_siret_ New value of <code>f_siret_</code> for msm
 * @apiParam (Body parameters) {String} f_identifianttva New value of <code>f_identifianttva</code> for msm
 * @apiParam (Body parameters) {Enum} f_typeinscription New value of <code>f_typeinscription</code> for msm
 * @apiParam (Body parameters) {Integer} f_id_adresse <code>id</code> of entity adresse to associate
 * @apiSuccess {Object} msm Updated msm
 * @apiSuccess {Integer} msm.id <code>id</code> of msm
 * @apiSuccess {String} msm.f_nom <code>f_nom</code> of msm
 * @apiSuccess {String} msm.f_codegestion <code>f_codegestion</code> of msm
 * @apiSuccess {Enum} msm.f_statut <code>f_statut</code> of msm
 * @apiSuccess {String} msm.f_siret_ <code>f_siret_</code> of msm
 * @apiSuccess {String} msm.f_identifianttva <code>f_identifianttva</code> of msm
 * @apiSuccess {Enum} msm.f_typeinscription <code>f_typeinscription</code> of msm
 * @apiError (Error 404) {Object} NotFound No msm with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update msm
 */

/**
 * @api {delete} /api/msm/:id?token=TOKEN 6 - Delete msm
 * @apiGroup Msm
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of msm to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No msm with ID <code>id</code> found
 */

/**
 * @api {get} /api/anneedeclaration?token=TOKEN 1 - Fetch multiple anneedeclaration
 * @apiGroup Anneedeclaration
 * @apiUse tokenLimitOffset
 * @apiSuccess {Object[]} anneedeclarations List of anneedeclaration
 * @apiSuccess {Integer} anneedeclarations.id <code>id</code> of anneedeclaration
 * @apiSuccess {Integer} anneedeclarations.version <code>version</code> of anneedeclaration
 * @apiSuccess {String} anneedeclarations.f_annee_ <code>f_annee_</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclarations.f_datedebut <code>f_datedebut</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclarations.f_datefin <code>f_datefin</code> of anneedeclaration
 * @apiSuccess {Integer} limit Limit used to fetch data
 * @apiSuccess {Integer} offset Offset used to fetch data
 */

/**
 * @api {get} /api/anneedeclaration/:id?token=TOKEN&limit=10&offset=0 2 - Fetch anneedeclaration with specified id
 * @apiGroup Anneedeclaration
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id The <code>id</code> of anneedeclaration to fetch
 * @apiSuccess {Object} anneedeclaration Object of anneedeclaration
 * @apiSuccess {Integer} anneedeclaration.id <code>id</code> of anneedeclaration
 * @apiSuccess {Integer} anneedeclaration.version <code>version</code> of anneedeclaration
 * @apiSuccess {String} anneedeclaration.f_annee_ <code>f_annee_</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclaration.f_datedebut <code>f_datedebut</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclaration.f_datefin <code>f_datefin</code> of anneedeclaration
 * @apiError (Error 404) {Object} NotFound No anneedeclaration with ID <code>id</code> found
 */

/**
 * @api {post} /api/anneedeclaration/?token=TOKEN 4 - Create anneedeclaration
 * @apiGroup Anneedeclaration
 * @apiUse token
 * @apiParam (Body parameters) {String} f_annee_ <code>f_annee_</code> of anneedeclaration
 * @apiParam (Body parameters) {Date} f_datedebut <code>f_datedebut</code> of anneedeclaration
 * @apiParam (Body parameters) {Date} f_datefin <code>f_datefin</code> of anneedeclaration
 * @apiSuccess {Object} anneedeclaration Created anneedeclaration
 * @apiSuccess {Integer} anneedeclaration.id <code>id</code> of anneedeclaration
 * @apiSuccess {String} anneedeclaration.f_annee_ <code>f_annee_</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclaration.f_datedebut <code>f_datedebut</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclaration.f_datefin <code>f_datefin</code> of anneedeclaration
 * @apiError (Error 500) {Object} ServerError An error occured when trying to create anneedeclaration
 */

/**
 * @api {put} /api/anneedeclaration/:id?token=TOKEN 5 - Update anneedeclaration
 * @apiGroup Anneedeclaration
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of the anneedeclaration to update
 * @apiParam (Body parameters) {String} f_annee_ New value of <code>f_annee_</code> for anneedeclaration
 * @apiParam (Body parameters) {Date} f_datedebut New value of <code>f_datedebut</code> for anneedeclaration
 * @apiParam (Body parameters) {Date} f_datefin New value of <code>f_datefin</code> for anneedeclaration
 * @apiSuccess {Object} anneedeclaration Updated anneedeclaration
 * @apiSuccess {Integer} anneedeclaration.id <code>id</code> of anneedeclaration
 * @apiSuccess {String} anneedeclaration.f_annee_ <code>f_annee_</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclaration.f_datedebut <code>f_datedebut</code> of anneedeclaration
 * @apiSuccess {Date} anneedeclaration.f_datefin <code>f_datefin</code> of anneedeclaration
 * @apiError (Error 404) {Object} NotFound No anneedeclaration with ID <code>id</code> found
 * @apiError (Error 500) {Object} ServerError An error occured when trying to update anneedeclaration
 */

/**
 * @api {delete} /api/anneedeclaration/:id?token=TOKEN 6 - Delete anneedeclaration
 * @apiGroup Anneedeclaration
 * @apiUse token
 * @apiParam (Params parameters) {Integer} id <code>id</code> of anneedeclaration to delete
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 * @apiError (Error 404) {Object} NotFound No anneedeclaration with ID <code>id</code> found
 */

