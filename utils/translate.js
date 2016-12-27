var fs = require('fs');
var helpers = require("./helpers");
var translateKey = require("../config/googleAPI").translate;

// Google translation
var googleTranslate = require('google-translate')(translateKey);

module.exports = {
    writeLocales: function(idApplication, type, value, toTranslate, callback) {

        // If field value is an array
        if(type == "field"){
            var dataEntity = value[0];
            value = value[1];
        }
        else if(type == "aliasfield"){
            var dataEntity = value[0];
            var alias = value[1];
            value = value[2];
        }

        // Current application language
        var languageFileData = helpers.readFileSyncWithCatch(__dirname+'/../workspace/'+idApplication+'/config/language.json');
        var appLang = JSON.parse(languageFileData);
        appLang = appLang.lang;

        // Google won't fr-FR, it just want fr
        var appLang4Google = appLang.slice(0, -3);

        // All available languages to write
        var languagePromises = [];

        function pushLanguagePromise(urlFile, dataLocales, file){
            // Create an array of promises to write all translations file
            languagePromises.push(new Promise(function(resolve, reject) {
                fs.writeFile(urlFile, JSON.stringify(dataLocales, null, 2), function(err) {
                    if (err){
                        console.log(err);
                        reject();
                    }
                    else{
                        console.log('File => locales/'+file+' ------------------ UPDATED');
                        resolve();
                    }
                });
            }));
        }

        function addLocales(type, value, value2, data){
            if(type == "module"){
                data.module[value.toLowerCase()] = value2;
            }
            else if(type == "entity"){
                var content = '  { \n\t\t\t"label_entity": "'+ value2 +'",\n';
                content += '\t\t\t"name_entity": "'+ value2 +'",\n';
                content += '\t\t\t"plural_entity": "'+ value2 +'s",\n';
                content += '\t\t\t"id_entity": "ID"\n';
                content += '\t\t}\n';
                data.entity[value.toLowerCase()] = JSON.parse(content);
            }
            else if(type == "field"){
                data.entity[dataEntity.toLowerCase()][value.toLowerCase()] = value2;
            }
            else if(type == "aliasfield"){
                data.entity[dataEntity.toLowerCase()][alias.toLowerCase()] = value2;
            }

            return data;
        }

        function doneLocales(cpt, length){
            // If process is over we can continue
            if(cpt == length){
                Promise.all(languagePromises).then(function(){
                    callback();
                }).catch(function(err){
                    console.log(err);
                });
            }
        }

        // Get all the differents languages to handle
        var localesDir = fs.readdirSync(__dirname+'/../workspace/'+idApplication+'/locales').filter(function(file){
            return (file.indexOf('.') !== 0) && (file.slice(-5) === '.json') && (file != "enum.json");
        });

        var nbLocales = localesDir.length;
        var localesCpt = 0;

        localesDir.forEach(function(file){
            var urlFile = __dirname+'/../workspace/'+idApplication+'/locales/'+file;
            var dataLocales = require(urlFile);
            var workingLocales = file.slice(0, -5);
            var workingLocales4Google = workingLocales.slice(0, -3);

            if(type == "module" && value.toLowerCase() == "home"){
                if(workingLocales == "fr-FR"){
                    dataLocales[type][value.toLowerCase()] = "Accueil";
                }else{
                    dataLocales[type][value.toLowerCase()] = "Home";
                }
                pushLanguagePromise(urlFile, dataLocales, file);
                localesCpt++;
                doneLocales(localesCpt, nbLocales);
            } else if(workingLocales != appLang){
                if(translateKey != "" && toTranslate){
                    googleTranslate.translate(value, appLang4Google, workingLocales4Google, function(err, translations) {
                        if(!err){
                            dataLocales = addLocales(type, value, translations.translatedText, dataLocales);
                        }
                        else{
                            console.log(err);
                            dataLocales = addLocales(type, value, value, dataLocales);
                        }
                        pushLanguagePromise(urlFile, dataLocales, file);
                        localesCpt++;
                        doneLocales(localesCpt, nbLocales);
                    });
                }
                else{
                    if(translateKey == "" && googleTranslate)
                        console.log("Error: Empty API key for google translation!");

                    dataLocales = addLocales(type, value, value, dataLocales);
                    pushLanguagePromise(urlFile, dataLocales, file);
                    localesCpt++;
                    doneLocales(localesCpt, nbLocales);
                }
            } else{
                dataLocales = addLocales(type, value, value, dataLocales);

                pushLanguagePromise(urlFile, dataLocales, file);
                localesCpt++;
                doneLocales(localesCpt, nbLocales);
            }
        });
    }
}