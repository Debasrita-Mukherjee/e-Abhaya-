const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'e-abhaya.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions to use async/await with sqlite3 callbacks
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Database Initialization
async function initDatabase() {
  try {
    // 1. Create complaints table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT,
        aadhaar TEXT,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        accused TEXT,
        district TEXT NOT NULL,
        police_station TEXT NOT NULL,
        status TEXT DEFAULT 'submitted',
        priority TEXT DEFAULT 'medium',
        assigned_officer TEXT DEFAULT 'Insp. A. Kumar',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create timeline table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        remarks TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints (id) ON DELETE CASCADE
      )
    `);

    // 3. Create sos_alerts table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id TEXT PRIMARY KEY,
        complainant_name TEXT NOT NULL,
        location TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables verified/created successfully.');

    // Seed data if database is empty
    const complaintCount = await dbGet('SELECT COUNT(*) AS count FROM complaints');
    if (complaintCount.count === 0) {
      console.log('Seeding initial database records...');
      await seedInitialData();
    }
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
}

async function seedInitialData() {
  const initialComplaints = [
    {
      id: 'FIR2026-001245',
      name: 'Priya Sharma',
      mobile: '+91 98765 43210',
      email: 'priya.sharma@example.com',
      aadhaar: '1234 5678 9012',
      type: 'Theft',
      date: '2026-05-22',
      location: 'City Center Mall, Bidhannagar',
      description: 'Handbag containing cash, phone, and cards was stolen from a seating area.',
      accused: 'Unknown person wearing a black jacket',
      district: 'North 24 Parganas',
      police_station: 'Bidhannagar',
      status: 'investigating',
      priority: 'Medium',
      assigned_officer: 'Insp. A. Kumar',
      created_at: '2026-05-22 09:14:00',
      updated_at: '2026-05-29 10:30:00'
    },
    {
      id: 'FIR2026-001302',
      name: 'Sunita Das',
      mobile: '+91 98111 22222',
      email: 'sunita.das@example.com',
      aadhaar: '9876 5432 1098',
      type: 'Sexual harassment',
      date: '2026-05-28',
      location: 'Sector V Bus Stand',
      description: 'Faced persistent verbal harassment and stalking at the bus stop from two individuals.',
      accused: 'Two young males riding a blue scooter',
      district: 'North 24 Parganas',
      police_station: 'New Town',
      status: 'submitted',
      priority: 'High',
      assigned_officer: 'SI R. Sharma',
      created_at: '2026-05-28 08:00:00',
      updated_at: '2026-05-28 08:00:00'
    },
    {
      id: 'FIR2025-009912',
      name: 'Rina Mondal',
      mobile: '+91 98000 77777',
      email: 'rina.m@example.com',
      aadhaar: '5544 3322 1100',
      type: 'Cybercrime / Morphed images',
      date: '2025-11-18',
      location: 'Online / Social Media',
      description: 'Received threatening calls and discovered fake profiles sharing manipulated photographs.',
      accused: 'User account under handle @cyber_anon2025',
      district: 'Kolkata',
      police_station: 'Dum Dum',
      status: 'evidence',
      priority: 'High',
      assigned_officer: 'Insp. M. Das',
      created_at: '2025-11-18 10:00:00',
      updated_at: '2025-11-24 15:45:00'
    },
    {
      id: 'FIR2026-001310',
      name: 'Kamla Roy',
      mobile: '+91 98222 33333',
      email: 'kamla.roy@example.com',
      aadhaar: '6677 8899 0011',
      type: 'Domestic violence',
      date: '2026-05-29',
      location: 'Lake Town Apartments',
      description: 'Assault and abuse by in-laws over ongoing domestic demands.',
      accused: 'Ramesh Roy and Lalita Roy',
      district: 'North 24 Parganas',
      police_station: 'Lake Town',
      status: 'submitted',
      priority: 'High',
      assigned_officer: 'SI R. Sharma',
      created_at: '2026-05-29 07:30:00',
      updated_at: '2026-05-29 07:30:00'
    },
    {
      id: 'FIR2026-000891',
      name: 'Ananya Sen',
      mobile: '+91 98333 44444',
      email: 'ananya.sen@example.com',
      aadhaar: '3322 4455 6677',
      type: 'Stalking / Cyberstalking',
      date: '2026-04-03',
      location: 'New Town Eco Park Road',
      description: 'Followed multiple times on daily evening walks, accompanied by persistent unwanted text messages.',
      accused: 'A colleague named Vikrant S.',
      district: 'North 24 Parganas',
      police_station: 'New Town',
      status: 'resolved',
      priority: 'Low',
      assigned_officer: 'SI R. Sharma',
      created_at: '2026-04-03 14:15:00',
      updated_at: '2026-04-10 18:00:00'
    }
  ];

  const initialTimelines = [
    // Priya Sharma
    { id: null, cid: 'FIR2026-001245', status: 'submitted', title: 'Complaint submitted', remarks: 'SMS confirmation sent. System registered.', time: '2026-05-22 09:14:00' },
    { id: null, cid: 'FIR2026-001245', status: 'reviewing', title: 'Under review', remarks: 'Inspector A. Kumar assigned. Intake file initiated.', time: '2026-05-23 11:00:00' },
    { id: null, cid: 'FIR2026-001245', status: 'fir', title: 'FIR registered', remarks: 'Officially lodged in police records.', time: '2026-05-25 15:45:00' },
    { id: null, cid: 'FIR2026-001245', status: 'investigating', title: 'Investigation started', remarks: 'Field investigation underway. Gathering witnesses.', time: '2026-05-29 10:30:00' },

    // Sunita Das
    { id: null, cid: 'FIR2026-001302', status: 'submitted', title: 'Complaint submitted', remarks: 'SMS confirmation sent. Waiting intake review.', time: '2026-05-28 08:00:00' },

    // Rina Mondal
    { id: null, cid: 'FIR2025-009912', status: 'submitted', title: 'Complaint submitted', remarks: 'Portal submission complete.', time: '2025-11-18 10:00:00' },
    { id: null, cid: 'FIR2025-009912', status: 'reviewing', title: 'Under review', remarks: 'Assigned to Cybercell Inspector M. Das.', time: '2025-11-19 11:20:00' },
    { id: null, cid: 'FIR2025-009912', status: 'fir', title: 'FIR registered', remarks: 'Lodge confirmation issued under Cyber Crime Act.', time: '2025-11-20 14:30:00' },
    { id: null, cid: 'FIR2025-009912', status: 'investigating', title: 'Investigation started', remarks: 'Digital foot-printing analysis started.', time: '2025-11-22 09:00:00' },
    { id: null, cid: 'FIR2025-009912', status: 'evidence', title: 'Evidence check', remarks: 'Cyber forensics analyzing IP logs and accounts.', time: '2025-11-24 15:45:00' },

    // Kamla Roy
    { id: null, cid: 'FIR2026-001310', status: 'submitted', title: 'Complaint submitted', remarks: 'SMS notification sent to emergency response unit.', time: '2026-05-29 07:30:00' },

    // Ananya Sen
    { id: null, cid: 'FIR2026-000891', status: 'submitted', title: 'Complaint submitted', remarks: 'Initial digital receipt generated.', time: '2026-04-03 14:15:00' },
    { id: null, cid: 'FIR2026-000891', status: 'reviewing', title: 'Under review', remarks: 'SI R. Sharma appointed.', time: '2026-04-04 09:30:00' },
    { id: null, cid: 'FIR2026-000891', status: 'fir', title: 'FIR registered', remarks: 'Case registered. Defendant issued interview summon.', time: '2026-04-05 13:00:00' },
    { id: null, cid: 'FIR2026-000891', status: 'investigating', title: 'Investigation started', remarks: 'Interrogations completed. Defendant warned with binding bail bond.', time: '2026-04-08 10:15:00' },
    { id: null, cid: 'FIR2026-000891', status: 'resolved', title: 'Action taken / Resolved', remarks: 'Mutual restraint declaration filed. Defendant strictly bound. Case settled successfully.', time: '2026-04-10 18:00:00' }
  ];

  // Insert complaints
  for (const c of initialComplaints) {
    await dbRun(`
      INSERT INTO complaints (id, name, mobile, email, aadhaar, type, date, location, description, accused, district, police_station, status, priority, assigned_officer, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [c.id, c.name, c.mobile, c.email, c.aadhaar, c.type, c.date, c.location, c.description, c.accused, c.district, c.police_station, c.status, c.priority, c.assigned_officer, c.created_at, c.updated_at]);
  }

  // Insert timelines
  for (const t of initialTimelines) {
    await dbRun(`
      INSERT INTO timeline (complaint_id, status, title, remarks, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [t.cid, t.status, t.title, t.remarks, t.time]);
  }

  console.log('Database records seeded successfully.');
}

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  initDatabase
};
