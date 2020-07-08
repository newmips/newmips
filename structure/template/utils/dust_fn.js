const moment = require("moment");

// ----------- Helper DUST ----------- //
// Example:
// {@myHelper} for global helpers
// {#myHelper} for context helpers (such as authentication access)

module.exports = {
	getLocals: function(locals, req, language, block_access) {

		// Translate functions
		locals.__ = function(ch, con, bo, params) {
			return ch.write(language.__(params.key).replace(/'/g, "&apos;"));
		}
		locals.M_ = function(ch, con, bo, params) {
			return ch.write(language.M_(params.key).replace(/'/g, "&apos;"));
		}

		// When user is logged
		if (req.isAuthenticated() || AUTO_LOGIN) { // eslint-disable-line
			// Session
			locals.session = req.session;

			locals.haveGroup = function(chunk, context, bodies, params) {
				const userGroups = req.session.passport.user.r_group;
				const group = params.group;
				return block_access.haveGroup(userGroups, group);
			}
			// Access control
			locals.moduleAccess = function(chunk, context, bodies, params) {
				const userGroups = req.session.passport.user.r_group;
				const moduleName = params.module;
				return block_access.moduleAccess(userGroups, moduleName);
			};
			locals.entityAccess = function(chunk, context, bodies, params) {
				const userGroups = req.session.passport.user.r_group;
				const entityName = params.entity;
				return block_access.entityAccess(userGroups, entityName);
			}
			locals.actionAccess = function(chunk, context, bodies, params) {
				const userRoles = req.session.passport.user.r_role;
				const entityName = params.entity;
				const action = params.action;
				return block_access.actionAccess(userRoles, entityName, action);
			}
			locals.checkStatusPermission = function(chunk, context, bodies, params) {
				const status = params.status;
				const acceptedGroup = status.r_accepted_group || [];
				const currentUserGroupIds = [];

				for (let i = 0; i < req.session.passport.user.r_group.length; i++)
					currentUserGroupIds.push(req.session.passport.user.r_group[i].id);

				// If no role given in status, then accepted for everyone
				if (acceptedGroup.length == 0)
					return true;
				for (let j = 0; j < acceptedGroup.length; j++)
					if (currentUserGroupIds.indexOf(acceptedGroup[j].id) != -1)
						return true;

				return false;
			}
		}
	},
	getHelpers: function(dust) {
		dust.helpers.findValueInGivenContext = function(chunk, context, bodies, params) {
			const obj = dust.helpers.tap(params.ofContext, chunk, context);

			let idx = 0;
			for (let i = 0; i < obj.length; i++) {
				if (obj[i].id == params.idx)
					idx = i;
			}

			if (typeof params.entity !== "undefined") {
				if (typeof obj[idx][params.entity] !== "undefined" && obj[idx][params.entity] != null)
					return chunk.write(obj[idx][params.entity][params.key]);
				return chunk.write("-");
			} return chunk.write(obj[idx][params.key]);
		}
		dust.helpers.existInContextById = function(chunk, context, bodies, params) {
			const obj = dust.helpers.tap(params.ofContext, chunk, context);
			for (let i = 0; i < obj.length; i++) {
				if (obj[i].id == params.key)
					return true;
			}
			return false;
		}
		dust.helpers.ifTrue = function(chunk, context, bodies, params) {
			const value = params.key;

			if (value == true || value == "true" || value == 1) {
				return true;
			}
			return false;

		}
		dust.helpers.inArray = function(chunk, context, bodies, params) {
			const value = params.value;
			const field = params.field;
			const array = params.array;

			for (let i = 0; i < array.length; i++) {
				if (array[i][field] == value)
					return true
			}
			return false;
		}
		dust.helpers.in = function(chunk, context, bodies, params) {
			const value = params.value || params.key;
			let array = params.array || params.values;
			array = array.split(',');

			// Avoid indexOf for datatype mismatch due to dust
			if (array.filter(x => x == value).length != 0)
				return true;
			return false;
		}
		dust.helpers.notIn = function(chunk, context, bodies, params) {
			const value = params.value || params.key;
			let array = params.array || params.values;
			array = array.split(',');

			// Avoid indexOf for datatype mismatch due to dust
			if (array.filter(x => x == value).length == 0)
				return true;
			return false;
		}
		function buildContext(ctx){
			let newContext = {};
			for (const obj in ctx) {
				if (obj == 'dataValues')
					newContext = {...newContext,
						...ctx[obj]
					};
				else if (ctx[obj] && typeof ctx[obj] === 'object' && ctx[obj].dataValues)
					newContext[obj] = buildContext(ctx[obj]);
				else if (!obj.startsWith('_')) // Skip Sequelize private variable
					newContext[obj] = ctx[obj];
			}
			return newContext;
		}

		function diveContext(ctx) {
			let current, results = [];
			for (const obj in ctx) {
				current = ctx[obj];
				if (typeof current === 'object') {
					switch (obj) {
						case 'stack':
						case 'tail':
							results = diveContext(current);
							break;
						case 'head':
							if (!("tail" in current))
								results.push(JSON.stringify(buildContext(current), null, 2));
							break;
						default:
							results = diveContext(current);
							break;
					}
				}
			}
			return results;
		}
		dust.helpers.contextUpperDump = function(chunk, context) {
			const results = diveContext(context);
			for (let i = 0; i < results.length; i++)
				results[i] = results[i].replace(/</g, '\\u003c');
			chunk = chunk.write(results);
		}
	},
	getFilters: function(dust, lang) {
		// ----------- Filter DUST ----------- //
		// Example {myDate|convertToDateFormat}

		dust.filters.date = function(value) {
			if (value != "") {
				if (lang == "fr-FR")
					return moment.utc(value).format("DD/MM/YYYY");
				return moment.utc(value).format("YYYY-MM-DD");
			}
			return value;
		};

		dust.filters.datetime = function(value) {
			if (value != "") {
				if (lang == "fr-FR")
					return moment.utc(value).format("DD/MM/YYYY HH:mm");
				return moment.utc(value).format("YYYY-MM-DD HH:mm");
			}
			return value;
		};

		dust.filters.time = function(value) {
			if (value != "") {
				if (value.length == 8)
					return value.substring(0, value.length - 3);
			}
			return value;
		};

		dust.filters.filename = function(value) {

			if(typeof value !== 'string')
				return value;

			// Remove datetime part from filename display
			if (moment(value.substring(0, 16), 'YYYYMMDD-HHmmss_').isValid() && value != "" && value.length > 16)
				value = value.substring(16);

			// Remove uuid
			if(value[32] == '_')
				value = value.substring(33);

			return value;
		};

		// Fix for IE11, encode filename values for query value like "/download/{my_filename}"
		dust.filters.urlencode = function(value) {
			return encodeURIComponent(value);
		};
	}
};