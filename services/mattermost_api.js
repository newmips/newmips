const globalConfig = require('../config/global.js');
const mattermostConfig = require('../config/mattermost.js');

const request = require('request-promise');
const fs = require("fs-extra");

let token, supportUser, channel, channelName, supportTeam, newmipsTeam, teamMembers, incomingHook;

exports.init = async (appName) => {

    // Get authent token
    token = await authenticate();

    // Check that channel for current app + generator exist
    channelName = appName + "-" + globalConfig.host.replace(/\./g, "");
    channel = await getChannel(channelName);

    if(!channel){

        // Support team is the team where the discussing channel is
        supportTeam = await getTeam(mattermostConfig.team);

        channel = await createChannel(channelName, supportTeam.id);

        // Newmips team represent all the support person from newmips that will be added to the channel
        newmipsTeam = await getTeam(mattermostConfig.newmips_members);

        // Get all newmips team members
        teamMembers = await getTeamMembers(newmipsTeam.id);

        // Add all team to the channel
        await addTeamToChannel(teamMembers, channel.id);
    }

    return channel;
}

exports.send = async (appName, message) => {

    // Get authent token
    token = await authenticate();

    // Check that channel for current app + generator exist
    channelName = appName + "-" + globalConfig.host.replace(/\./g, "");
    channel = await getChannel(channelName);

    if(!channel)
        throw new Error("Missing mattermost channel.")

    return await sendMessage(channel, message);;
}

exports.watch = async (appName) => {

    // Get authent token
    token = await authenticate();

    // Check that channel for current app + generator exist
    channelName = appName + "-" + globalConfig.host.replace(/\./g, "");
    channel = await getChannel(channelName);

    if(!channel)
        throw new Error("Missing mattermost channel.")

    let posts = await getPosts(channel);

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
        json: true // Automatically stringifies the body to JSON
    };

    // console.log("CALL => Authentication");
    let callResults = await request(options);

    supportUser = callResults.body;

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
        json: true
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
        json: true
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
        json: true
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
        json: true
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
        json: true
    };
    for (var i = 0; i < teamMembers.length; i++) {
        member = teamMembers[i];
        options.body = {
            user_id: member.user_id
        };
        try {
            await request(options);
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
        json: true
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
        json: true
    };
    // console.log("CALL => getIncomingWebhook");
    let incomingWebhooks = await request(options);
    return incomingWebhooks.filter(x => {
        return x.channel_id == channelID
    })[0];
}

async function sendMessage(channel, message) {
    let options = {
        uri: mattermostConfig.api_url + "/posts",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: {
            channel_id: channel.id,
            message: message
        },
        json: true
    };

    // console.log("CALL => sendMessage");
    return await request(options);
}

async function getPosts(channel) {
    let options = {
        uri: mattermostConfig.api_url + "/channels/"+channel.id+"/posts",
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        qs: {
             page: "0",
             per_page: "50"
        },
        json: true
    };

    // console.log("CALL => getPosts");
    return await request(options);
}

