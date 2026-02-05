async function birdhit(sock, message, args) {
  const chatId = message.key.remoteJid;
  const input = args.join(' ').trim();

  if (!input) {
    return sock.sendMessage(
      chatId,
      { text: '❗ Usage: .birdhit <incident details>' },
      { quoted: message }
    );
  }

  // Simple keyword extraction (safe & offline)
  const runwayMatch = input.match(/runway\s?(\w+)/i);
  const aircraftMatch = input.match(/aircraft\s?([a-z0-9\-]+)/i);
  const phase =
    /landing/i.test(input) ? 'Landing Roll' :
    /takeoff/i.test(input) ? 'Takeoff Roll' :
    'Unknown';

  const runway = runwayMatch ? runwayMatch[1].toUpperCase() : 'Not specified';
  const aircraft = aircraftMatch ? aircraftMatch[1].toUpperCase() : 'Not specified';

  const report = `
📢 *OFFICIAL BIRD HIT INCIDENT REPORT* ✈️

**Airport:** Karachi International Airport (OPKC)  
**Date/Time:** ${new Date().toLocaleString()}  
**Aircraft Type:** ${aircraft}  
**Runway:** ${runway}  
**Phase of Flight:** ${phase}  

**Incident Description:**  
${input}

**Immediate Action Taken:**  
🛠️ Aircraft inspection initiated by engineering team.

**Operational Impact:**  
⚠️ No immediate operational hazard reported.

**Safety Assessment:**  
✅ Flight safety maintained. Continuous monitoring advised.

**Report Status:**  
📄 Logged for safety review and wildlife hazard mitigation.

—  
*Aviation Safety & Operations*
`.trim();

  await sock.sendMessage(
    chatId,
    { text: report },
    { quoted: message }
  );
}

module.exports = { birdhit };
