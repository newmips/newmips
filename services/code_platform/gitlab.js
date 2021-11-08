const fetch = require('node-fetch');

const globalConf = require('../../config/global.js');
const gitlabConf = require('../../config/code_platform.js');

const gitlabURL = gitlabConf.protocol + "://" + gitlabConf.url + "/api/v4";
const token = gitlabConf.token;

async function request(url, options) {
	const response = await fetch(url, options);
	let result;
	if (response.status < 200 || response.status >= 300){
		try {
			result = await response.json();
			result = result.message ? result.message : response.statusText;
		} catch(err) {
			result = response;
		}
		throw result;
	}

	try {
		result = await response.json();
	} catch(err) {
		result = response;
	}
	return result;
}

exports.initUser = async (user, password) => {

	if(!gitlabConf.enabled)
		return;

	console.log("GITLAB => initUser");

	let gitlabUser = await request(gitlabURL + `/users?search=${user.email}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});

	if(gitlabUser[0]){

		const accessToken = await request(gitlabURL + `/users/${gitlabUser[0].id}/personal_access_tokens`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Private-Token': token
			},
			body: JSON.stringify({
				user_id: gitlabUser[0].id,
				name: 'git_access_' + globalConf.host,
				scopes: ['read_repository', 'write_repository']
			})
		});

		gitlabUser[0].accessToken = accessToken.name + ':' + accessToken.token;

		// Access token is only available at this moment, so save it in Nodea database for later use
		await user.update({
			repo_access_token: gitlabUser[0].accessToken
		});

		return gitlabUser[0];
	}

	console.log(`GITLAB => MISSING USER ${user.email}, CREATING GITLAB ACCOUNT`);

	const login = user.email.replace(/@/g, "-").replace(/\./g, "-").trim();

	// Create user
	gitlabUser = await request(gitlabURL + "/users", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify({
			email: user.email,
			username: login,
			name: login,
			password: password,
			admin: false,
			skip_confirmation: user.id == 1 // Skip confirmation email for admin user of Nodea
		})
	});

	// Create personnal access token for git commands (push / pull / etc...)
	const accessToken = await request(gitlabURL + "/users/" + gitlabUser.id + "/personal_access_tokens", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify({
			user_id: gitlabUser.id,
			name: 'git_access_' + globalConf.host,
			scopes: ['read_repository', 'write_repository']
		})
	});

	gitlabUser.accessToken = accessToken.name + ':' + accessToken.token;

	// Access token is only available at this moment, so save it in Nodea database for later use
	await user.update({
		repo_access_token: gitlabUser.accessToken
	});

	return gitlabUser;
}

exports.getUser = async (user) => {

	if(!gitlabConf.enabled)
		return;

	console.log("GITLAB => getUser");

	const gitlabUser = await request(gitlabURL + `/users?search=${user.email}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});

	// Retrieve repo access token from Nodea database
	if(gitlabUser.length != 0)
		gitlabUser[0].accessToken = user.repo_access_token;

	return gitlabUser.length == 0 ? false : gitlabUser[0];
}

exports.createProject = async (name, user) => {

	if(!gitlabConf.enabled)
		return;

	console.log("GITLAB => createProject");

	return await request(gitlabURL + "/projects/user/" + user.id, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify({
			user_id: user.id,
			name: name,
			description: "A generated Nodea application.",
			issues_access_level: 'enabled',
			snippets_access_level: 'enabled',
			merge_requests_access_level: 'enabled',
			wiki_access_level: 'enabled',
			visibility: 'private'
		})
	});
}

exports.addUserToProject = async (user, project) => {

	if(!gitlabConf.enabled)
		return;

	console.log("GITLAB => addUserToProject");

	return await request(gitlabURL + "/projects/" + project.id + "/members", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify({
			id: project.id,
			user_id: user.id, // Current user
			access_level: 40
		})
	});
}

exports.removeUserFromProject = async (user, project) => {

	if(!gitlabConf.enabled)
		return;

	console.log("GITLAB => removeUserFromProject");

	return await request(gitlabURL + "/projects/" + project.id + "/members/" + user.id, {
		method: 'DELETE',
		headers: {
			'Private-Token': token
		}
	});
}

exports.getProjectByID = async(projectID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => getProjectByID");

	return await request(gitlabURL + "/projects/" + projectID, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.getProjectCommits = async(projectID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => getProjectCommits");

	return await request(gitlabURL + "/projects/" + projectID + "/repository/commits", {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.getProjectLabels = async(projectID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => getProjectLabels");

	return await request(gitlabURL + "/projects/" + projectID + "/labels", {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.getProjectIssues = async(projectID, userID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => getProjectIssues");

	let url = gitlabURL + "/projects/" + projectID + "/issues";
	if(userID)
		url += '?assignee_id=' + userID;

	return await request(url, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.getProjectTags = async(projectID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => getProjectTags");

	return await request(gitlabURL + "/projects/" + projectID + "/repository/tags", {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.getProjectBranch = async(projectID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => getProjectBranch");

	return await request(gitlabURL + "/projects/" + projectID + "/repository/branches", {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.getProjectByName = async(projectName) => {

	console.log("GITLAB => getProjectByName => " + projectName);

	const allProjects = await request(`${gitlabURL}/projects?search=${globalConf.host}&per_page=100`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
	const project = allProjects.filter(x => x.name == projectName);
	return project.length == 0 ? false : project[0];
}

exports.deleteProject = async(projectID) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => deleteProject");

	return await request(gitlabURL + "/projects/" + projectID, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		}
	});
}

exports.createIssue = async(projectID, data) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => createIssue");

	return await request(gitlabURL + "/projects/" + projectID + "/issues", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify(data)
	});
}

exports.createTag = async(projectID, data) => {

	if (!gitlabConf.enabled)
		return;

	console.log("GITLAB => createTag");

	return await request(gitlabURL + "/projects/" + projectID + "/repository/tags", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify(data)
	});
}

exports.generateAccessToken = async(gitlabUser, name, rights, expireAt) => {
	console.log('CALL => generateAccessToken');

	const accessToken = await request(gitlabURL + `/users/${gitlabUser.id}/personal_access_tokens`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Private-Token': token
		},
		body: JSON.stringify({
			user_id: gitlabUser.id,
			name: name,
			scopes: rights,
			expires_at: expireAt
		})
	});

	return accessToken.name + ':' + accessToken.token;
}