var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var message = "";
var formidable = require('formidable');
var Excel = require('exceljs');
var fs = require('fs');
var moment = require('moment');

//Sequelize
var models = require('../models/');

var timeout = require('connect-timeout');

var infoObj = {};
var dataArray = [];
var isProcessRunning = false;
var totalRow = 0;
var currentCount = 0;

function pushData() {

    console.log(" --- CREATE SQL FILE MADE OF WORKING REQUEST ---");

    // If error found, log to file
    if (dataArray.length > 0) {

        var file = "";

        for(var i=0; i < dataArray.length; i++){
            file += dataArray[i]+"\n";
        }
        var now = moment();
        var filename = now+'_data_import.sql'

        if (!fs.existsSync(__dirname+'/../sql/import')){
            fs.mkdirSync(__dirname+'/../sql/import');
        }

        fs.writeFile(__dirname+'/../sql/import/'+filename, file, function(err) {
            if(err) {
                console.log('Erreur lors de l\'ecriture du fichier d\'erreur');
            }
        });

        return filename;
    }
}

function executeImport(worksheet, ext, appID, configFile, idUser, callback) {

    console.log("--- ANALYSE & EXECUTION DE L'IMPORTATION ---");
    if(ext == "XLSX"){
    	worksheet.eachSheet(function(sheet, sheetId) {

            var json = configFile;
            var nbRows = sheet.rowCount - 1;
            var count = 0;

            //Get all the XLSX columns
            var columns = sheet.getRow(1).values;

            for(var i=0; i < json.entity.length; i++){
                var obj = json.entity[i];
                var entityName = json.entity[i].name;

                var columnsInRequest = "";
                var columnsToUse = [];
                var columnsUsed = [];
                var insertedValue = {};
                var valueToUpdate = {};

                /* Gestion des colonnes */
                for(var j=0; j<columns.length; j++){

                    var column = columns[j];
                    if(typeof column !== "undefined" && typeof obj.columns[column] !== "undefined" && columnsUsed.indexOf(column) == -1){
                        columnsUsed.push(column);
                        columnsToUse.push(j);
                        columnsInRequest += "`"+obj.columns[column].nameInBDD+"`";
                        columnsInRequest += ", ";
                    }
                }

                columnsInRequest = columnsInRequest.substring(0, columnsInRequest.length - 2);
                columnsInRequest += ',`createdAt`,`updatedAt`';

                sheet.eachRow({
                    includeEmpty: false
                }, function(row, rowNumber) {

                    totalRow = rowNumber;

                    // Because row 1 is the column name
                    if(rowNumber > 1){
                        var values = row.values;
                        var request = "";
                        var valuesInrequest = "";

                        while(values.length != columns.length){
                            values.push("");
                        }

                        var valueInRequestArray = [];
                        var objToInsert = {};
                        var cpt = 0;

                        /* Gestion des valeurs */
                        for(var k=0; k<values.length; k++){

                            var value = values[k];
                            var column = columns[k];

                            if(columnsToUse.indexOf(k) != -1){

                                /* Si il s'agit d'une clé étrangère à aller chercher dans une autre table */
                                if(typeof obj.columns[column].isForeignKey !== "undefined"){

                                    /* Table name in Query */
                                    var foreignTable = appID + "_" + obj.columns[column].foreignTable;
                                    var foreignField = obj.columns[column].foreignFieldToMatch;

                                    if(value == "" || typeof value === "undefined"){
                                        valueInRequestArray[k] = null;
                                        cpt++;
                                        done(cpt);
                                    }
                                    else{
                                        if(typeof value === "string"){
                                            value = value.replace(new RegExp("'", 'g'), "''");
                                        }
                                        else if (typeof value == "object"){
                                            /* Si il s'agit d'un objet car c'est une cellule de formule */
                                            if(typeof value.formula !== "undefined"){
                                                value = value.result;
                                                if(typeof value === "string")
                                                    value = value.replace(new RegExp("'", 'g'), "''");
                                            }
                                        }

                                        var findRequest = "SELECT * FROM `" +foreignTable+ "` WHERE " +foreignField+ " = '" +value+ "';";

                                        (function(valuebis, columnbis, kbis, foreignTablebis, foreignFieldbis){
                                            /* Looking for the foreign key */
                                            models.sequelize.query(findRequest, {type: models.sequelize.QueryTypes.SELECT}).then(function(result){
                                                if(result.length > 0){
                                                    value = result[0].id;
                                                    valueInRequestArray[kbis] = result[0].id;
                                                    cpt++;
                                                    done(cpt);
                                                }
                                                else{
                                                    if(typeof insertedValue[valuebis] === "undefined"){
                                                        var createRequest = "INSERT INTO " +foreignTablebis+ "("+foreignFieldbis+") VALUES('"+valuebis+"');";
                                                        var arrayToInsert = [createRequest, kbis, valuebis];

                                                        insertedValue[valuebis] = 0;

                                                        models.sequelize.query(createRequest, {type: models.sequelize.QueryTypes.INSERT}).then(function(result){
                                                            insertedValue[valuebis] = result;
                                                            valueInRequestArray[kbis] = result;
                                                            cpt++;
                                                            done(cpt);
                                                        });
                                                    }
                                                    else{
                                                        valueInRequestArray[kbis] = findRequest;
                                                        cpt++;
                                                        done(cpt);
                                                    }
                                                }
                                            }).catch(function(err){
                                                cpt++;
                                                done(cpt);
                                                console.log(err);
                                                var error = {};
                                                error.error = err.message;
                                                error.request = findRequest;
                                                infoObj[idUser].errorArray.push(error);
                                            });
                                        })(value, column, k, foreignTable, foreignField);
                                    }
                                }
                                else if(typeof value === "undefined"){
                                    value = null;
                                    valueInRequestArray[k] = value;
                                    cpt++;
                                    done(cpt);
                                }
                                else if (typeof value == "object" || obj.columns[column].isDate){
                                    /* Si il s'agit d'un objet car c'est une cellule de formule */
                                    if(typeof value.formula !== "undefined"){
                                        value = value.result;
                                        if(typeof value === "string")
                                            value = value.replace(new RegExp("'", 'g'), "''");
                                    }
                                    else{
                                        if(obj.columns[column].isDate){
                                            value = moment(value, obj.columns[column].formatDate).format("YYYY-MM-DD HH:mm:ss");
                                        }else{
                                            value = moment(value).format("YYYY-MM-DD HH:mm:ss");
                                        }
                                    }
                                    valueInRequestArray[k] = value;
                                    cpt++;
                                    done(cpt);
                                }
                                else if (typeof value == "string"){
                                    value = value.replace(new RegExp("'", 'g'), "''");
                                    valueInRequestArray[k] = value;
                                    cpt++;
                                    done(cpt);
                                }
                                else{
                                    valueInRequestArray[k] = value;
                                    cpt++;
                                    done(cpt);
                                }
                            }
                        }

                        function done(cpt){

                            /* Process finished */
                            if(cpt == columnsToUse.length){

                                var cpt2 = 0;

                                /* Replace value foreign key with real foreign key */
                                for(var l=0; l<valueInRequestArray.length; l++){
                                    var value = valueInRequestArray[l];
                                    if(typeof value !== "undefined"){
                                        if(typeof value === "string" && value.indexOf("SELECT * FROM") != -1){
                                            (function(valuebis, lbis){
                                                models.sequelize.query(valuebis, {type: models.sequelize.QueryTypes.SELECT}).then(function(result){
                                                    if(result.length > 0){
                                                        valueInRequestArray[lbis] = result[0].id;
                                                        cpt2++;
                                                        done2(cpt2);
                                                    }
                                                });
                                            })(value, l);
                                        }
                                        else{
                                            cpt2++;
                                            done2(cpt2);
                                        }
                                    }
                                }

                                function done2(cpt2){

                                    if(cpt2 == columnsToUse.length){
                                        /* Create the request string */
                                        for(var j=0; j<valueInRequestArray.length; j++){
                                            var value = valueInRequestArray[j];
                                            if(typeof value !== "undefined"){
                                                if(value == null){
                                                    valuesInrequest += value+", ";
                                                }
                                                else{
                                                    valuesInrequest += "'"+value+"', ";
                                                }
                                            }
                                        }

                                        // Remove last ,
                                        valuesInrequest = valuesInrequest.substring(0, valuesInrequest.length - 2);
                                        valuesInrequest += ', NOW(), NOW()';

                                        request = "INSERT INTO ";
                                        request += appID + "_" + entityName;
                                        request += " ("+columnsInRequest+")";
                                        request += " VALUES("+valuesInrequest+");";

                                        (function(currentRequest){
                                            models.sequelize.query(currentRequest).then(function() {
                                                count++;
                                                currentCount = count;
                                                dataArray.push(currentRequest);
                                                if(count == nbRows){
                                                    isProcessRunning = false;
                                                    var sqlFilename = pushData();
                                                    // If error found
                                                    if (infoObj[idUser].errorArray.length > 0) {
                                                        callback(false, sqlFilename);
                                                    }
                                                    else{
                                                        callback(true, sqlFilename);
                                                    }
                                                }
                                            }).catch(function(err){
                                                count++;
                                                currentCount = count;
                                                var error = {};
                                                error.error = err.message;
                                                error.request = currentRequest;
                                                infoObj[idUser].errorArray.push(error);
                                                if(count == nbRows){
                                                    isProcessRunning = false;
                                                    var sqlFilename = pushData();
                                                    // If error found
                                                    if (infoObj[idUser].errorArray.length > 0) {
                                                        callback(false, sqlFilename);
                                                    }
                                                    else{
                                                        callback(true, sqlFilename);
                                                    }
                                                }
                                            });
                                        })(request);
                                    }
                                }
                            }
                        }
                    }
                });
            }
		});
    }
    else if(ext == "CSV"){

    	var json = {
    		id: "currency",
    		version: "currency",
    		code: "currency",
    		name: "currency",
    		symbol: "currency"
    	}

    	var json = {
    		currency: ["id", "version", "code", "name", "symbol"]
    	}

    	//Get all the CSV columns
    	var columns = worksheet.getRow(1).getCell(1).value;
    	var columnsInRequest = columns.replace(new RegExp(";", 'g'), ", ");
    	columns = columns.split(";");

    	for(var i=0; i < columns.length; i++){
    		var column = columns[i];

    		worksheet.eachRow({
				includeEmpty: false
			}, function(row, rowNumber) {
				var values = row.values;
				var valuesInrequest = values[1].replace(new RegExp(";", 'g'), ", ");
				values = values[1].split(";");

				console.log(valuesInrequest);

				for(var j=0; j<values.length; j++){
				}

				request = "INSERT INTO ";
                request += appID + "_" + json[column];
                request += " ("+columnsInRequest+")";
                request += " VALUES("+valuesInrequest+")";

                console.log(request);

                /*sequelize.query(request).then(function() {
                    resolve0();
                });*/
			});
    	}

    	/*name.eachCell(function(cell, rowNumber) {
			console.log(cell.values);
		});
    	worksheet.eachRow({
			includeEmpty: true
		}, function(row, rowNumber) {
			console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
		});*/
    }
}

router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};
    models.Application.findAll().then(function(applications) {
        data.applications = applications;
        // Récupération des toastr en session
        data.toastr = req.session.toastr;
        // Nettoyage de la session
        req.session.toastr = [];
        res.render('front/import', data);
    });
});

router.post('/execute', timeout('1200s'), block_access.isLoggedIn, function(req, res) {

    if(!isProcessRunning){

        isProcessRunning = true;

        var form = new formidable.IncomingForm();
        form.uploadDir = __dirname + "/../upload/";
        form.encoding = 'utf-8';
        form.keepExtensions = true;

        form.parse(req, function(err, fields, files) {
            if (!err) {
                if(fields.appID != ""){
                    if (files.configFile && files.contentFile && files.contentFile.size > 0 && files.configFile.size > 0) {

                        configFilePath = files.configFile.path;
                        contentFilePath = files.contentFile.path;
                        var configFile = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

                        /* Instanciate data and error array */
                        var idUser = req.session.passport.user.id;
                        infoObj[idUser] = {};
                        infoObj[idUser].errorArray = [];
                        dataArray = [];
                        totalRow = 0;
                        currentCount = 0;

                        function readingDone(worksheet, ext, appID, configFile){
                            executeImport(worksheet, ext, appID, configFile, idUser, function(success, sqlFilename){
                                if (success) {
                                    res.json({
                                        success: success,
                                        sqlFilename: sqlFilename,
                                        message: "Import terminée. Aucune erreur. Fichier SQL des requêtes valide disponible."
                                    });
                                } else {
                                    res.json({
                                        success: success,
                                        sqlFilename: sqlFilename,
                                        message: "Import terminée. Des erreurs sont survenues. Fichier SQL des requêtes valide disponible."
                                    });
                                }
                            });
                        }
                        var workbook = new Excel.Workbook();

                        if(files.contentFile.type === "text/csv"){
                            console.log("--- FICHIER CSV DETECTE ---");
                            workbook.csv.readFile(contentFilePath).then(function(worksheet) {
                                readingDone(worksheet, "CSV", fields.appID, configFile);
                            });
                        }
                        else if(files.contentFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
                            console.log("--- FICHIER XLSX DETECTE ---");
                            workbook.xlsx.readFile(contentFilePath).then(function(worksheet) {
                                readingDone(worksheet, "XLSX", fields.appID, configFile);
                            });
                        }
                        else{
                            console.log("Error file import extension");
                            req.session.toastr = [{
                                message: "Une erreur est survenue: Error detecting file extension",
                                level: "error"
                            }];
                            res.redirect("/import");
                        }

                    } else {
                        console.log("EMPTY FILE :(");
                        req.session.toastr = [{
                            message: "Une erreur est survenue: File Missing",
                            level: "error"
                        }];
                        res.redirect("/import");
                    }
                }
                else{
                    req.session.toastr = [{
                        message: "Une erreur est survenue: Missing value in form",
                        level: "error"
                    }];
                    res.redirect("/import");
                }
            } else {
                console.log(err);
                req.session.toastr = [{
                    message: "Une erreur est survenue: " + err,
                    level: "error"
                }];
                res.redirect("/import");
            }
        });
    }
    else{
        res.status(500).send('An import process is currently running!');
    }
});

router.get('/get_import_status', block_access.isLoggedIn, function(req, res) {
    var errorArray = infoObj[req.session.passport.user.id].errorArray;
    var requestArray = infoObj[req.session.passport.user.id].requestArray;

    infoObj[req.session.passport.user.id].errorArray = [];
    infoObj[req.session.passport.user.id].requestArray = [];

    var percentProgress = (currentCount*100)/totalRow;

    res.json({
        errors: errorArray,
        percentProgress: percentProgress
    });
});

router.get('/download_file/:file', function(req, res) {

    var filePath = __dirname+'/../sql/import/'+req.params.file;
    var filename = req.params.file;

    res.download(filePath, filename, function(err) {
    });
});


module.exports = router;