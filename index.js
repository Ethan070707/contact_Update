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
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // 处理消息的代码
    console.log(`Message from ${message.author.tag}: ${message.content}`);
    
    // 发送到 n8n webhook
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!webhookUrl) {
            console.error('N8N_WEBHOOK_URL is not set!');
            return;
        }
        
        console.log('Sending to n8n webhook...');
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: message.author.username,
                tag: message.author.tag,
                content: message.content,
                channel: message.channel.name,
                channelId: message.channel.id,
                guild: message.guild?.name,
                guildId: message.guild?.id,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log('Successfully sent to n8n:', response.status);
        } else {
            console.error('Failed to send to n8n:', response.status, response.statusText);
        }
        
    } catch (error) {
        console.error('Error sending to n8n:', error);
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN is not set!');
    process.exit(1);
}

client.login(token);
