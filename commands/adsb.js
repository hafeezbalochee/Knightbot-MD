/**
 * Knight Bot – ADS-B (ADSBexchange backend)
 * Command: .adsb
 * ⚠️ Unofficial source – testing purpose
 */

const axios = require('axios');

module.exports = async function adsb(sock, chatId, message, args) {
    try {
        if (!args.length) {
            return sock.sendMessage(chatId, {
                text: '✈️ Usage:\n.adsb <CALLSIGN | ICAO24>\n\nExample:\n.adsb UAE338'
            }, { quoted: message });
        }

        const query = args[0].toUpperCase().trim();

        const { data } = await axios.get(
            'https://globe.adsbexchange.com/data/globe_2025.json',
            {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json'
                }
            }
        );

        if (!data || !data.aircraft) {
            return sock.sendMessage(chatId, {
                text: '❌ ADS-B data unavailable.'
            }, { quoted: message });
        }

        const flight = data.aircraft.find(a =>
            (a.callsign && a.callsign.includes(query)) ||
            a.hex === query.toLowerCase()
        );

        if (!flight) {
            return sock.sendMessage(chatId, {
                text: '❌ Aircraft not found or not visible right now.'
            }, { quoted: message });
        }

        let reply = `✈️ *LIVE ADS-B FLIGHT*\n`;
        reply += `━━━━━━━━━━━━━━━━━━\n\n`;

        if (flight.callsign) reply += `• CallSign: ${flight.callsign.trim()}\n`;
        if (flight.hex) reply += `• ICAO24: ${flight.hex}\n`;
        if (flight.alt_baro) reply += `• Altitude: ${flight.alt_baro} ft\n`;
        if (flight.gs) reply += `• Speed: ${Math.round(flight.gs)} kt\n`;
        if (flight.track) reply += `• Heading: ${Math.round(flight.track)}°\n`;
        if (flight.lat && flight.lon)
            reply += `• Position: ${flight.lat}, ${flight.lon}\n`;

        reply += `\n━━━━━━━━━━━━━━━━━━\n⚠️ *ADS-B Exchange (Test Source)*`;

        await sock.sendMessage(chatId, { text: reply }, { quoted: message });

    } catch (err) {
        console.error('ADS-B Error:', err.message);
        await sock.sendMessage(chatId, {
            text: '❌ ADS-B service blocked or not reachable.'
        }, { quoted: message });
    }
};