/**
 * @apiDefine token
 * @apiParam (Query parameters) {String} token API Bearer Token, required for authentication
 */
/**
 * @apiDefine tokenLimitOffset
 * @apiParam (Query parameters) {String} token API Bearer Token, required for authentication
 * @apiParam (Query parameters) {Integer} [limit=50] The number of rows to be fetched
 * @apiParam (Query parameters) {Integer} [offset=0] The offset by which rows will be fetched
 */

/**
 * @api {get} /api/getToken/ 1 - Basic Auth


 * @apiVersion 1.0.0
 * @apiGroup 1-General knowledge

 * @apiDescription To be able to interact with the API, you need to generate a Bearer Token using the <code>/api/getToken/</code> url
 *
 * Set your HTTP header like so with basic64 encoding : <code>Authorization clientID:clientSecret</code>

 * @apiExample {node} Example
 * var request = require('request');
 *
 * // API credentials
 * var clientKey = 'THcfYQ7sGW3jRdq';
 * var clientSecret = 'dexXLYNwdhezlxk';
 *
 * // Base64 encoding
 * var auth = 'Basic ' + new Buffer(clientKey + ':' + clientSecret).toString('base64');
 *
 * // API request
 * request(
 *     {
 *         url : 'http://127.0.0.1:9034/api/getToken',
 *         headers : {
 *             "Authorization" : auth
 *         }
 *     },
 *     function (error, response, body) {
 *     	body = JSON.parse(body);
 *         console.log(body.token);
 *     }
 * );

 * @apiHeader {String} ClientID Generated application's API credentials
 * @apiHeader {String} ClientSecret Generated application's API credentials

 * @apiSuccess {String} token Bearer Token, required for further API calls

 * @apiError (Error 500) BadAuthorizationHeader There is an invalid or no authorization header
 * @apiError (Error 401) AuthenticationFailed Couldn't match clientID/clientSecret with database
 */

/**
 * @api {get} /api/user?limit=42&offset=0&f_name=Doe&f_is_children=1&fk_id_hair_style=4 2 - Filter results
 * @apiGroup 1-General knowledge
 * @apiDescription Each entity's services <strong>1 - Find all</strong> and <strong>2 - Find one</strong> can accept an optional query parameter to filter the results.<br><br>
 * To filter on a specific field value, you need to specify the field and its encoded value along with the query parameters<br>
 * All fields and foreignKeys of an entity can be filtered that way. Have a look at target entity's <strong>create</strong> service's body to know what is available<br><br>
 * Ex:<br>You want to get all blonde users that are children of the same family "Doe", by filtering on <code>f_name</code> (string), <code>f_is_children</code> (boolean) and <code>fk_id_hair_style</code> (foreign key).<br><br>
 * Using <code>get /api/user</code> service, you would do as follow :
 */


