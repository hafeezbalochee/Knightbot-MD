async function birdhit(sock, message, args) {
  try {
    const chatId = message.key.remoteJid;
    const rawText = args.join(' ').trim();

    if (!rawText) {
      return sock.sendMessage(
        chatId,
        { text: '❗ *USAGE:*\n.bh Info From: [Value]\nReporting Time: [Value]' },
        { quoted: message }
      );
    }

    const getValue = (label) => {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
      const regex = new RegExp(`${escapedLabel}\\s*:\\s*([^\\n]+)`, 'i');
      const match = rawText.match(regex);
      return match ? match[1].trim().toUpperCase() : null;
    };

    // Compact Line: Ab title aur value ke darmian extra line nahi hogi
    const line = (title, value) => value ? `*${title}:* ${value}\n` : '';

    let report = `✈️ *BIRD HIT INCIDENT REPORT* ✈️\n━━━━━━━━━━━━━━━━━━━━\n`;

    report += line('INFO FROM', getValue('Info From') || getValue('InfoFrom'));
    report += line('TIME', getValue('Reporting Time'));
    report += line('CALLSIGN', getValue('Call Sign') || getValue('CallSign'));
    report += line('TYPE', getValue('Type'));
    report += line('REG', getValue('Reg'));
    report += line('ORIGIN', getValue('Origin'));
    report += line('DEST', getValue('Destination'));
    report += line('ETA', getValue('ETA'));
    report += line('ATA', getValue('ATA'));
    report += line('ATD', getValue('ATD'));
    report += line('PHASE', getValue('Phase'));
    report += line('RWY', getValue('Runway'));
    report += line('STATUS', getValue('Runway Status'));
    report += line('HEIGHT', getValue('Height'));
    report += line('ENGNR', getValue('Engineer'));
    report += line('LIC NO', getValue('Lic'));
    report += line('OBSERVATION', getValue('Observation'));

    report += `━━━━━━━━━━━━━━━━━━━━\n⚠️ *AIRSIDE OPERATION  - JIP*`;

    await sock.sendMessage(
      chatId,
      { text: report.trim() },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { birdhit };
