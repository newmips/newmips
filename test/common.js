/**
 * Common test script
 */

var request = require("request"),
        assert = require('assert'),
        global = require('../config/global');


describe("  Newmips Test ", function () {
    var base_url = global.protocol + '://' + global.host + ':' + global.port;
    
    describe("GET /", function () {
        it("returns status code 200", function () {
            request.get(base_url, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

    });
});