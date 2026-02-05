// commands/birdhit.js

async function birdhit(sock, message) {
  const chatId = message.key.remoteJid;

  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    '';

  const rawText = text.replace(/^(\.bh|\.birdhit)/i, '').trim();

  if (!rawText) {
    return sock.sendMessage(
      chatId,
      { text: '❗ Usage:\n.bh\nField: Value' },
      { quoted: message }
    );
  }

  // ----------------------------
  // 🔍 PARSE INPUT
  // ----------------------------
  const data = {};
  rawText.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (value) data[key] = value.toUpperCase();
    }
  });

  // ----------------------------
  // 🧠 HELPERS
  // ----------------------------
  const has = (key) => data[key];
  const line = (label, key) =>
    has(key) ? `*${label}:* ${data[key]}\n` : '';

  // ----------------------------
  // ✈️ BUILD REPORT
  // ----------------------------
  let report = '';
  report += '✈️ *BIRD HIT INCIDENT REPORT* ✈️\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━\n';

  report += line('INFORMATION RECEIVED FROM', 'InfoFrom');
  report += line('REPORTING TIME', 'Reporting Time');

  if (report.endsWith('\n')) report += '\n';

  report += line('CALL SIGN', 'CallSign');
  report += line('AIRCRAFT TYPE', 'Type');
  report += line('REGISTRATION', 'Reg');

  if (report.endsWith('\n')) report += '\n';

  report += line('ORIGIN', 'Origin');
  report += line('DESTINATION', 'Destination');
  report += line('ETA', 'ETA');
  report += line('ATA', 'ATA');
  report += line('ATD', 'ATD');

  if (report.endsWith('\n')) report += '\n';

  report += line('PHASE OF FLIGHT', 'Phase');
  report += line('RUNWAY', 'Runway');
  report += line('RUNWAY STATUS', 'Runway Status');
  report += line('HEIGHT', 'Height');

  if (report.endsWith('\n')) report += '\n';

  report += line('AIRCRAFT ENGINEER', 'Engineer');
  report += line('ENGINEER LICENCE NO', 'Lic');

  if (report.endsWith('\n')) report += '\n';

  report += line('OBSERVATION', 'Observation');

  report += '━━━━━━━━━━━━━━━━━━━━━━\n';
  report += '⚠️ *AIRSIDE OPERATIONS OFFICE*';

  await sock.sendMessage(chatId, { text: report }, { quoted: message });
}

module.exports = { birdhit };



