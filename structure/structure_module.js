var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");
var attrHelper = require('../utils/attr_helper');

exports.setupModule = function(attr, callback) {
    var id_application = attr.id_application;

    // Initialize variables according to options
    var options = attr.options;
    var name_module = options.value;
    var show_name_module = options.showValue;
    var url_name_module = options.urlValue;

    // Read routes/default.js file
    var file = __dirname+'/../workspace/'+id_application+'/routes/default.js';
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            return callback(err, null);
        }

        // Add new module route to routes/default.js file
        var str = '// *** Dynamic Module | Do not remove ***\n\n';
        str += '\t// '+name_module+'\n';
        str += '\trouter.get(\'/'+url_name_module.toLowerCase()+'\', block_access.isLoggedIn, block_access.moduleAccessMiddleware("'+url_name_module+'"), function(req, res) {\n';
        str += '\t\tvar data = {\n';
        str += '\t\t\t"profile":req.session.data\n';
        str += '\t\t};\n';
        str += '\t\tres.render(\'default/'+name_module.toLowerCase()+'\', data);\n';
        str += '\t});\n';
        var result = data.replace('// *** Dynamic Module | Do not remove ***', str);

        fs.writeFile(file, result, 'utf8', function(err) {
            if (err){
                return callback(err, null);
            }
            console.log('File => routes/default.js ------------------ UPDATED');

            // Create views/default/MODULE_NAME.dust file
            var fileToCreate = __dirname + '/../workspace/'+id_application+'/views/default/'+name_module.toLowerCase()+'.dust';
            fs.copy(__dirname + '/pieces/views/default/custom_module.dust', fileToCreate, function(err) {
                if (err) {
                    return callback(err, null);
                }

                //Replace all variables 'custom_module' in new created file
                fs.readFile(fileToCreate, 'utf8', function(err, dataDust) {
                    if (err) {
                        return callback(err, null);
                    }

                    // Replace custom_module occurence and write to file
                    var resultDust = dataDust.replace(/custom_module/g, name_module.toLowerCase());
                    resultDust = resultDust.replace(/custom_show_module/g, show_name_module.toLowerCase());
                    fs.writeFile(fileToCreate, resultDust, 'utf8', function(err) {
                        if(err){
                            return callback(err, null);
                        }
                        console.log('File => views/default/'+name_module.toLowerCase()+'.dust ------------------ CREATED');

                        translateHelper.writeLocales(id_application, "module", name_module, show_name_module, attr.googleTranslate, function(){
                            // Create module's layout file
                            file = __dirname+'/../workspace/'+id_application+'/views/layout_'+name_module.toLowerCase()+'.dust';
                            fs.copy(__dirname+'/pieces/views/layout_custom_module.dust', file, function(err) {
                                if(err){
                                    return callback(err, null);
                                }
                                console.log("File => layout_"+name_module.toLowerCase()+'.dust ------------------ CREATED');

                                // Loop over module list to add new module's <option> tag in all modules <select> tags
                                var promises = [];
                                var modules = attr.modules;
                                var option;

                                for (var i=0; i < modules.length; i++) {
                                    promises.push(new Promise(function(resolve, reject) {
                                        (function(ibis){
                                            var fileName = __dirname+'/../workspace/'+id_application+'/views/layout_'+modules[ibis].codeName.toLowerCase()+'.dust';
                                            domHelper.read(fileName).then(function($) {
                                                $("#dynamic_select").empty();
                                                option = "";
                                                for (var j=0; j<modules.length; j++) {
                                                    option += '{@moduleAccess module="'+attrHelper.removePrefix(modules[j].codeName, "module")+'"}';
                                                    option += '<option data-module="'+modules[j].codeName.toLowerCase()+'" value="/default/'+attrHelper.removePrefix(modules[j].codeName, "module")+'" '+(modules[ibis].name.toLowerCase() == modules[j].name.toLowerCase() ? 'selected':'') + '>';
                                                    option += '{@__ key="module.'+modules[j].codeName.toLowerCase()+'" /}';
                                                    option += '</option>';
                                                    option += '{/moduleAccess}';
                                                }

                                                $("#dynamic_select").append(option);

                                                domHelper.write(fileName, $).then(function() {
                                                    console.log('File => layout_' + modules[ibis].name.toLowerCase() + '.dust ------------------ UPDATED');
                                                    resolve();
                                                });
                                            });
                                        })(i);
                                    }));
                                }

                                // Wait for all the layouts to be modified before calling `callback()`
                                Promise.all(promises).then(function() {
                                    var accessPath = __dirname + '/../workspace/'+id_application+'/config/access.json';
                                    var accessObject = require(accessPath);
                                    accessObject[url_name_module.toLowerCase()] = {groups: [], entities: []};
                                    fs.writeFile(accessPath, JSON.stringify(accessObject, null, 4), function(err) {
                                        callback();
                                    })
                                }).catch(function(err) {
                                    callback(err, null);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

exports.deleteModule = function(attr, callback) {
    var moduleFilename = 'layout_'+attr.module_name.toLowerCase()+'.dust';
    var layoutsPath = __dirname + '/../workspace/'+attr.id_application+'/views/';

    fs.unlinkSync(layoutsPath+moduleFilename);

    function done(cpt, lenght){
        if(cpt == lenght){
            callback();
        }
    }

    var cpt = 0;

    var layoutFiles = fs.readdirSync(layoutsPath).filter(function(file){
        return file.indexOf('.') !== 0 && file.indexOf('layout_') === 0;
    });

    layoutFiles.forEach(function(file) {
        domHelper.read(layoutsPath+file).then(function($){
            $("option[data-module='"+attr.module_name.toLowerCase()+"']").remove();
            domHelper.write(layoutsPath+file, $).then(function(){
                done(++cpt, layoutFiles.length);
            });
        }).catch(function(err){
            return callback(err, null);
        });
    });
}
