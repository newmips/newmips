var globalConf = require('./global');

var config = {
    develop: {
        doGit: false, // Should the application try to push your app on a repository ?
        protocol: "http",
        url: "", // Your gitlab url
        sshUrl: "", // Something like git@yourgitlaburl
        useSSH: true, // Todo HTTP non handled for now
        adminUser: "", // Gitlab admin user
        privateToken: "" // Gitlab private token
    },
    recette: {
        doGit: false,
        protocol: "http",
        url: "",
        sshUrl: "",
        useSSH: true,
        adminUser: "",
        privateToken: ""
    },
    production: {
        doGit: false,
        protocol: "http",
        url: "",
        sshUrl: "",
        useSSH: true,
        adminUser: "",
        privateToken: ""
    },
    docker: {
        doGit: false, // Should the application try to push your app on a repository ?
        protocol: "http",
        url: "", // Your gitlab url
        sshUrl: "", // Something like git@yourgitlaburl
        useSSH: true, // Todo HTTP non handled for now
        adminUser: "", // Gitlab admin user
        privateToken: "" // Gitlab private token
    }
}

module.exports = config[globalConf.env];