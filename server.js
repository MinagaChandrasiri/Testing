require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 7070;
const DATA_FILE = path.join(__dirname, 'data', 'students.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Default mock chess students data
const DEFAULT_CHESS_STUDENTS = [
  {
    id: "CHS1001",
    nameWithInitials: "K.M. Magnus Vance",
    fullName: "K.M. Magnus Vance",
    chessName: "Magnus Vance",
    parentName: "K.M. Sunil Vance",
    email: "magnus.vance@chessacademy.com",
    phone: "+94 77 123 4567",
    dob: "2008-04-15",
    age: 18,
    ageGroup: "Under 18 / අවු. 18න් පහළ",
    school: "Royal College",
    coachNotes: "Focus on endgame technique and deep tactical calculation under time pressure.",
    youthTeam: "Team A - Focus to Top 10 Places in Your Category",
    category: "Grandmaster Squad",
    fideRating: 2350,
    fideTitle: "FIDE Master (FM)",
    playingStyle: "Universal / Dynamic",
    fideId: "25019842",
    coach: "GM Alexander Volkov",
    gender: "Male",
    onlineHandle: "magnus_vance_99",
    notes: "Gold Medalist at National Youth Championship 2025. Favorite opening: Sicilian Defense.",
    createdAt: "2026-08-01T10:15:00.000Z"
  },
  {
    id: "CHS1002",
    nameWithInitials: "W.A. Sophia Chessov",
    fullName: "W.A. Sophia Chessov",
    chessName: "Sophia Chessov",
    parentName: "W.A. Anusha Chessov",
    email: "sophia.c@chessacademy.com",
    phone: "+94 71 987 6543",
    dob: "2010-11-20",
    age: 15,
    ageGroup: "Under 16 / අවු. 16න් පහළ",
    school: "Visakha Vidyalaya",
    coachNotes: "Needs guidance in sharp opening lines with Black pieces.",
    youthTeam: "Team A - Focus to Top 10 Places in Your Category",
    category: "Advanced Tactics",
    fideRating: 1920,
    fideTitle: "Candidate Master (CM)",
    playingStyle: "Aggressive / Tactical",
    fideId: "14109823",
    coach: "Coach Viktor Petrov",
    gender: "Female",
    onlineHandle: "sophia_knight_queen",
    notes: "Silver medalist at Western Province Open. Excellent puzzle solver.",
    createdAt: "2026-08-02T14:30:00.000Z"
  },
  {
    id: "CHS1003",
    nameWithInitials: "R.P. Pragyan Anand",
    fullName: "R.P. Pragyan Anand",
    chessName: "Pragyan Anand",
    parentName: "R.P. Raman Anand",
    email: "pragyan.a@chessacademy.com",
    phone: "+94 72 345 6789",
    dob: "2007-01-30",
    age: 19,
    ageGroup: "Open / Adult / විවෘත",
    school: "Ananda College",
    coachNotes: "Solid positional understanding, highly disciplined student.",
    youthTeam: "Team B - Focus to Top 25 Places in Your Category",
    category: "Grandmaster Squad",
    fideRating: 2480,
    fideTitle: "International Master (IM)",
    playingStyle: "Positional / Strategic",
    fideId: "35022119",
    coach: "GM Alexander Volkov",
    gender: "Male",
    onlineHandle: "pragyan_chess_pro",
    notes: "Achieved 2 GM Norms. World Youth U-16 Champion runner-up. Catalan Opening specialist.",
    createdAt: "2026-08-04T09:45:00.000Z"
  },
  {
    id: "CHS1004",
    nameWithInitials: "E.D. Elena Polgar",
    fullName: "E.D. Elena Polgar",
    chessName: "Elena Polgar",
    parentName: "E.D. Dhammika Polgar",
    email: "elena.p@chessacademy.com",
    phone: "+94 75 901 2345",
    dob: "2012-03-08",
    age: 14,
    ageGroup: "Under 14 / අවු. 14න් පහළ",
    school: "Museaus College",
    coachNotes: "Extremely dedicated, prefers evening training sessions.",
    youthTeam: "Team B - Focus to Top 25 Places in Your Category",
    category: "Intermediate Division",
    fideRating: 1450,
    fideTitle: "None",
    playingStyle: "Endgame Specialist",
    fideId: "",
    coach: "Coach Viktor Petrov",
    gender: "Female",
    onlineHandle: "elena_checkmate",
    notes: "Consistent solver of tactical puzzles. Rapidly improving endgame technique.",
    createdAt: "2026-08-05T11:20:00.000Z"
  },
  {
    id: "CHS1005",
    nameWithInitials: "D.K. David Kaspar",
    fullName: "D.K. David Kaspar",
    chessName: "David Kaspar",
    parentName: "D.K. Kasun Kaspar",
    email: "david.kaspar@chessacademy.com",
    phone: "+94 70 678 9012",
    dob: "2016-05-14",
    age: 10,
    ageGroup: "Under 10 / අවු. 10න් පහළ",
    school: "Nalanda College",
    coachNotes: "Young student, loves aggressive tactics and puzzle games.",
    youthTeam: "Team C - Focus to Top 50 Places in Your Category",
    category: "Beginner Knights",
    fideRating: 1080,
    fideTitle: "None",
    playingStyle: "Aggressive / Tactical",
    fideId: "",
    coach: "Coach Viktor Petrov",
    gender: "Male",
    onlineHandle: "little_knight_david",
    notes: "Won Academy Junior Cup U-10. Enjoys Italian Game and Ruy Lopez openings.",
    createdAt: "2026-08-06T19:35:43.816Z"
  }
];

// MongoDB Mongoose Schema & Model
const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameWithInitials: { type: String, required: true },
  fullName: { type: String },
  dob: { type: String, required: true },
  age: { type: Number },
  ageGroup: { type: String, required: true },
  school: { type: String, required: true },
  chessName: { type: String, default: '' },
  coachNotes: { type: String, default: '' },
  youthTeam: { type: String, default: 'Team A - Focus to Top 10 Places in Your Category' },
  parentName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  category: { type: String, default: 'Intermediate Division' },
  fideRating: { type: Number, default: 0 },
  fideTitle: { type: String, default: 'None' },
  playingStyle: { type: String, default: 'Universal / Dynamic' },
  fideId: { type: String, default: '' },
  coach: { type: String, default: 'Unassigned' },
  gender: { type: String, default: 'Open' },
  onlineHandle: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String }
});

const StudentModel = mongoose.model('Student', studentSchema);

let isMongoConnected = false;

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      isMongoConnected = true;
      console.log('🍃 Successfully connected to MongoDB Atlas!');
      
      // Auto-seed if collection is empty
      const count = await StudentModel.countDocuments();
      if (count === 0) {
        console.log('🌱 MongoDB collection empty. Seeding initial student records...');
        const jsonStudents = readStudentsFromFile();
        await StudentModel.insertMany(jsonStudents);
        console.log(`✅ Seeded ${jsonStudents.length} student records into MongoDB!`);
      }
    })
    .catch((err) => {
      console.error('⚠️ MongoDB Connection Error:', err.message);
      console.log('🔄 Operating with local JSON file storage fallback.');
    });
}

// File Storage Helpers (Fallback / Backup)
function readStudentsFromFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CHESS_STUDENTS, null, 2));
      return DEFAULT_CHESS_STUDENTS;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data || '[]');
    if (parsed.length === 0) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CHESS_STUDENTS, null, 2));
      return DEFAULT_CHESS_STUDENTS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading students file:', err);
    return DEFAULT_CHESS_STUDENTS;
  }
}

function writeStudentsToFile(students) {
  try {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
  } catch (err) {
    console.error('Error writing students file:', err);
  }
}

async function getStudentsList() {
  if (isMongoConnected) {
    try {
      const docs = await StudentModel.find({}).sort({ createdAt: -1 }).lean();
      return docs;
    } catch (err) {
      console.error('MongoDB query error, using file fallback:', err);
    }
  }
  return readStudentsFromFile();
}

function calculateAge(dobString) {
  if (!dobString) return 0;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

// API Routes

// GET /api/students/lookup - Private student lookup by ID or Email
app.get('/api/students/lookup', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Please provide a Student ID or Email.' });
  }

  const q = query.trim().toLowerCase();
  const students = await getStudentsList();

  const student = students.find(s => 
    s.id.toLowerCase() === q || (s.email && s.email.toLowerCase() === q)
  );

  if (!student) {
    return res.status(404).json({ success: false, message: 'No student record found matching that ID or Email.' });
  }

  res.json({ success: true, data: student });
});

// GET /api/students - List students (for Coach/Admin view)
app.get('/api/students', async (req, res) => {
  let students = await getStudentsList();
  const { search, category, fideTitle, ageGroup, youthTeam, sortBy } = req.query;

  if (search) {
    const q = search.toLowerCase().trim();
    students = students.filter(s =>
      (s.nameWithInitials && s.nameWithInitials.toLowerCase().includes(q)) ||
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.chessName && s.chessName.toLowerCase().includes(q)) ||
      (s.parentName && s.parentName.toLowerCase().includes(q)) ||
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.school && s.school.toLowerCase().includes(q)) ||
      (s.youthTeam && s.youthTeam.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.fideId && s.fideId.toLowerCase().includes(q)) ||
      (s.onlineHandle && s.onlineHandle.toLowerCase().includes(q)) ||
      (s.coach && s.coach.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'All') {
    students = students.filter(s => s.category === category);
  }

  if (youthTeam && youthTeam !== 'All') {
    students = students.filter(s => s.youthTeam && (s.youthTeam === youthTeam || s.youthTeam.startsWith(youthTeam)));
  }

  if (fideTitle && fideTitle !== 'All') {
    students = students.filter(s => s.fideTitle === fideTitle);
  }

  if (ageGroup && ageGroup !== 'All') {
    students = students.filter(s => s.ageGroup === ageGroup);
  }

  if (sortBy) {
    if (sortBy === 'rating_high') {
      students.sort((a, b) => (b.fideRating || 0) - (a.fideRating || 0));
    } else if (sortBy === 'rating_low') {
      students.sort((a, b) => (a.fideRating || 0) - (b.fideRating || 0));
    } else if (sortBy === 'name') {
      students.sort((a, b) => (a.nameWithInitials || a.fullName).localeCompare(b.nameWithInitials || b.fullName));
    } else if (sortBy === 'id') {
      students.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortBy === 'recent') {
      students.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  res.json({ success: true, count: students.length, data: students });
});

// GET /api/stats - Summary statistics
app.get('/api/stats', async (req, res) => {
  const students = await getStudentsList();
  const total = students.length;
  
  const avgRating = total > 0 
    ? Math.round(students.reduce((acc, s) => acc + (parseInt(s.fideRating) || 0), 0) / total)
    : 0;

  const categoryCounts = {};
  students.forEach(s => {
    const cat = s.category || 'Unassigned';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const titledPlayers = students.filter(s => s.fideTitle && s.fideTitle !== 'None').length;

  let topPlayer = { name: '-', rating: 0 };
  if (total > 0) {
    const sorted = [...students].sort((a, b) => (b.fideRating || 0) - (a.fideRating || 0));
    if (sorted[0]) {
      topPlayer = {
        name: sorted[0].nameWithInitials || sorted[0].fullName,
        rating: sorted[0].fideRating || 0,
        title: sorted[0].fideTitle || ''
      };
    }
  }

  res.json({
    success: true,
    totalStudents: total,
    averageRating: avgRating,
    titledCount: titledPlayers,
    byCategory: categoryCounts,
    topPlayer: topPlayer
  });
});

// POST /api/students - Add chess student
app.post('/api/students', async (req, res) => {
  const { 
    nameWithInitials, dob, age, ageGroup, school, chessName, coachNotes, youthTeam,
    parentName, phone, email, category, fideRating, fideTitle, 
    playingStyle, fideId, coach, gender, onlineHandle, notes, customId 
  } = req.body;

  if (!nameWithInitials || !dob || !ageGroup || !school || !parentName || !phone || !email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name with Initials, Birthday, Age Category, School, Parent Name, Phone, and Email are required.' 
    });
  }

  const students = await getStudentsList();
  
  const existingEmail = students.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ success: false, message: 'A chess student record with this email address already exists.' });
  }

  let studentId = customId ? customId.trim() : null;
  if (!studentId) {
    const nextNum = students.length > 0 
      ? Math.max(...students.map(s => parseInt(s.id.replace(/\D/g, '')) || 1000)) + 1 
      : 1001;
    studentId = `CHS${nextNum}`;
  } else {
    if (students.some(s => s.id.toLowerCase() === studentId.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Chess Student ID already exists. Please use a unique ID.' });
    }
  }

  const calculatedAge = dob ? calculateAge(dob) : (parseInt(age) || 0);

  const newStudent = {
    id: studentId,
    nameWithInitials: nameWithInitials.trim(),
    fullName: nameWithInitials.trim(),
    dob: dob || '',
    age: calculatedAge,
    ageGroup: ageGroup,
    school: school ? school.trim() : '',
    chessName: chessName ? chessName.trim() : '',
    coachNotes: coachNotes ? coachNotes.trim() : '',
    youthTeam: youthTeam ? youthTeam.trim() : 'Team A - Focus to Top 10 Places in Your Category',
    parentName: parentName ? parentName.trim() : '',
    phone: phone ? phone.trim() : '',
    email: email.trim().toLowerCase(),
    category: category || 'Intermediate Division',
    fideRating: parseInt(fideRating) || 0,
    fideTitle: fideTitle || 'None',
    playingStyle: playingStyle || 'Universal / Dynamic',
    fideId: fideId ? fideId.trim() : '',
    coach: coach || 'Unassigned',
    gender: gender || 'Open',
    onlineHandle: onlineHandle ? onlineHandle.trim() : '',
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString()
  };

  // Save to MongoDB if connected
  if (isMongoConnected) {
    try {
      await StudentModel.create(newStudent);
    } catch (err) {
      console.error('Failed to create in MongoDB:', err);
    }
  }

  // Backup to JSON file
  const fileStudents = readStudentsFromFile();
  fileStudents.unshift(newStudent);
  writeStudentsToFile(fileStudents);

  res.status(201).json({ success: true, message: 'Chess student details saved successfully!', data: newStudent });
});

// PUT /api/students/:id - Update chess student
app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const students = await getStudentsList();
  const index = students.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Chess student record not found.' });
  }

  const { 
    nameWithInitials, dob, age, ageGroup, school, chessName, coachNotes, youthTeam,
    parentName, phone, email, category, fideRating, fideTitle, 
    playingStyle, fideId, coach, gender, onlineHandle, notes 
  } = req.body;

  if (email && email.toLowerCase() !== students[index].email.toLowerCase()) {
    const duplicate = students.find(s => s.email && s.email.toLowerCase() === email.toLowerCase() && s.id !== id);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Another student already has this email address.' });
    }
  }

  const calculatedAge = dob ? calculateAge(dob) : (age !== undefined ? parseInt(age) : students[index].age);

  const updatedStudent = {
    ...students[index],
    nameWithInitials: nameWithInitials ? nameWithInitials.trim() : students[index].nameWithInitials,
    fullName: nameWithInitials ? nameWithInitials.trim() : students[index].fullName,
    dob: dob !== undefined ? dob : students[index].dob,
    age: calculatedAge,
    ageGroup: ageGroup || students[index].ageGroup,
    school: school !== undefined ? school.trim() : students[index].school,
    chessName: chessName !== undefined ? chessName.trim() : students[index].chessName,
    coachNotes: coachNotes !== undefined ? coachNotes.trim() : students[index].coachNotes,
    youthTeam: youthTeam !== undefined ? youthTeam.trim() : students[index].youthTeam,
    parentName: parentName !== undefined ? parentName.trim() : students[index].parentName,
    email: email ? email.trim().toLowerCase() : students[index].email,
    phone: phone !== undefined ? phone.trim() : students[index].phone,
    category: category || students[index].category,
    fideRating: fideRating !== undefined ? (parseInt(fideRating) || 0) : students[index].fideRating,
    fideTitle: fideTitle || students[index].fideTitle,
    playingStyle: playingStyle || students[index].playingStyle,
    fideId: fideId !== undefined ? fideId.trim() : students[index].fideId,
    coach: coach || students[index].coach,
    gender: gender || students[index].gender,
    onlineHandle: onlineHandle !== undefined ? onlineHandle.trim() : students[index].onlineHandle,
    notes: notes !== undefined ? notes.trim() : students[index].notes,
    updatedAt: new Date().toISOString()
  };

  // Update in MongoDB if connected
  if (isMongoConnected) {
    try {
      await StudentModel.findOneAndUpdate({ id }, updatedStudent, { new: true });
    } catch (err) {
      console.error('Failed to update in MongoDB:', err);
    }
  }

  // Backup update in JSON file
  const fileStudents = readStudentsFromFile();
  const fileIdx = fileStudents.findIndex(s => s.id === id);
  if (fileIdx !== -1) {
    fileStudents[fileIdx] = updatedStudent;
    writeStudentsToFile(fileStudents);
  }

  res.json({ success: true, message: 'Chess student record updated successfully.', data: updatedStudent });
});

// DELETE /api/students/:id - Delete student
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  
  if (isMongoConnected) {
    try {
      await StudentModel.deleteOne({ id });
    } catch (err) {
      console.error('Failed to delete from MongoDB:', err);
    }
  }

  let fileStudents = readStudentsFromFile();
  const initialLen = fileStudents.length;
  fileStudents = fileStudents.filter(s => s.id !== id);

  if (fileStudents.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Chess student record not found.' });
  }

  writeStudentsToFile(fileStudents);
  res.json({ success: true, message: 'Chess student record deleted successfully.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`♟️ Caissa Chess Academy Student Portal on port ${PORT}`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
