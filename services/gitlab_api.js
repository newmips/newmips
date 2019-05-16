const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');
const request = require('request-promise');

let gitlabURL = gitlabConf.protocol + "://" + gitlabConf.url + "/api/v4";
let token = gitlabConf.privateToken;

exports.getUser = async (email) => {
    let options = {
        uri: gitlabURL + "/users",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        qs: {
        	search: email
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => getUser");

    try {
    	let user = await request(options);
    	return user.length == 0 ? false : user[0];
    } catch(err){
    	console.error(err);
    	throw new Error("An error occured while getting gitlab user.");
    }
}

exports.createUser = async (infos) => {
    let options = {
        uri: gitlabURL + "/users",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        body: infos,
        json: true
    };

    console.log("GITLAB CALL => createUser");

    try {
    	return await request(options);
    } catch(err){
    	console.error(err);
    	throw new Error("An error occured while creating gitlab user.");
    }
}

exports.createProjectForUser = async (infos) => {
    let options = {
        uri: gitlabURL + "/projects/user/"+infos.user_id,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        body: infos,
        json: true
    };

    console.log("GITLAB CALL => createProjectForUser");

    try {
    	return await request(options);
    } catch(err){
    	console.error(err);
    	throw new Error("An error occured while creating gitlab repository for user.");
    }
}

exports.addMemberToProject = async (infos) => {
    let options = {
        uri: gitlabURL + "/projects/"+infos.id+"/members",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        body: infos,
        json: true
    };

    console.log("GITLAB CALL => addMemberToProject");

    try {
    	return await request(options);
    } catch(err){
    	console.error(err);
    	throw new Error("An error occured while creating gitlab repository for user.");
    }
}

exports.getProject = async (projectName) => {
    let options = {
        uri: gitlabURL + "/projects",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => getProject");

    try {
    	let allProjects = await request(options);
    	let project = allProjects.filter(x => {return x.name == projectName});
    	return project.length == 0 ? false : project[0];
    } catch(err){
    	console.error(err);
    	throw new Error("An error occured while getting gitlab project.");
    }
}

exports.deleteProject = async (projectID) => {
    let options = {
        uri: gitlabURL + "/projects/"+projectID,
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => deleteProject");

    try {
    	return await request(options);
    } catch(err){
    	console.error(err);
    	throw new Error("An error occured while deleting gitlab project.");
    }
}