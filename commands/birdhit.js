module.exports = async (sock, message, args) => {
    if (!sock.gemini) {
        return sock.sendMessage(
            message.key.remoteJid,
            { text: '❌ Gemini not loaded on socket' },
            { quoted: message }
        );
    }

    const prompt = args.join(' ');
    const reply = await sock.gemini(prompt);

    await sock.sendMessage(
        message.key.remoteJid,
        { text: reply },
        { quoted: message }
    );
};
