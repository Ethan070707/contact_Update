const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// 您的 Discord bot 逻辑代码
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    // 处理消息的代码
    console.log(`Message from ${message.author.tag}: ${message.content}`);
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN is not set!');
    process.exit(1);
}

client.login(token);
