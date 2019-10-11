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

exports.updateUser = async (user, obj) => {
    let options = {
        uri: gitlabURL + "/users/"+user.id,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        qs: obj,
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => updateUser");

    try {
        let user = await request(options);
        return user.length == 0 ? false : user[0];
    } catch(err){
        console.error(err);
        throw new Error("An error occured while getting gitlab user.");
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

exports.getAllProjects = async () => {
    let options = {
        uri: gitlabURL + "/projects",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        qs: {
            search: globalConf.host // Reduce search on current generator repository
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => getAllProjects");

    try {
        return await request(options);
    } catch(err){
        console.error(err);
        throw new Error("An error occured while getting gitlab project.");
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
        qs: {
            search: globalConf.host // Reduce search on current generator repository
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

exports.getProjectForUser = async (userID) => {
    let options = {
        uri: gitlabURL + "/users/"+userID+"/projects",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => getProjectsForUser");

    try {
        return await request(options);
    } catch(err){
        console.error(err);
        throw new Error("An error occured while getting gitlab project.");
    }
}

exports.addUserToProject = async (userID, projectID) => {
    let options = {
        uri: gitlabURL + "/projects/"+projectID+"/members",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        qs: {
            user_id: userID,
            access_level: 30
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => addUserToProject");

    try {
        return await request(options);
    } catch(err) {
        console.warn("An error occured while adding user to gitlab project.");
        console.error(err.message);
        // throw new Error("An error occured while adding user to gitlab project.");
    }
}

exports.removeUserFromProject = async (userID, projectID) => {
    let options = {
        uri: gitlabURL + "/projects/"+projectID+"/members/"+userID,
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Private-Token': token
        },
        json: true // Automatically stringifies the body to JSON
    };

    console.log("GITLAB CALL => removeUserFromProject");

    try {
        return await request(options);
    } catch(err){
        console.warn("An error occured while remove user from gitlab project.")
        console.error(err.message);
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