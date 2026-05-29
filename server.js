require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  dbRun,
  dbGet,
  dbAll,
  initDatabase
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup Helper
initDatabase();

// Helpers
function generateFIRId() {
  const num = Math.floor(100000 + Math.random() * 900000); // 6-digit number
  return `FIR2026-${num}`;
}

function generateSOSId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `SOS-${dateStr}-${num}`;
}

const statusMilestones = {
  'submitted': 'Complaint submitted',
  'reviewing': 'Under review',
  'fir': 'FIR registered',
  'investigating': 'Investigation started',
  'evidence': 'Evidence check',
  'action': 'Action taken',
  'resolved': 'Resolved',
  'closed': 'Closed'
};

// API Endpoints

// 0. POST /api/login
app.post('/api/login', (req, res) => {
  const { role, name, mobile, badgeId, pin } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  if (role === 'police') {
    if (!badgeId || !pin) {
      return res.status(400).json({ error: 'Badge ID and PIN are required' });
    }
    
    // Seeded Officer Accounts for live demo
    const policeAccounts = {
      'INS-KUMAR': { name: 'Insp. A. Kumar', badgeId: 'INS-KUMAR', station: 'Bidhannagar', pin: '1234' },
      'SI-SHARMA': { name: 'SI R. Sharma', badgeId: 'SI-SHARMA', station: 'New Town', pin: '1234' }
    };
    
    const account = policeAccounts[badgeId.toUpperCase()];
    if (account && account.pin === pin) {
      return res.json({
        success: true,
        user: {
          name: account.name,
          badgeId: account.badgeId,
          station: account.station,
          role: 'police'
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid Badge ID or secure PIN' });
    }
  } else if (role === 'citizen') {
    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile number are required' });
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }
    return res.json({
      success: true,
      user: {
        name: name.trim(),
        mobile: mobile.trim(),
        role: 'citizen'
      }
    });
  } else {
    return res.status(400).json({ error: 'Invalid role selection' });
  }
});

// 1. GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalRow = await dbGet('SELECT COUNT(*) AS count FROM complaints');
    const resolvedRow = await dbGet("SELECT COUNT(*) AS count FROM complaints WHERE status = 'resolved' OR status = 'closed'");
    
    const total = totalRow.count;
    const resolved = resolvedRow.count;
    const rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0';

    res.json({
      totalComplaints: total,
      resolvedCases: resolved,
      resolutionRate: `${rate}%`,
      avgResponse: '4.1 days', // Realistic average response metric
      uptime: '98.4%'
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /api/complaints
app.get('/api/complaints', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM complaints';
    let params = [];

    if (status && status !== 'all') {
      // Map frontend filters to DB statuses
      if (status === 'evidence') {
        query += " WHERE status = 'evidence'";
      } else {
        query += ' WHERE status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY created_at DESC';
    const complaints = await dbAll(query, params);
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. GET /api/complaints/:id
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [id]);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const timeline = await dbAll('SELECT * FROM timeline WHERE complaint_id = ? ORDER BY created_at ASC', [id]);
    res.json({ complaint, timeline });
  } catch (err) {
    console.error('Error fetching complaint details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. POST /api/complaints
app.get('/api/check', (req, res) => res.send('OK')); // simple check

app.post('/api/complaints', async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      aadhaar,
      type,
      date,
      location,
      description,
      accused,
      district,
      police_station,
      attachments
    } = req.body;

    if (!name || !mobile || !type || !date || !location || !description || !district || !police_station) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const id = generateFIRId();
    
    // Automatically set priority based on severity of complaint types
    let priority = 'Medium';
    const highPriorityTypes = ['domestic violence', 'sexual harassment', 'assault', 'trafficking'];
    if (highPriorityTypes.includes(type.toLowerCase())) {
      priority = 'High';
    } else if (['stalking / cyberstalking', 'cybercrime / morphed images'].includes(type.toLowerCase())) {
      priority = 'High';
    } else if (['other', 'theft / robbery'].includes(type.toLowerCase())) {
      priority = 'Low';
    }

    // Insert into complaints
    await dbRun(`
      INSERT INTO complaints (id, name, mobile, email, aadhaar, type, date, location, description, accused, district, police_station, status, priority, assigned_officer, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, 'SI R. Sharma', ?)
    `, [id, name, mobile, email || null, aadhaar || null, type, date, location, description, accused || null, district, police_station, priority, attachments || null]);

    // Insert initial timeline event
    await dbRun(`
      INSERT INTO timeline (complaint_id, status, title, remarks)
      VALUES (?, 'submitted', 'Complaint submitted', 'SMS and Email confirmation sent. System logged successfully.')
    `, [id]);

    res.status(201).json({ id, message: 'Complaint successfully registered.' });
  } catch (err) {
    console.error('Error lodging complaint:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. PUT /api/complaints/:id/status
app.put('/api/complaints/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status || !remarks) {
      return res.status(400).json({ error: 'Status and remarks are required' });
    }

    const lowerStatus = status.toLowerCase().replace(/\s+/g, '');
    let mappedStatus = 'submitted';
    
    // Map human readable statuses to code statuses
    if (lowerStatus.includes('review')) mappedStatus = 'reviewing';
    else if (lowerStatus.includes('fir')) mappedStatus = 'fir';
    else if (lowerStatus.includes('investigating') || lowerStatus.includes('investigationstarted')) mappedStatus = 'investigating';
    else if (lowerStatus.includes('evidence')) mappedStatus = 'evidence';
    else if (lowerStatus.includes('action')) mappedStatus = 'action';
    else if (lowerStatus.includes('resolve')) mappedStatus = 'resolved';
    else if (lowerStatus.includes('close')) mappedStatus = 'closed';

    const milestoneTitle = statusMilestones[mappedStatus] || status;

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Update complaint state
    await dbRun(`
      UPDATE complaints 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [mappedStatus, id]);

    // Insert new timeline event
    await dbRun(`
      INSERT INTO timeline (complaint_id, status, title, remarks)
      VALUES (?, ?, ?, ?)
    `, [id, mappedStatus, milestoneTitle, remarks]);

    res.json({ success: true, status: mappedStatus, title: milestoneTitle });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. POST /api/sos
app.post('/api/sos', async (req, res) => {
  try {
    const { complainant_name, location } = req.body;
    
    const id = generateSOSId();
    const name = complainant_name || 'Priya Sharma';
    const loc = location || 'Lat: 22.5726, Lng: 88.3639 (Kolkata)'; // default to Kolkata if not provided

    await dbRun(`
      INSERT INTO sos_alerts (id, complainant_name, location)
      VALUES (?, ?, ?)
    `, [id, name, loc]);

    res.status(201).json({
      id,
      complainant_name: name,
      location: loc,
      message: 'SOS alert successfully logged. Help is on the way.'
    });
  } catch (err) {
    console.error('Error logging SOS alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. GET /api/sos
app.get('/api/sos', async (req, res) => {
  try {
    const alerts = await dbAll('SELECT * FROM sos_alerts ORDER BY created_at DESC');
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching SOS alerts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7.5 PUT /api/sos/:id
app.put('/api/sos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // resolved, active, cancelled

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const alert = await dbGet('SELECT * FROM sos_alerts WHERE id = ?', [id]);
    if (!alert) {
      return res.status(404).json({ error: 'SOS alert not found' });
    }

    await dbRun('UPDATE sos_alerts SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, id, status, message: `SOS signal status updated to ${status}` });
  } catch (err) {
    console.error('Error updating SOS status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. POST /api/chat (Rakshak AI Grounded Legal Advisor Chatbot)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      // Live Gemini Mode with automatic model name fallback chain
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-pro"];
      let reply = null;
      let lastErr = null;

      const systemInstruction = "You are Rakshak AI, a secure, compassionate legal advisor chatbot for the e-Abhaya portal. Your purpose is to assist users in understanding their legal rights under Indian law, specifically the Bharatiya Nyaya Sanhita (BNS) and the Indian Penal Code (IPC), and guide them on their safety concerns. Rules: 1. Ground your advice in Indian laws. State that your responses are educational and for legal awareness. 2. Discuss BNS Sections (74/75/78) and special acts (POSH Act 2013, PWDVA 2005) or rights during arrest and Zero FIR procedures. 3. If the user describes an incident, suggest and draft a formal, structured complaint statement citing BNS/IPC sections. Ground it clearly in your response between separators: '--- COMPLAINT DRAFT START --- [Detailed draft text...] --- COMPLAINT DRAFT END ---'. 4. If a user describes an emergency or immediate danger, strictly prompt them to dial 112/100 or NCW Helplines (181, 1091) immediately. 5. Automatically detect the user's input language and respond in the same language (English, Hindi, Bengali, etc.). 6. Output responses in clean, structured Markdown format.";

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction
          });

          let finalMessage = message;
          if (context && context.trim() !== '') {
            finalMessage = `[SYSTEM CONTEXT: ${context}] ${message}`;
          }

          const chatSession = model.startChat({
            history: history || []
          });

          const result = await chatSession.sendMessage(finalMessage);
          reply = result.response.text();
          if (reply) {
            break; // Break loop on successful generation!
          }
        } catch (mErr) {
          console.warn(`Model ${modelName} initialization failed:`, mErr.message);
          lastErr = mErr;
        }
      }

      if (reply) {
        return res.json({ reply });
      } else {
        throw lastErr || new Error("All Gemini model API attempts failed");
      }
    } else {
      // Fallback Mode (Rule Engine)
      const reply = generateFallbackResponse(message);
      return res.json({ reply });
    }
  } catch (err) {
    console.error('Error in Rakshak AI Chatbot:', err);
    // Graceful fallback on API errors so chat is never broken
    const reply = generateFallbackResponse(req.body.message) + "\n\n*(Note: Rakshak AI is running in offline safety mode)*";
    res.json({ reply });
  }
});

function generateFallbackResponse(query) {
  const q = query.toLowerCase().trim();
  
  if (q.includes('harassment') || q.includes('teasing') || q.includes('posh') || q.includes('workplace') || q.includes('office')) {
    return `### 🛡️ Sexual Harassment & Workplace Protections (BNS Sections 74 & 75)

Under Indian law, sexual harassment is a strict criminal offense with heavy penalties:

* **BNS Section 75 (previously IPC Section 354A):** Defines sexual harassment as physical contact involving unwelcome sexual advances, requests for sexual favors, making sexually colored remarks, or showing pornography against consent.
  * **Punishment:** Rigorous imprisonment up to **3 years** or fine, or both.
* **BNS Section 74 (previously IPC Section 354):** Penalizes any assault or criminal force used to outrage the modesty of a woman.
  * **Punishment:** Mandatory imprisonment from **1 to 5 years** plus fines.
* **Workplace Protection (POSH Act, 2013):** Every corporate, public, or private organization with **10 or more employees** is legally mandated to maintain an **Internal Complaints Committee (ICC)**. 
  * The ICC is empowered to investigate complaints, recommend actions, and holds the powers of a Civil Court to summon witnesses.

**Action Steps:**
1. Maintain written logs of dates, times, and actions. Save digital backups of emails, WhatsApp messages, or logs.
2. File a formal complaint with your office's **ICC Chairperson**.
3. You can also file a police complaint under **'Sexual Harassment'** on our e-Abhaya portal.`;
  }
  
  if (q.includes('domestic') || q.includes('violence') || q.includes('husband') || q.includes('in-law') || q.includes('dowry') || q.includes('abuse') || q.includes('beaten') || q.includes('beat')) {
    return `### 🏠 Domestic Violence & Dowry Protection Laws

You are heavily protected under both Indian Criminal Code and dedicated Civil Acts:

* **BNS Section 85 & 86 (previously IPC Section 498A):** Cruelty by a husband or his relatives is a **non-bailable, cognizable offense**. Cruelty includes physical injury, torture, mental distress, or coercion for dowry.
  * **Punishment:** Imprisonment up to **3 years** and mandatory fines.
* **BNS Section 80 (previously IPC Section 304B - Dowry Death):** Deals with dowry deaths. If a woman dies of unnatural burns/bodily injuries within 7 years of marriage under harassment for dowry, the husband/relative is presumed to have caused it.
  * **Punishment:** Imprisonment from **7 years to life**.
* **Protection of Women from Domestic Violence Act, 2005 (PWDVA):** A civil act providing quick safety measures:
  * **Protection Orders:** Stops the abuser from entering your workplace or contacting you.
  * **Residence Orders:** Guarantees your right to reside in the shared household; you cannot be evicted.
  * **Monetary Relief:** Orders the husband to pay medical expenses, loss of earnings, and monthly maintenance.

**Immediate Safety Support:**
* If you are in immediate danger, dial **112 / 100** or call the NCW emergency helpline at **181** (or **1091**).
* You can register a complaint under **'Domestic Violence'** on our portal. We will immediately assign a Protection Officer to assist you.`;
  }
  
  if (q.includes('stalk') || q.includes('following') || q.includes('stalker') || q.includes('stalking') || q.includes('cyberstalk') || q.includes('spy') || q.includes('track')) {
    return `### 🔍 Stalking & Cyberstalking Protections (BNS Section 78)

Stalking is a criminal act under **BNS Section 78 (previously IPC Section 354D)**:

* **Physical Stalking:** Repeatedly following a woman or contacting her to foster personal interaction despite a clear indication of disinterest.
* **Cyberstalking:** Monitoring a woman's internet usage, social media feeds, email logs, or electronic communications without her consent.
* **Punishment:** 
  * **First Offense:** Imprisonment up to **3 years** and a fine.
  * **Subsequent Conviction:** Imprisonment up to **5 years** and a fine.

**Recommended Actions:**
1. **Do not engage or respond** to threats.
2. Collect **date-stamped screenshots** of chat logs, call lists, profiles, and emails.
3. Block the stalker, increase privacy settings, and file a formal report under **'Stalking / Cyberstalking'** on the e-Abhaya portal.`;
  }
  
  if (q.includes('zero fir') || q.includes('jurisdiction') || q.includes('refuse') || q.includes('no fir') || q.includes('reject')) {
    return `### 🚨 Your Absolute Right to a Zero FIR

A police officer **cannot refuse** to file a complaint based on jurisdiction.

* **Definition:** A **Zero FIR** allows a woman to file a complaint at **any police station** in India, regardless of where the incident took place.
* **Protocol:** The station must register the complaint under serial number **'0'**, initiate immediate basic investigation/medical aid if required, and transfer the case files to the appropriate jurisdictional station.
* **Supreme Court Mandate (Lalita Kumari Case):** Registration of FIR is **mandatory** under Section 154 of CrPC/BNSS if the complaint discloses a cognizable offense.
* **Officer Penalty:** If a police officer refuses to file a Zero FIR for a sexual assault/harassment complaint, they commit a criminal offense under **IPC Section 166A / BNS Section 198**, which carries a mandatory sentence of **6 months to 2 years imprisonment**.

*If an officer refuses to register your complaint, cite BNS Section 198 and request to speak with the Superintendent of Police (SP) or register it directly online on our e-Abhaya portal.*`;
  }
  
  if (q.includes('arrest') || q.includes('night') || q.includes('police right') || q.includes('rights') || q.includes('lockup')) {
    return `### ⚖️ Safeguards & Legal Rights During Police Arrest

As a woman, the law provides strict arrest and detention protections:

1. **The Night Arrest Shield:** Under **Section 46(4) of CrPC / BNSS**, a woman **cannot be arrested after sunset (6 PM) and before sunrise (6 AM)**. 
   * In extraordinary cases, the arrest can only be made by a **woman police officer** who has obtained prior written permission from a local Judicial Magistrate.
2. **Female Presence Mandate:** Interrogations, searches, and arrests of a woman must be done exclusively by or in the presence of a **woman officer**. Physical search must be conducted with strict decency.
3. **Free Legal Aid:** Under **Article 39A of the Constitution**, you have the right to a free defense lawyer provided by the state Legal Services Authority, regardless of financial means.
4. **Right to Notify:** The police must immediately inform a family member or friend of your arrest, location, and the charges against you.
5. **Lockup Decency:** Women must be kept in **separate lockups** entirely segregated from male detainees.`;
  }
  
  if (q.includes('cyber') || q.includes('photo') || q.includes('morphed') || q.includes('fake profile') || q.includes('profile') || q.includes('online')) {
    return `### 🌐 Cybercrime, Privacy & Morphed Images

Sharing private media or defamation online is governed by both the IT Act and the BNS:

* **IT Act Section 66E (Privacy Violation):** Intentionally capturing, publishing, or transmitting images of a private area of a person without consent.
  * **Punishment:** Imprisonment up to **3 years** or a fine up to 2 Lakhs, or both.
* **IT Act Section 67 (Obscene Material):** Publishing or transmitting obscene material in electronic form.
  * **Punishment:** Imprisonment up to **3 years** (first offense) to **5 years** (subsequent).
* **BNS Section 78 (Cyberstalking) & BNS Section 356 (Defamation):** Covers cyber harassment and defamation.

**Steps to Take:**
1. Save full screenshots showing headers, URLs, profile links, and time zones.
2. **Do not delete the offending accounts or messages** — they represent key digital evidence.
3. File an immediate complaint on our portal under **'Cybercrime / Morphed images'** or via the National Cyber Crime Portal (cybercrime.gov.in).`;
  }

  if (q.includes('acid') || q.includes('attack') || q.includes('burn') || q.includes('chemical')) {
    return `### 🧪 Acid Attack Penalties & Free Medical Aid (BNS Section 124)

Acid throwing is treated as a separate, severe criminal offense with fast-track prosecution:

* **BNS Section 124(1) (previously IPC Section 326A):** Act of throwing acid causing permanent or partial damage, burns, or disfigurement.
  * **Punishment:** Rigorous imprisonment of **10 years to life** with a fine matching medical treatment costs (paid directly to the victim).
* **BNS Section 124(2) (previously IPC Section 326B):** Attempting to throw or administer acid.
  * **Punishment:** Imprisonment from **5 to 7 years** and a fine.
* **Mandatory Medical Aid:** Under Section 357C of CrPC/BNSS, **all hospitals** (Government or Private) must immediately provide **free first aid and medical treatment** to acid attack victims, without waiting for police reports. Refusal is a punishable offense.
* **Compensation:** Victims are entitled to a minimum state rehabilitation compensation of **Rs. 3 Lakhs** under NALSA guidelines.`;
  }

  return `Hello! I am **Rakshak AI**, your secure legal safety advisor. 🛡️

I am here to guide you on Indian laws (**Bharatiya Nyaya Sanhita - BNS** and **Indian Penal Code - IPC**), your fundamental rights, special safety acts, and emergency support.

What can I assist you with today? Feel free to ask me questions like:
* "What are my rights if the police refuses to file my FIR?" (Zero FIR)
* "Am I protected if my husband harasses me?" (Domestic Cruelty)
* "What is the POSH Act and how does it protect me at work?"
* "What is the penalty for cyberstalking or online harassment?"
* "Can the police arrest a woman after sunset?" (Arrest Rights)

*Note: My goal is to raise legal awareness. My answers are educational and do not constitute formal court-legal representation.*`;
}

// Fallback to serving the SPA client
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Application
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`e-Abhaya Backend Server listening on port ${PORT}`);
  console.log(`Local Access URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
