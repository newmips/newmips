const globalConfig = require('../config/global.js');
const mattermostConfig = require('../config/mattermost.js');

const request = require('request-promise');
const fs = require("fs-extra");
const moment = require('moment');

let token = false, tokenExpire, supportUser, channel = {}, channelName, supportTeam, newmipsTeam, teamMembers, incomingHook;

exports.init = async (appName) => {

    // Get authent token
    if(!token || moment().diff(tokenExpire, "hours" >= 24))
        token = await authenticate();

    // Check that channel for current app + generator exist
    channelName = appName + "-" + globalConfig.host.replace(/\./g, "");
    channel[channelName] = await getChannel(channelName);

    if(!channel[channelName]){

        // Support team is the team where the discussing channel is
        supportTeam = await getTeam(mattermostConfig.team);

        channel[channelName] = await createChannel(channelName, supportTeam.id);

        // Newmips team represent all the support person from newmips that will be added to the channel
        newmipsTeam = await getTeam(mattermostConfig.support_members);

        // Get all newmips team members
        teamMembers = await getTeamMembers(newmipsTeam.id);

        // Add all team to the channel
        await addTeamToChannel(teamMembers, channel[channelName].id);
    }

    return channel[channelName];
}

exports.send = async (appName, message) => {

    // Get authent token
    if(!token || moment().diff(tokenExpire, "hours") >= 24)
        token = await authenticate();

    // Check that channel for current app + generator exist
    channelName = appName + "-" + globalConfig.host.replace(/\./g, "");

    if(!channel[channelName] || typeof channel[channelName] === "undefined")
        channel[channelName] = await getChannel(channelName);

    return await sendMessage(channel[channelName], message);
}

exports.watch = async (appName) => {

    if(!token || moment().diff(tokenExpire, "hours") >= 24)
        token = await authenticate();

    // Check that channel for current app + generator exist
    channelName = appName + "-" + globalConfig.host.replace(/\./g, "");

    if(!channel[channelName] || typeof channel[channelName] === "undefined")
        channel[channelName] = await getChannel(channelName);

    let posts = await getPosts(channel[channelName]);

    return {
        posts: posts,
        user: supportUser
    };
}

// Getting authentication token from mattermost
async function authenticate() {
    let options = {
        uri: mattermostConfig.api_url + "/users/login",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        resolveWithFullResponse: true, // Needed to get the response header with token in it
        body: {
            login_id: mattermostConfig.login,
            password: mattermostConfig.password
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    let callResults = await request(options);

    supportUser = callResults.body;

    tokenExpire = moment();

    // Return full token
    return "Bearer " + callResults.headers.token;
}

async function getChannel(channelName) {
    let options = {
        uri: mattermostConfig.api_url + "/teams/name/support/channels/name/" + channelName,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    // console.log("CALL => getChannel " + channelName);
    try {
        return await request(options);
    } catch(err) {
        return false;
    }
}

async function getTeam(teamName) {
    let options = {
        uri: mattermostConfig.api_url + "/teams/name/"+teamName,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    // console.log("CALL => getTeam " + teamName);
    return await request(options);
}

async function getTeamMembers(teamID) {
    let options = {
        uri: mattermostConfig.api_url + "/teams/"+teamID+"/members",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    // console.log("CALL => getTeamMembers");
    return await request(options);
}

async function createChannel(channelName, teamID) {
    let options = {
        uri: mattermostConfig.api_url + "/channels",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: {
            team_id: teamID,
            name: channelName,
            display_name: channelName,
            purpose: "Chaine de support pour l'application "+channelName,
            header: "A man need a name, euh no, he need help !",
            type: "P"
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    // console.log("CALL => createChannel " + channelName);
    return await request(options);
}

async function addTeamToChannel(teamMembers, channelID) {
    let member;
    let options = {
        uri: mattermostConfig.api_url + "/channels/"+channelID+"/members",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    for (var i = 0; i < teamMembers.length; i++) {
        member = teamMembers[i];
        options.body = {
            user_id: member.user_id
        };
        try {
            request(options);
        } catch(err){
            console.log("ERROR WHILE ADDING MEMBER "+member.user_id+" TO CHANNEL");
            continue;
        }
    }

    // console.log("CALL => addTeamToChannel");
    return true;
}

async function createIncomingWebhook(channelID) {
    let options = {
        uri: mattermostConfig.api_url + "/hooks/incoming",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: {
            channel_id: channelID,
            display_name: "Generated hook from newmips environment"
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };
    // console.log("CALL => createIncomingWebhook");
    return await request(options);
}

async function getIncomingWebhook(teamID, channelID) {
    let options = {
        uri: mattermostConfig.api_url + "/hooks/incoming",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        qs: {
            page: "0",
            per_page: "1000",
            team_id: teamID
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };
    // console.log("CALL => getIncomingWebhook");
    let incomingWebhooks = await request(options);
    return incomingWebhooks.filter(x => {
        return x.channel_id == channelID
    })[0];
}

async function sendMessage(chan, message) {
    let options = {
        uri: mattermostConfig.api_url + "/posts",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: {
            channel_id: chan.id,
            message: message
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    // console.log("CALL => sendMessage");
    return await request(options);
}

async function getPosts(chan) {

    let options = {
        uri: mattermostConfig.api_url + "/channels/"+chan.id+"/posts",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        qs: {
            page: "0",
            per_page: "50"
        },
        json: true,
        rejectUnauthorized: false,
        insecure: true
    };

    return await request(options);
}

