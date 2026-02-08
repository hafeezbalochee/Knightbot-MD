/**
 * Knight Bot – ADS-B Karachi Airspace
 * Source: OpenSky Network (LEGAL)
 */

const axios = require('axios');

module.exports = async function adsbKarachi(sock, chatId, message) {
    try {
        const { data } = await axios.get(
            'https://opensky-network.org/api/states/all',
            { timeout: 10000 }
        );

        if (!data.states || !data.states.length) {
            return sock.sendMessage(chatId, {
                text: '❌ ADS-B data unavailable.'
            }, { quoted: message });
        }

        // Karachi FIR bounding box
        const KARACHI = {
            minLat: 24.5,
            maxLat: 25.3,
            minLon: 66.5,
            maxLon: 67.5
        };

        const flights = data.states.filter(s =>
            s[5] && s[6] &&
            s[6] >= KARACHI.minLat &&
            s[6] <= KARACHI.maxLat &&
            s[5] >= KARACHI.minLon &&
            s[5] <= KARACHI.maxLon
        );

        if (!flights.length) {
            return sock.sendMessage(chatId, {
                text: '✈️ No live aircraft in Karachi airspace right now.'
            }, { quoted: message });
        }

        let reply = `✈️ *KARACHI AIRSPACE – LIVE ADS-B*\n`;
        reply += `━━━━━━━━━━━━━━━━━━\n\n`;

        flights.slice(0, 8).forEach((f, i) => {
            reply += `🛩 *FLIGHT ${i + 1}*\n`;

            if (f[1]) reply += `• CallSign: ${f[1].trim()}\n`;
            if (f[2]) reply += `• Country: ${f[2]}\n`;
            if (f[7]) reply += `• Altitude: ${f[7].toFixed(0)} m\n`;
            if (f[9]) reply += `• Speed: ${(f[9] * 3.6).toFixed(0)} km/h\n`;
            if (f[10]) reply += `• Heading: ${f[10].toFixed(0)}°\n`;

            reply += `• On Ground: ${f[8] ? 'YES' : 'NO'}\n`;
            reply += `\n`;
        });

        reply += `━━━━━━━━━━━━━━━━━━\n📡 *ADS-B | OpenSky | OPKC FIR*`;

        await sock.sendMessage(chatId, { text: reply }, { quoted: message });

    } catch (err) {
        console.error('Karachi ADS-B Error:', err.message);
        await sock.sendMessage(chatId, {
            text: '❌ Karachi airspace ADS-B error.'
        }, { quoted: message });
    }
};