const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is running in ${client.guilds.cache.size} servers`);
});

// 处理Discord消息并转发到n8n
client.on('messageCreate', async message => {
    // 忽略bot发送的消息
    if (message.author.bot) return;
    
    // 记录收到的消息
    console.log(`Message from ${message.author.tag}: ${message.content}`);
    console.log(`Channel: ${message.channel.name} | Guild: ${message.guild?.name}`);
    
    // 检查是否在指定的服务器（如果设置了TARGET_GUILD_ID）
    const targetGuildId = process.env.TARGET_GUILD_ID;
    if (targetGuildId && message.guild?.id !== targetGuildId) {
        console.log(`Message ignored - not from target guild (${targetGuildId})`);
        return;
    }
    
    // 检查是否在指定的频道（如果设置了TARGET_CHANNEL_IDS）
    const targetChannelIds = process.env.TARGET_CHANNEL_IDS;
    if (targetChannelIds) {
        const allowedChannels = targetChannelIds.split(',').map(id => id.trim());
        if (!allowedChannels.includes(message.channel.id)) {
            console.log(`Message ignored - not from target channels (${targetChannelIds})`);
            return;
        }
    }
    
    // 发送到n8n webhook
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!webhookUrl) {
            console.error('N8N_WEBHOOK_URL is not set!');
            return;
        }
        
        console.log('Sending message to n8n webhook...');
        
        // 准备发送的数据
        const payload = {
            // 用户信息
            username: message.author.username,
            userTag: message.author.tag,
            userId: message.author.id,
            userDisplayName: message.author.displayName,
            
            // 消息内容
            content: message.content,
            messageId: message.id,
            timestamp: message.createdAt.toISOString(),
            
            // 频道信息
            channelName: message.channel.name,
            channelId: message.channel.id,
            channelType: message.channel.type,
            
            // 服务器信息
            guildName: message.guild?.name || 'Direct Message',
            guildId: message.guild?.id || null,
            
            // 附件信息（如果有）
            attachments: message.attachments.map(attachment => ({
                name: attachment.name,
                url: attachment.url,
                size: attachment.size,
                contentType: attachment.contentType
            })),
            
            // 项目信息（从环境变量获取）
            projectName: process.env.PROJECT_NAME || 'Discord Bot'
        };
        
        console.log('Payload to send:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Discord-Bot/1.0'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const responseText = await response.text();
            console.log(`✅ Successfully sent to n8n (${response.status})`);
            console.log('Response:', responseText);
        } else {
            const errorText = await response.text();
            console.error(`❌ Failed to send to n8n (${response.status}): ${response.statusText}`);
            console.error('Error response:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error sending to n8n:', error.message);
        console.error('Stack trace:', error.stack);
    }
});

// 错误处理
client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

// 处理进程退出
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

// 启动bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN is not set!');
    process.exit(1);
}

console.log('🚀 Starting Discord bot...');
client.login(token).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
