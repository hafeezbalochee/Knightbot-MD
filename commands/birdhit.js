const { franceking } = require('../main');

module.exports = [
  {
    name: 'birdhit',
    aliases: ['bh', 'report'],
    description: 'Generates a professional Karachi Airport Bird Hit report using AI.',
    category: 'Aviation',

    get flashOnly() {
      return franceking();
    },

    execute: async (king, msg, args) => {
      const fromJid = msg.key.remoteJid;
      const inputData = args.join(' ').trim();

      if (!inputData) {
        return await king.sendMessage(
          fromJid,
          { text: '❗ Usage: birdhit <raw bird hit data>' },
          { quoted: msg }
        );
      }

      try {
        const prompt = `
You are a professional Aviation Safety Officer at Karachi Airport.

Convert the following raw information into a clear, structured, and professional Bird Hit Incident Report.

Rules:
- Use **bold headings**
- Use professional aviation language
- Include aviation emojis (✈️ ⚠️ 🛠️)
- Format like an official safety alert

Raw Data:
${inputData}
        `.trim();

        if (!king.gemini || typeof king.gemini !== 'function') {
          throw new Error('Gemini AI not available');
        }

        const aiReply = await king.gemini(prompt);

        await king.sendMessage(
          fromJid,
          {
            text: `📢 *OFFICIAL BIRD HIT REPORT* 📢\n\n${aiReply}`
          },
          { quoted: msg }
        );

      } catch (err) {
        console.error('BirdHit Error:', err);

        await king.sendMessage(
          fromJid,
          {
            text:
              '❌ *Bird Hit AI Error*\n\n' +
              '• Gemini not configured\n' +
              '• GEMINI_API_KEY missing\n' +
              '• king.gemini not loaded'
          },
          { quoted: msg }
        );
      }
    }
  }
];
