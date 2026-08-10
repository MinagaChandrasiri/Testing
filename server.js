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
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading students file:', err);
    return [];
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
