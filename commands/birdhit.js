// commands/birdhit.js
async function birdhit(sock, message, args) {
  const chatId = message.key.remoteJid;
  const rawText = args.join(' ').trim();

  if (!rawText) {
    return sock.sendMessage(
      chatId,
      { text: '❗ USAGE:\n.bh\nKey: Value\nKey: Value' },
      { quoted: message }
    );
  }

  // 🔹 Extract value from message
  const getValue = (label) => {
    const regex = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'im');
    const match = rawText.match(regex);
    return match ? match[1].trim().toUpperCase() : null;
  };

  // 🔹 Show line ONLY if value exists
  const line = (title, value) =>
    value ? `*${title}:* ${value}\n` : '';

  let report = `✈️ *BIRD HIT INCIDENT REPORT* ✈️
━━━━━━━━━━━━━━━━━━━━━━
`;

  report += line('INFORMATION RECEIVED FROM', getValue('InfoFrom'));
  report += line('REPORTING TIME', getValue('Reporting Time'));

  report += line('CALL SIGN', getValue('CallSign'));
  report += line('AIRCRAFT TYPE', getValue('Type'));
  report += line('REGISTRATION', getValue('Reg'));

  report += line('ORIGIN', getValue('Origin'));
  report += line('DESTINATION', getValue('Destination'));
  report += line('ETA', getValue('ETA'));
  report += line('ATA', getValue('ATA'));
  report += line('ATD', getValue('ATD'));

  report += line('PHASE OF FLIGHT', getValue('Phase'));
  report += line('RUNWAY', getValue('Runway'));
  report += line('RUNWAY STATUS', getValue('Runway Status'));
  report += line('HEIGHT', getValue('Height'));

  report += line('AIRCRAFT ENGINEER', getValue('Engineer'));
  report += line('ENGINEER LICENCE NO', getValue('Lic'));

  report += line('OBSERVATION', getValue('Observation'));

  report += `━━━━━━━━━━━━━━━━━━━━━━
⚠️ *AVIATION SAFETY – KARACHI AIRPORT*`;

  await sock.sendMessage(
    chatId,
    { text: report.trim() },
    { quoted: message }
  );
}

module.exports = { birdhit };
