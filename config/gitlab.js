var config = {
    develop: {
        "doGit": false,
        "protocol": "http",
        "url": "cloud.newmips.com:1400",
        "sshUrl": "git@cloud.newmips.com",
        "useSSH": true,
        "adminUser": "",
        "privateToken": ""
    }
}

module.exports = config[globalConf.env];