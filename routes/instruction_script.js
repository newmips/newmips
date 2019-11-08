const express = require('express');
const router = express.Router();
const multer = require('multer');
const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const dataHelper = require('../utils/data_helper');
const block_access = require('../utils/block_access');
const docBuilder = require('../utils/api_doc_builder');
const designer = require('../services/designer.js');
const session_manager = require('../services/session.js');
const parser = require('../services/bot.js');
const structure_application = require('../structure/structure_application');
const jschardet = require('jschardet');
const process_manager = require('../services/process_manager.js');
const metadata = require('../database/metadata')();

let scriptProcessing = {
    timeout: moment(),
    state: false
};
let scriptData = {};

let mandatoryInstructions = [
    "create module home",
    "create module Administration",
    "create entity User",
    "add field login",
    "set field login required",
    "set field login unique",
    "add field password",
    "add field email with type email",
    "add field token_password_reset",
    "add field enabled with type number",
    "set icon user",
    "create entity Role",
    "add field label",
    "set field label required",
    "set field label unique",
    "set icon asterisk",
    "create entity Group",
    "add field label",
    "set field label required",
    "set field label unique",
    "set icon users",
    "select entity User",
    "add field Role related to many Role using label",
    "add field Group related to many Group using label",
    "set field Role required",
    "set field Group required",
    "entity Role has many user",
    "entity Group has many user",
    "add entity API credentials",
    "add field Client Name",
    "add field Client Key",
    "add field Client Secret",
    "add field Token",
    "add field Token timeout TMSP",
    "set icon key",
    "add field role related to many Role using label",
    "add field group related to many Group using label",
    "add entity Synchronization",
    "add field Journal backup file",
    "entity Synchronization has one API credentials",
    "add entity Synchro credentials",
    "add field Cloud host with type url",
    "add field Client key",
    "add field Client secret",
    "add widget stat on entity User",
    "add entity Status",
    "set icon tags",
    "add field Entity",
    "add field Field",
    "add field Name",
    "add field Color with type color",
    "add field Accepted group related to many Group using Label",
    "add field Button label",
    "add field Position with type number",
    "add field Default with type boolean",
    "add field Comment with type boolean",
    "entity Status has many Status called Children",
    "entity Status has many Translation called Translations",
    "select entity translation",
    "add field Language",
    "add field Value",
    "create entity Media",
    "set icon envelope",
    "add field Type with type enum and values Mail, Notification, SMS, Task",
    "add field Name",
    "set field Name required",
    "add field Target entity",
    "entity status has many Action called Actions",
    "select entity action",
    "add field Media related to Media using name",
    "add field Order with type number",
    "add field Execution with type enum and values Immédiate, Différée with default value Immédiate",
    "create entity Robot",
    "set icon android",
    "add field Current status with type enum and values CONNECTED, DISCONNECTED, WORKING",
    "add field Name",
    "add field Api credentials related to api credentials using client name",
    "add field Comment with type regular text",
    "create entity Task",
    "set icon cogs",
    "add component status with name State",
    "add field Title",
    "set field Title required",
    "add field Type with type enum and values Manual, Automatic and default value Manual",
    "add field Planned date with type date",
    "add field Execution start date with type date",
    "add field Execution finish date with type date",
    "add field Duration with type decimal",
    "add field Data flow with type regular text",
    "add field Robot related to Robot using Name",
    "add field Program file with type file",
    "add field Procedure with type regular text",
    "add component localfilestorage with name Documents",
    "entity Media has one Media Mail",
    "entity Media has one Media Notification",
    "entity Media has one Media SMS",
    "entity Media has one Media Task",
    "select entity media task",
    "add field Task name",
    "add field Task type with type enum and values Manual, Automatic and default value Manual",
    "add field Assignment logic",
    "add field Program file with type file",
    "add field Data flow with type text",
    "select entity media mail",
    "add field To",
    "add field Cc",
    "add field Cci",
    "add field From",
    "add field Attachments",
    "add field Subject",
    "add field Content with type text",
    "select entity media notification",
    "add field Title",
    "add field Description",
    "add field Icon",
    "add field Color with type color",
    "add field targets",
    "add entity Notification",
    "add field Title",
    "add field Description",
    "add field URL",
    "add field Color with type color",
    "add field Icon",
    "select entity media SMS",
    "add field Message with type text",
    "add field Phone numbers",
    "add entity Inline Help",
    "set icon question-circle-o",
    "add field Entity",
    "add field Field",
    "add field Content with type text",
    "entity user has many notification",
    "entity notification has many user",
    "select module home"
];

// When a script handling is over
function processEnd(path, userID) {
    // Delete instructions file
    fs.unlinkSync(path);
    // Tell client that the script is over
    scriptData[userID].over = true;
    // Tell the server that script processing is done
    scriptProcessing.state = false;
    // Save application metadata if exist
    if(scriptData[userID].data && scriptData[userID].data.application)
        scriptData[userID].data.application.save();
}

// Check if a script is already running
function isProcessing(userID, __) {
    if(scriptProcessing.state && moment().diff(scriptProcessing.timeout, 'seconds') < 100){
        scriptData[userID].answers = [{
            message: __('instructionScript.alreadyProcessing')
        }];
        scriptData[userID].overDueToProcessing = true;
        return true;
    }
    return false;
}

// Executing one instruction
async function execute(req, instruction, __, data = {}, saveMetadata = true) {

    // Lower the first word for the basic parser json
    instruction = dataHelper.lowerFirstWord(instruction);

    // Instruction to be executed
    data = {
        ...data,
        ...parser.parse(instruction)
    };

    // Rework the data to get value for the code / url / show
    data = dataHelper.reworkData(data);

    data.app_name = req.session.app_name;
    data.module_name = req.session.module_name;
    data.entity_name = req.session.entity_name;
    data.googleTranslate = req.session.toTranslate || false;
    data.lang_user = req.session.lang_user;
    data.currentUser = req.session.passport.user;
    data.gitlabUser = null;

    if(typeof req.session.gitlab !== 'undefined'
        && typeof req.session.gitlab.user !== 'undefined'
        && !isNaN(req.session.gitlab.user.id))
        data.gitlabUser = req.session.gitlab.user;

    if(data.function != 'createNewApplication' && data.function != 'deleteApplication')
        data.application = metadata.getApplication(data.app_name);

    let info;
    try {
        info = await designer[data.function](data);
    } catch (err) {
        throw err;
    }

    data = session_manager.setSession(data.function, req, info, data);

    // Save metadata
    if(data.application && data.function != 'deleteApplication' && saveMetadata)
        data.application.save();

    data.message = info.message;
    data.messageParams = info.messageParams;

    return data;
}

// Execution all the script
function executeFile(req, userID, __) {

    // Open file descriptor
    let rl = readline.createInterface({
        input: fs.createReadStream(req.file.path)
    });

    // Read file line by line, check for empty line, line comment, scope comment
    let fileLines = [], commenting = false;

    /* If one of theses value is to 2 after readings all lines then there is an error,
    line to 1 are set because they are mandatory lines added by the generator */
    let exceptions = {
        createNewApplication : {
            error: 0,
            errorMessage: "You can't create or select more than one application in the same script."
        },
        createModuleHome: {
            error: 1,
            errorMessage: "You can't create a module home, because it's a default module in the application."
        },
        createModuleAuthentication: {
            error: 1,
            errorMessage: "You can't create a module authentication, because it's a default module in the application."
        },
        createEntityUser: {
            error: 1,
            errorMessage: "You can't create a entity user, because it's a default entity in the application."
        },
        createEntityRole: {
            error: 1,
            errorMessage: "You can't create a entity role, because it's a default entity in the application."
        },
        createEntityGroup: {
            error: 1,
            errorMessage: "You can't create a entity group, because it's a default entity in the application."
        },
        setFieldUnique: {
            error: 1,
            errorMessage: "You can't set a field unique in a script, please execute the instruction in preview."
        },
        delete: {
            error: 1,
            errorMessage: "Please do not use delete instruction in script mode."
        }
    };

    // Checking file
    rl.on('line', line => {

        // Empty line || One line comment scope
        if (line.trim() == '' || ((line.indexOf('/*') != -1 && line.indexOf('*/') != -1) || line.indexOf('//*') != -1))
            return;

        // Comment scope start
        if (line.indexOf('/*') != -1 && !commenting)
            commenting = true;

        // Comment scope end
        else if (line.indexOf('*/') != -1 && commenting)
            commenting = false;

        else if (!commenting) {
            let positionComment = line.indexOf('//');
            // Line start with comment
            if (positionComment == 0)
                return;
            // Line comment is after or in the instruction
            if (positionComment != -1)
                line = line.substring(0, line.indexOf('//'));

            // Get the wanted function given by the bot to do some checks
            let parserResult;
            try {
                parserResult = parser.parse(line);
            } catch (err) {
                 // Update script logs
                scriptData[userID].answers.unshift({
                    instruction: line,
                    message: __(err.message, err.messageParams || [])
                });
                return processEnd(req.file.path, userID);
            }

            let designerFunction = parserResult.function;

            let designerValue = '';
            if (typeof parserResult.options !== "undefined")
                designerValue = parserResult.options.value ? parserResult.options.value.toLowerCase() : '';

            if (designerFunction == "createNewApplication")
                scriptData[userID].isNewApp = true;

            if (designerFunction == "createNewApplication" || designerFunction == "selectApplication")
                exceptions.createNewApplication.nbAuthorized++;

            if(designerFunction == "createNewModule" && designerValue == "home")
                exceptions.createModuleHome.nbAuthorized++;

            if(designerFunction == "createNewModule" && designerValue == "authentication")
                exceptions.createModuleAuthentication.nbAuthorized++;

            if(designerFunction == "createNewEntity" && designerValue == "user")
                exceptions.createEntityUser.nbAuthorized++;

            if(designerFunction == "createNewEntity" && designerValue == "role")
                exceptions.createEntityRole.nbAuthorized++;

            if(designerFunction == "createNewEntity" && designerValue == "group")
                exceptions.createEntityGroup.nbAuthorized++;

            if(typeof designerFunction !== 'undefined' && designerFunction.indexOf('delete') != -1)
                exceptions.delete.nbAuthorized++;

            fileLines.push(line);
        }
    });

    // All lines read, execute instructions
    rl.on('close', async () => {

        if(scriptData[userID].over)
            return;

        let errorMsg = '';
        for(let item in exceptions){
            if(item == "createNewApplication" && exceptions[item].value == 0)
                errorMsg += 'You have to create or select an application in your script.<br><br>';
            if(exceptions[item].value > 1)
                errorMsg += exceptions[item].errorMessage + '<br><br>';
        }

        // File content not valid
        if(errorMsg.length > 0){
            scriptData[userID].answers = [];
            scriptData[userID].answers.push({
                message: errorMsg
            });
            return processEnd(req.file.path, userID);
        }

        scriptData[userID].totalInstruction = fileLines.length;

        // If new app created, then add mandatory instructions
        if(scriptData[userID].isNewApp) {
            scriptData[userID].totalInstruction += mandatoryInstructions.length;
            fileLines.splice.apply(fileLines, [1, 0].concat(mandatoryInstructions));
        }

        // Set default theme if different than blue-light
        if (typeof req.session.defaultTheme !== "undefined" && req.session.defaultTheme != "blue-light")
            fileLines.push("set theme " + req.session.defaultTheme);

        let data = {};

        // Executing all instructions !
        for (let i = 0; i < fileLines.length; i++) {

            // Mandatory instructions are done, then init application before continuing
            if(i == mandatoryInstructions.length + 1) {
                await structure_application.initializeApplication(data.application);
                // Write source script in generated workspace
                let historyPath = __dirname + '/../workspace/' + data.application.name + "/history_script.nps";
                let instructionsToWrite = fileLines.slice().splice(mandatoryInstructions.length + 2).join("\n");
                instructionsToWrite += "\n\n// --- End of the script --- //\n\n";
                fs.writeFileSync(historyPath, instructionsToWrite);
            }

            try {
                data = await execute(req, fileLines[i], __, data, false);
            } catch(err) {
                // Update script logs
                scriptData[userID].answers.unshift({
                    instruction: fileLines[i],
                    message: __(err.message, err.messageParams || [])
                });
                return processEnd(req.file.path, userID);
            }

            scriptData[userID].data = data;
            scriptData[userID].doneInstruction++;

            // Update script logs
            scriptData[userID].answers.unshift({
                instruction: fileLines[i],
                message: __(data.message, data.messageParams || [])
            });
        }

        // Workspace sequelize instance
        delete require.cache[require.resolve(__dirname + '/../workspace/' + data.application.name + '/models/')];
        const workspaceSequelize = require(__dirname + '/../workspace/' + data.application.name + '/models/');

        // We need to clear toSync.json
        let toSyncFileName = __dirname + '/../workspace/' + data.application.name + '/models/toSync.json';
        let toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

        let tableName = "TABLE_NAME"; // MySQL
        if(workspaceSequelize.sequelize.options.dialect == "postgres")
            tableName = "table_name";

        // Looking for already exisiting table in workspace BDD
        let result = await workspaceSequelize.sequelize.query("SELECT * FROM INFORMATION_SCHEMA.TABLES;", {type: workspaceSequelize.sequelize.QueryTypes.SELECT});
        let workspaceTables = [];
        for (let i = 0; i < result.length; i++)
            workspaceTables.push(result[i][tableName]);

        for(let entity in toSyncObject){
            if(workspaceTables.indexOf(entity) == -1 && !toSyncObject[entity].force){
                toSyncObject[entity].attributes = {};
                // We have to remove options from toSync.json that will be generate with sequelize sync
                // But we have to keep relation toSync on already existing entities
                if(typeof toSyncObject[entity].options !== "undefined"){
                    let cleanOptions = [];
                    for(let i=0; i<toSyncObject[entity].options.length; i++){
                        if(workspaceTables.indexOf(toSyncObject[entity].options[i].target) != -1 &&
                            toSyncObject[entity].options[i].relation != "belongsTo"){
                            cleanOptions.push(toSyncObject[entity].options[i]);
                        }
                    }
                    toSyncObject[entity].options = cleanOptions;
                }
            }
        }
        fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4), 'utf8');

        // Kill the application server if it's running, it will be restarted when accessing it
        let process_server_per_app = process_manager.process_server_per_app;
        if (process_server_per_app[data.application.name] != null && typeof process_server_per_app[data.application.name] !== "undefined")
            await process_manager.killChildProcess(process_server_per_app[data.application.name].pid)

        // Delete instructions file
        return processEnd(req.file.path, userID);
    });
}

router.get('/index', block_access.isLoggedIn, (req, res) => {
    res.render('front/instruction_script');
});

// Execute script file
router.post('/execute', block_access.isLoggedIn, multer({
    dest: './upload/'
}).single('instructions'), (req, res) => {

    let userID = req.session.passport.user.id;
    let __ = require("../services/language")(req.session.lang_user).__;

    // Init scriptData object for user. (session simulation)
    scriptData[userID] = {
        over: false,
        answers: [],
        doneInstruction: 0,
        totalInstruction: 0,
        isNewApp: false
    };

    // Script already processing
    if(isProcessing(userID, __)) {
        processEnd(req.file.path, userID);
        return res.end();
    }

    scriptProcessing.state = true;
    scriptProcessing.timeout = moment();

    // Get file extension
    let extensionFile = req.file.originalname.split(".");
    extensionFile = extensionFile[extensionFile.length -1];
    // Read file to determine encoding
    let encoding = jschardet.detect(fs.readFileSync(req.file.path));
    let acceptedEncoding = ['utf-8', 'windows-1252', 'ascii'];
    // If extension or encoding is not supported, send error
    if ((extensionFile != 'txt' && extensionFile != 'nps') || acceptedEncoding.indexOf(encoding.encoding.toLowerCase()) == -1) {
        scriptData[userID].answers.push({
            message: "File need to have .nps or .txt extension and utf8 or ascii encoding.<br>Your file have '"+extensionFile+"' extension and '"+encoding.encoding+"' encoding"
        });
        processEnd(req.file.path, userID);
        return res.end();
    }

    // Answer to client, next steps will be handle in ajax
    res.end();

    try {
        executeFile(req, userID, __);
    } catch (err) {
        console.error(err);
        return processEnd(req.file.path, userID);
    }
});

/* Execute when it's not a file upload but a file written in textarea */
router.post('/execute_alt', block_access.isLoggedIn, function(req, res) {

    let userID = req.session.passport.user.id;
    let __ = require("../services/language")(req.session.lang_user).__;

    // Init scriptData object for user. (session simulation)
    scriptData[userID] = {
        over: false,
        answers: [],
        doneInstruction: 0,
        totalInstruction: 0,
        authInstructions: false,
        ids: {
            id_project: -1,
            id_application: -1,
            id_module: -1,
            id_data_entity: -1
        }
    };

    // Processing already occured less than the last 100 seconds
    if(scriptProcessing.state && moment().diff(scriptProcessing.timeout, 'seconds') < 100){
        scriptData[userID].answers = [{
            message: __('instructionScript.alreadyProcessing')
        }];
        scriptData[userID].over = true;
        scriptData[userID].overDueToProcessing = true;
        return res.end();
    }

    // Reset idxAtMandatoryInstructionStart to handle multiple scripts execution
    idxAtMandatoryInstructionStart = -1;

    scriptProcessing.state = true;
    scriptProcessing.timeout = moment();

    let tmpFilename = moment().format('YY-MM-DD-HH_mm_ss')+"_custom_script.txt";
    let tmpPath = __dirname+'/../upload/'+tmpFilename;

    // Load template script and unzip master file if application is created using template
    let templateEntry = req.body.template_entry;
    let template = {};

    fs.openSync(tmpPath, 'w');

    if(templateEntry){
        let templateLang;
        switch(req.session.lang_user.toLowerCase()) {
            case "fr-fr":
                templateLang = "fr";
                break;
            case "en-en":
                templateLang = "en";
                break;
            default:
                templateLang = "fr";
                break;
        }

        let files = fs.readdirSync(__dirname + "/../templates/"+templateEntry);
        let filename = false;

        for (let i = 0; i < files.length; i++) {
            if (files[i].indexOf(".nps") != -1) {
                if(!filename)
                    filename = path.join(__dirname + "/../templates/"+templateEntry, files[i]);
                else if(files[i].indexOf("_"+templateLang+"_") != -1)
                    filename = path.join(__dirname + "/../templates/"+templateEntry, files[i]);
            }
        }

        if(!filename){
            scriptData[userID].answers = [{
                message: __('template.no_script')
            }];
            scriptData[userID].over = true;
            scriptProcessing.state = false;
            return res.end();
        }

        // Write template script in the tmpPath
        fs.writeFileSync(tmpPath, fs.readFileSync(filename));

    } else {
        fs.writeFileSync(tmpPath, req.body.text);
    }

    // Open file descriptor
    let rl = readline.createInterface({
        input: fs.createReadStream(tmpPath)
    });

    // Read file line by line, check for empty line, line comment, scope comment
    let fileLines = [],
        commenting = false,
        invalidScript = false;

    /* If one of theses value is to 2 after readings all lines then there is an error,
    line to 1 are set because they are mandatory lines added by the generator */
    let exception = {
        createNewProject : {
            value: 0,
            errorMessage: "You can't create or select more than one project in the same script."
        },
        createNewApplication : {
            value: 0,
            errorMessage: "You can't create or select more than one application in the same script."
        },
        createModuleHome: {
            value: 1,
            errorMessage: "You can't create a module home, because it's a default module in the application."
        },
        createModuleAuthentication: {
            value: 1,
            errorMessage: "You can't create a module authentication, because it's a default module in the application."
        },
        createEntityUser: {
            value: 1,
            errorMessage: "You can't create a entity user, because it's a default entity in the application."
        },
        createEntityRole: {
            value: 1,
            errorMessage: "You can't create a entity role, because it's a default entity in the application."
        },
        createEntityGroup: {
            value: 1,
            errorMessage: "You can't create a entity group, because it's a default entity in the application."
        },
        setFieldUnique: {
            value: 1,
            errorMessage: "You can't set a field unique in a script, please execute the instruction in preview."
        },
        delete: {
            value: 1,
            errorMessage: "Please do not use delete instruction in script mode."
        }
    };

    rl.on('line', function(sourceLine) {
        let line = sourceLine;

        // Empty line || One line comment scope
        if (line.trim() == '' || ((line.indexOf('/*') != -1 && line.indexOf('*/') != -1) || line.indexOf('//*') != -1))
            return;
        // Comment scope start
        if (line.indexOf('/*') != -1 && !commenting)
            commenting = true;
        // Comment scope end
        else if (line.indexOf('*/') != -1 && commenting)
            commenting = false;
        else if (!commenting) {
            let positionComment = line.indexOf('//');
            // Line start with comment
            if (positionComment == 0)
                return;
            // Line comment is after or in the instruction
            if (positionComment != -1){
                line = line.substring(0, line.indexOf('//'));
            }
            let parserResult = parser.parse(line);
            // Get the wanted function given by the bot to do some checks
            let designerFunction = parserResult.function;
            let designerValue = null;
            if(typeof parserResult.options !== "undefined")
                designerValue = parserResult.options.value?parserResult.options.value:null;
            if (designerFunction == "createNewProject" || designerFunction == "selectProject")
                exception.createNewProject.value += 1;
            if (designerFunction == "createNewApplication" || designerFunction == "selectApplication"){
                if (designerFunction == "createNewApplication")
                    scriptData[userID].authInstructions = true;
                exception.createNewApplication.value += 1;
            }
            if(designerFunction == "createNewModule" && designerValue.toLowerCase() == "home")
                exception.createModuleHome.value += 1;

            if(designerFunction == "createNewModule" && designerValue.toLowerCase() == "authentication")
                exception.createModuleAuthentication.value += 1;

            if(designerFunction == "createNewEntity" && designerValue.toLowerCase() == "user")
                exception.createEntityUser.value += 1;

            if(designerFunction == "createNewEntity" && designerValue.toLowerCase() == "role")
                exception.createEntityRole.value += 1;

            if(designerFunction == "createNewEntity" && designerValue.toLowerCase() == "group")
                exception.createEntityGroup.value += 1;

            if(typeof designerFunction !== 'undefined' && designerFunction.indexOf('delete') != -1)
                exception.delete.value += 1;

            // if(designerFunction == "setFieldKnownAttribute" && parserResult.options.word.toLowerCase() == "unique")
            //     exception.setFieldUnique.value += 1;

            fileLines.push(line);
        }
    });

    // All lines read, execute instructions
    rl.on('close', function() {
        let isError = false;
        let stringError = "";
        for(let item in exception){
            if(exception[item].value > 1){
                stringError += exception[item].errorMessage + '<br><br>';
                isError = true;
            } else if(item == "createNewProject" && exception[item].value == 0){
                stringError += 'You have to create or select a project in your script.<br><br>';
                isError = true;
            } else if(item == "createNewApplication" && exception[item].value == 0){
                stringError += 'You have to create or select an application in your script.<br><br>';
                isError = true;
            }
        }

        if(isError){
            scriptData[userID].answers = [];
            scriptData[userID].answers.push({
                message: stringError
            });
            scriptData[userID].over = true;
            scriptProcessing.state = false;
        } else{
            scriptData[userID].totalInstruction = scriptData[userID].authInstructions ? fileLines.length + mandatoryInstructions.length : fileLines.length;
            recursiveExecute(req, fileLines, 0).then(function(idApplication) {
                // Workspace sequelize instance
                delete require.cache[require.resolve(__dirname+ '/../workspace/'+idApplication+'/models/')];
                let workspaceSequelize = require(__dirname +'/../workspace/'+idApplication+'/models/');

                // We need to clear toSync.json
                let toSyncFileName = __dirname + '/../workspace/'+idApplication+'/models/toSync.json';
                let toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

                let tableName = "TABLE_NAME";
                if(workspaceSequelize.sequelize.options.dialect == "postgres")
                    tableName = "table_name";
                // Looking for already exisiting table in workspace BDD
                workspaceSequelize.sequelize.query("SELECT * FROM INFORMATION_SCHEMA.TABLES;", {type: workspaceSequelize.sequelize.QueryTypes.SELECT}).then(function(result){
                    let workspaceTables = [];
                    for(let i=0; i<result.length; i++){
                        if(result[i][tableName].substring(0, result[i][tableName].indexOf("_")+1) == idApplication+"_"){
                            workspaceTables.push(result[i][tableName]);
                        }
                    }

                    for(let entity in toSyncObject){
                        if(workspaceTables.indexOf(entity) == -1 && !toSyncObject[entity].force){
                            toSyncObject[entity].attributes = {};
                            // We have to remove options from toSync.json that will be generate with sequelize sync
                            // But we have to keep relation toSync on already existing entities
                            if(typeof toSyncObject[entity].options !== "undefined"){
                                let cleanOptions = [];
                                for(let i=0; i<toSyncObject[entity].options.length; i++){
                                    if(workspaceTables.indexOf(idApplication+"_"+toSyncObject[entity].options[i].target) != -1 && toSyncObject[entity].options[i].relation != "belongsTo")
                                        cleanOptions.push(toSyncObject[entity].options[i]);
                                }
                                toSyncObject[entity].options = cleanOptions;
                            }
                        }
                    }

                    // If there is data to add in template
                    if (templateEntry && fs.existsSync(__dirname + '/../templates/' + templateEntry + "/data.json")){
                        let dataSqlContent = JSON.parse(fs.readFileSync(__dirname + '/../templates/' + templateEntry + "/data.json", "utf8"), null, 4);
                        if(dataSqlContent.length != 0 && !toSyncObject.queries)
                            toSyncObject.queries = [];
                        for (let i = 0; i < dataSqlContent.length; i++) {
                            for (let j = 0; j < dataSqlContent[i].queries.length; j++) {
                                toSyncObject.queries.push(dataSqlContent[i].queries[j].replace(dataSqlContent[i].table, idApplication+"_"+dataSqlContent[i].table))
                            }
                        }
                    }

                    fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4), 'utf8');

                    // Copy choosen template in generated workspace
                    if (templateEntry) {
                        fs.copySync(__dirname + '/../templates/' + templateEntry, __dirname + '/../workspace/' + idApplication);
                    }

                    // Restart the application server is already running
                    let process_manager = require('../services/process_manager.js');
                    //let process_server = process_manager.process_server;
                    let process_server_per_app = process_manager.process_server_per_app;


                    if (process_server_per_app[idApplication] != null && typeof process_server_per_app[idApplication] !== "undefined") {
                        process_manager.killChildProcess(process_server_per_app[idApplication].pid, function(err) {
                            if(err)
                                console.error(err);

                            // Preparation to start a new child server
                            let math = require('math');
                            let port = math.add(9000, idApplication);
                            let env = Object.create(process.env);
                            env.PORT = port;

                            // Launch server for preview
                            process_server_per_app[idApplication] = process_manager.launchChildProcess(req, idApplication, env);

                            // Finish and redirect to the application
                            scriptData[userID].over = true;
                            scriptProcessing.state = false;
                        });
                    } else {
                        scriptData[userID].over = true;
                        scriptProcessing.state = false;
                    }
                }).catch(function(err) {
                    console.error(err);
                });
            }).catch(function(err) {
                console.error(err);
                scriptData[userID].over = true;
            });
        }

        // Delete instructions file
        fs.unlinkSync(tmpPath);
    });

    res.end();
});

// Script execution status
router.get('/status', (req, res) => {
    try {
        let userID = req.session.passport.user.id;
        res.send(scriptData[userID]).end();
        // Clean answers that will be shown in the client
        scriptData[userID].answers = [];
        if(scriptData[userID].over)
            delete scriptData[userID];
    } catch(err) {
        console.error(err);
        res.send({
            skip: true
        }).end();
    }
});

module.exports = router;