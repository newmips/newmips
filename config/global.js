const env = 'develop';
const config = {
	develop: {
		env: 'develop',
		protocol: 'http',
		protocol_iframe: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		authStrategy: 'local',
		support_chat_enabled: false
	},
	recette: {
		env: 'recette',
		protocol: 'https',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"fakeKey",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"fakeCert",
			passphrase : ''
		},
		authStrategy: 'local',
		support_chat_enabled: false
	},
	production: {
		env: 'production',
		protocol: 'https',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"fakeKey",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"fakeCert",
			passphrase : ''
		},
		authStrategy: 'local',
		support_chat_enabled: false
	},
    docker: {
        env: 'docker',
        protocol: 'http',
        protocol_iframe: 'http',
        host: '127.0.0.1',
        dns: process.env.DOMAIN_STUDIO,
        dns_cloud: process.env.DOMAIN_CLOUD,
        sub_domain: process.env.SUB_DOMAIN,
        port: process.env.PORT || 1337,
        support_chat_enabled: false,
        separate_workspace_db: true,
        authStrategy: 'local',
        server_ip: process.env.SERVER_IP
    },
    cloud: {
        env: 'cloud',
        protocol: 'http',
        protocol_iframe: 'https',
        host: process.env.HOSTNAME,
        dns: process.env.DOMAIN_STUDIO,
        dns_cloud: process.env.DOMAIN_CLOUD,
        sub_domain: process.env.SUB_DOMAIN,
        port: process.env.PORT || 1337,
        support_chat_enabled: true,
        separate_workspace_db: true,
        authStrategy: 'local',
        server_ip: process.env.SERVER_IP
    }
}

const fullConfig = config[env];
fullConfig.version = "2.8";

module.exports = fullConfig;
