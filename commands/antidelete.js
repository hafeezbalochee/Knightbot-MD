const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Ensure directories exist
if (!fs.existsSync(TEMP_MEDIA_DIR)) fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
if (!fs.existsSync(path.join(__dirname, '../data'))) fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });

// --- UTILS ---
const loadAntideleteConfig = () => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch { return { enabled: false }; }
};

const saveAntideleteConfig = (config) => {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } 
    catch (err) { console.error('Config save error:', err); }
};

// Periodic Cleanup (200MB limit)
setInterval(() => {
    try {
        const files = fs.readdirSync(TEMP_MEDIA_DIR);
        let totalSize = 0;
        files.forEach(f => totalSize += fs.statSync(path.join(TEMP_MEDIA_DIR, f)).size);
        if (totalSize / (1024 * 1024) > 200) {
            files.forEach(f => fs.unlinkSync(path.join(TEMP_MEDIA_DIR, f)));
            console.log('🗑️ Antidelete Temp Cleared');
        }
    } catch (e) { console.error('Cleanup error:', e); }
}, 60000);

const isOwnerOrSudo = require('../lib/isOwner');

// --- COMMAND HANDLER ---
async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        return sock.sendMessage(chatId, { text: '*Owner permission required.*' }, { quoted: message });
    }

    const config = loadAntideleteConfig();
    if (!match) {
        return sock.sendMessage(chatId, { 
            text: `*ANTIDELETE SYSTEM*\nStatus: ${config.enabled ? '✅' : '❌'}\n\nUsage: .antidelete on/off` 
        }, { quoted: message });
    }

    config.enabled = (match === 'on');
    saveAntideleteConfig(config);
    return sock.sendMessage(chatId, { text: `*Antidelete is now ${config.enabled ? 'Enabled' : 'Disabled'}*` }, { quoted: message });
}

// --- MESSAGE STORAGE & MEDIA HANDLING ---
async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled || !message.key?.id || !message.message) return;

        const messageId = message.key.id;
        const sender = message.key.participant || message.key.remoteJid;
        let content = '', mediaType = '', mediaPath = '', isViewOnce = false;

        // Unwrap ViewOnce
        const vOnce = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        const msg = vOnce || message.message;
        if (vOnce) isViewOnce = true;

        // Determine content and type
        if (msg.conversation) content = msg.conversation;
        else if (msg.extendedTextMessage) content = msg.extendedTextMessage.text;
        else if (msg.imageMessage) { mediaType = 'image'; content = msg.imageMessage.caption; }
        else if (msg.videoMessage) { mediaType = 'video'; content = msg.videoMessage.caption; }
        else if (msg.stickerMessage) mediaType = 'sticker';
        else if (msg.audioMessage) mediaType = 'audio';

        // Safe Media Download
        if (mediaType) {
            const mediaData = msg[`${mediaType}Message`];
            // CRITICAL FIX: Check if media key exists before downloading
            if (mediaData && (mediaData.url || mediaData.directPath)) {
                try {
                    const buffer = await downloadContentFromMessage(mediaData, mediaType);
                    const ext = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : mediaType === 'sticker' ? 'webp' : 'mp3';
                    mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
                    await writeFile(mediaPath, buffer);
                } catch (e) { console.log(`Skipping media download: ${e.message}`); }
            }
        }

        messageStore.set(messageId, {
            content, mediaType, mediaPath, sender,
            group: message.key.remoteJid.endsWith('@g.us') ? message.key.remoteJid : null,
            timestamp: new Date().toISOString()
        });

        // Anti-ViewOnce Instant Forward
        if (isViewOnce && mediaPath && fs.existsSync(mediaPath)) {
            const owner = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const options = { caption: `*Anti-ViewOnce Detected*\nFrom: @${sender.split('@')[0]}`, mentions: [sender] };
            if (mediaType === 'image') await sock.sendMessage(owner, { image: { url: mediaPath }, ...options });
            else if (mediaType === 'video') await sock.sendMessage(owner, { video: { url: mediaPath }, ...options });
            try { fs.unlinkSync(mediaPath); } catch {}
        }
    } catch (err) { console.error('Store error skipped.'); }
}

// --- REVOCATION HANDLER ---
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        const protocolMsg = revocationMessage.message?.protocolMessage;
        if (!config.enabled || !protocolMsg?.key?.id) return;

        const original = messageStore.get(protocolMsg.key.id);
        if (!original) return;

        const owner = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const deletedBy = revocationMessage.participant || revocationMessage.key.remoteJid;
        if (deletedBy === owner) return;

        let report = `*🔰 ANTIDELETE REPORT 🔰*\n\n` +
                     `*🗑️ Deleted By:* @${deletedBy.split('@')[0]}\n` +
                     `*👤 Sender:* @${original.sender.split('@')[0]}\n`;
        if (original.group) report += `*👥 Group:* ${(await sock.groupMetadata(original.group)).subject}\n`;
        if (original.content) report += `\n*💬 Message:* ${original.content}`;

        await sock.sendMessage(owner, { text: report, mentions: [deletedBy, original.sender] });

        if (original.mediaPath && fs.existsSync(original.mediaPath)) {
            const mediaObj = {};
            mediaObj[original.mediaType] = { url: original.mediaPath };
            await sock.sendMessage(owner, { ...mediaObj, caption: `*Deleted ${original.mediaType}*` });
            try { fs.unlinkSync(original.mediaPath); } catch {}
        }
        messageStore.delete(protocolMsg.key.id);
    } catch (err) { console.error('Revocation error.'); }
}

module.exports = { handleAntideleteCommand, handleMessageRevocation, storeMessage };