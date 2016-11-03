var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');

exports.setupModule = function(attr, callback) {
    var id_application = attr.id_application;
    var name_module = "";

    // Initialize variables according to options
    options = attr.options;
    i = 0;
    while (i < options.length) {
        if (options[i].property == 'entity') {
            name_module = options[i].value;
        }
        i++;
    }

    // Read routes/default.js file
    var file = __dirname + '/../workspace/' + id_application + '/routes/default.js';
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }

        //req.session.returnTo = req.protocol + '://' + req.get('host') + req.originalUrl;

        // Add new module route to routes/default.js file
        str = '// *** Dynamic Module | Do not remove ***\n\n';
        str = str + '\t// ' + name_module + '\n';
        str = str + '\trouter.get(\'/' + name_module.toLowerCase() + '\', block_access.isLoggedIn, function(req, res) {\n';
        str = str + '\t\tvar data = {\n';
        str = str + '\t\t\t"profile":req.session.data\n';
        str = str + '\t\t};\n';
        str = str + '\t\tres.render(\'default/' + name_module.toLowerCase() + '\', data);\n';
        str = str + '\t});\n';
        var result = data.replace('// *** Dynamic Module | Do not remove ***', str);

        fs.writeFile(file, result, 'utf8', function(err) {
            if (err) return console.log(err);
            console.log('File => routes/default.js ------------------ UPDATED');

            // Create views/default/MODULE_NAME.dust file
            fileToCreate = __dirname + '/../workspace/' + id_application + '/views/default/' + name_module.toLowerCase() + '.dust';
            fs.copy(__dirname + '/pieces/views/default/custom_module.dust', fileToCreate, function(err) {
                if (err) {
                    return console.error(err);
                }

                //Replace all variables 'custom_module' in new created file
                fs.readFile(fileToCreate, 'utf8', function(err, dataDust) {
                    if (err) {
                        return console.log(err);
                    }

                    // Replace custom_module occurence and write to file
                    var resultDust = dataDust.replace(/custom_module/g, name_module.toLowerCase());
                    fs.writeFile(fileToCreate, resultDust, 'utf8', function(err) {
                        if (err) return console.log(err);
                        console.log('File => views/default/' + name_module.toLowerCase() + '.dust ------------------ CREATED');

                        // Update locales file
                        fileLocalesFR = __dirname + '/../workspace/' + id_application + '/locales/fr-FR.json';
                        fileLocalesEN = __dirname + '/../workspace/' + id_application + '/locales/en-EN.json';
                        dataLocalesFR = require(fileLocalesFR);
                        dataLocalesEN = require(fileLocalesEN);

                        if(name_module.toLowerCase() == "home"){
                            dataLocalesFR.module[name_module.toLowerCase()] = "Accueil";
                            dataLocalesEN.module[name_module.toLowerCase()] = "Home";
                        }
                        else{
                            dataLocalesFR.module[name_module.toLowerCase()] = name_module;
                            dataLocalesEN.module[name_module.toLowerCase()] = name_module;
                        }
                        fs.writeFile(fileLocalesFR, JSON.stringify(dataLocalesFR, null, 2), function(err) {
                            if (err){
                                return console.log(err);
                            }
                            console.log('File => locales/fr-FR.json ------------------ UPDATED');

                            fs.writeFile(fileLocalesEN, JSON.stringify(dataLocalesEN, null, 2), function(err) {
                                if (err){
                                    return console.log(err);
                                }
                                console.log('File => locales/en-EN.json ------------------ UPDATED');

                                // Create module's layout file
                                file = __dirname + '/../workspace/' + id_application + '/views/layout_' + name_module.toLowerCase() + '.dust';
                                fs.copy(__dirname + '/pieces/views/layout_custom_module.dust', file, function(err) {
                                    if (err) return console.error(err);
                                    console.log("File => layout_" + name_module.toLowerCase() + '.dust ------------------ CREATED');

                                    // Loop over module list to add new module's <option> tag in all modules <select> tags
                                    var promises = [];
                                    var modules = attr.modules;
                                    var option;

                                    for (var i=0; i < modules.length; i++) {
                                        promises.push(new Promise(function(resolve, reject) {
                                            (function(ibis){
                                                var fileName = __dirname + '/../workspace/' + id_application + '/views/layout_' + modules[ibis].name.toLowerCase() + '.dust';
                                                domHelper.read(fileName).then(function($) {
                                                    $("#dynamic_select").empty();
                                                    option = "";
                                                    for (var j=0; j<modules.length; j++) {
                                                        option += '<option data-module="'+modules[j].name.toLowerCase()+'" value="/default/' + modules[j].name.toLowerCase() + '" ' + (modules[ibis].name.toLowerCase() == modules[j].name.toLowerCase() ? 'selected':'') + '>';
                                                        option += '{@__ key="module.' + modules[j].name.toLowerCase() + '" /}';
                                                        option += '</option>';
                                                    }

                                                    $("#dynamic_select").append(option);

                                                    domHelper.write(fileName, $("body")[0].innerHTML).then(function() {
                                                        console.log('File => layout_' + modules[ibis].name.toLowerCase() + '.dust ------------------ UPDATED');
                                                        resolve();
                                                    });
                                                });
                                            })(i);
                                        }));
                                    }

                                    // Wait for all the layouts to be modified before calling `callback()`
                                    Promise.all(promises).then(function() {
                                        callback();
                                    }).catch(function(err) {
                                        console.log(err);
                                    });
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
    var moduleFilename = 'layout_'+attr.module_name+'.dust';
    var layoutsPath = __dirname + '/../workspace/'+attr.id_application+'/views/';

    fs.unlinkSync(layoutsPath+moduleFilename);

    fs.readdirSync(layoutsPath).filter(function(file){
        return file.indexOf('.') !== 0 && file.indexOf('layout_') === 0;
    }).forEach(function(file) {
        domHelper.read(layoutsPath+file).then(function($){
            $("option[data-module='"+attr.module_name+"']").remove();
            domHelper.write(layoutsPath+file, $('body')[0].innerHTML).then(function(){
                callback();
            });
        });
    });
}


