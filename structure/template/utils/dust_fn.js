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
        if (req.isAuthenticated() || AUTO_LOGIN) {
            // Session
            locals.session = req.session;

            // Access control
            locals.moduleAccess = function(chunk, context, bodies, params) {
                var userGroups = req.session.passport.user.r_group;
                var moduleName = params.module;
                return block_access.moduleAccess(userGroups, moduleName);
            };
            locals.entityAccess = function(chunk, context, bodies, params) {
                var userGroups = req.session.passport.user.r_group;
                var entityName = params.entity;
                return block_access.entityAccess(userGroups, entityName);
            }
            locals.actionAccess = function(chunk, context, bodies, params) {
                var userRoles = req.session.passport.user.r_role;
                var entityName = params.entity;
                var action = params.action;
                return block_access.actionAccess(userRoles, entityName, action);
            }
            locals.checkStatusPermission = function(chunk, context, bodies, params) {
                var status = params.status;
                var acceptedGroup = status.r_accepted_group || [];
                var currentUserGroupIds = [];

                for (var i = 0; i < req.session.passport.user.r_group.length; i++)
                    currentUserGroupIds.push(req.session.passport.user.r_group[i].id);

                // If no role given in status, then accepted for everyone
                if (acceptedGroup.length == 0)
                    return true;
                else
                    for (var j = 0; j < acceptedGroup.length; j++)
                        if (currentUserGroupIds.indexOf(acceptedGroup[j].id) != -1)
                            return true;

                return false;
            }
        }
    },
    getHelpers: function(dust) {
        dust.helpers.findValueInGivenContext = function(chunk, context, bodies, params) {
            var obj = dust.helpers.tap(params.ofContext, chunk, context);

            var idx = 0;
            for (var i = 0; i < obj.length; i++) {
                if (obj[i].id == params.idx)
                    idx = i;
            }

            if (typeof params.entity !== "undefined") {
                if (typeof obj[idx][params.entity] !== "undefined" && obj[idx][params.entity] != null)
                    return chunk.write(obj[idx][params.entity][params.key]);
                else
                    return chunk.write("-");
            } else
                return chunk.write(obj[idx][params.key]);
        }
        dust.helpers.existInContextById = function(chunk, context, bodies, params) {
            var obj = dust.helpers.tap(params.ofContext, chunk, context);
            for (var i = 0; i < obj.length; i++) {
                if (obj[i].id == params.key)
                    return true;
            }
            return false;
        }
        dust.helpers.ifTrue = function(chunk, context, bodies, params) {
            var value = params.key;

            if (value == true || value == "true" || value == 1) {
                return true;
            } else {
                return false;
            }
        }
        dust.helpers.inArray = function(chunk, context, bodies, params) {
            var value = params.value;
            var field = params.field;
            var array = params.array;

            for (var i = 0; i < array.length; i++) {
                if (array[i][field] == value)
                    return true
            }
            return false;
        }
    },
    getFilters: function(dust, lang) {
        // ----------- Filter DUST ----------- //
        // Example {myDate|convertToDateFormat}

        dust.filters.date = function(value) {
            if (value != "") {
                if (lang == "fr-FR")
                    return moment(new Date(value)).format("DD/MM/YYYY");
                else
                    return moment(new Date(value)).format("YYYY-MM-DD");
            }
            return value;
        };

        dust.filters.datetime = function(value) {
            if (value != "") {
                if (lang == "fr-FR")
                    return moment(new Date(value)).format("DD/MM/YYYY HH:mm:ss");
                else
                    return moment(new Date(value)).format("YYYY-MM-DD HH:mm:ss");
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
            // Remove datetime part from filename display
            if (value != "" && value.length > 16)
                return value.substring(16);
            return value;
        };

        // Fix for IE11, encode filename values for query value like "/download/{my_filename}"
        dust.filters.urlencode = function(value) {
            return encodeURI(value);
        };
    }
};