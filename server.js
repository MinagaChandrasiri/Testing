require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 7070;

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

// Connect to MongoDB (REQUIRED — no fallback)
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env — the server cannot start without a database.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('🍃 Successfully connected to MongoDB Atlas!');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

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

  try {
    const student = await StudentModel.findOne({
      $or: [
        { id: { $regex: new RegExp(`^${q}$`, 'i') } },
        { email: { $regex: new RegExp(`^${q}$`, 'i') } }
      ]
    }).lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'No student record found matching that ID or Email.' });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error('Lookup error:', err);
    res.status(500).json({ success: false, message: 'Database error during lookup.' });
  }
});

// GET /api/students - List students (for Coach/Admin view)
app.get('/api/students', async (req, res) => {
  try {
    const { search, category, fideTitle, ageGroup, youthTeam, sortBy } = req.query;

    let filter = {};

    if (search) {
      const q = search.trim();
      filter.$or = [
        { nameWithInitials: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
        { chessName: { $regex: q, $options: 'i' } },
        { parentName: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { school: { $regex: q, $options: 'i' } },
        { youthTeam: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { fideId: { $regex: q, $options: 'i' } },
        { onlineHandle: { $regex: q, $options: 'i' } },
        { coach: { $regex: q, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (youthTeam && youthTeam !== 'All') {
      filter.youthTeam = { $regex: new RegExp(`^${youthTeam}`) };
    }

    if (fideTitle && fideTitle !== 'All') {
      filter.fideTitle = fideTitle;
    }

    if (ageGroup && ageGroup !== 'All') {
      filter.ageGroup = ageGroup;
    }

    // Build sort
    let sortOption = { createdAt: -1 }; // default: most recent
    if (sortBy === 'age_young') sortOption = { age: 1 };
    else if (sortBy === 'age_old') sortOption = { age: -1 };
    else if (sortBy === 'rating_high') sortOption = { fideRating: -1 };
    else if (sortBy === 'rating_low') sortOption = { fideRating: 1 };
    else if (sortBy === 'name') sortOption = { nameWithInitials: 1 };
    else if (sortBy === 'id') sortOption = { id: 1 };
    else if (sortBy === 'recent') sortOption = { createdAt: -1 };

    const students = await StudentModel.find(filter).sort(sortOption).lean();
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ success: false, message: 'Database error fetching students.' });
  }
});

// GET /api/stats - Summary statistics
app.get('/api/stats', async (req, res) => {
  try {
    const students = await StudentModel.find({}).lean();
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
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Database error fetching stats.' });
  }
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

  try {
    let studentId = customId ? customId.trim() : null;
    if (!studentId) {
      // Auto-generate next ID from MongoDB
      const lastStudent = await StudentModel.findOne({}).sort({ id: -1 }).lean();
      const nextNum = lastStudent
        ? Math.max(parseInt(lastStudent.id.replace(/\D/g, '')) || 1000, 1000) + 1
        : 1001;
      studentId = `CHS${nextNum}`;
    } else {
      const existing = await StudentModel.findOne({ id: { $regex: new RegExp(`^${studentId}$`, 'i') } });
      if (existing) {
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

    await StudentModel.create(newStudent);
    res.status(201).json({ success: true, message: 'Chess student details saved successfully!', data: newStudent });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ success: false, message: 'Database error saving student.' });
  }
});

// PUT /api/students/:id - Update chess student
app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const student = await StudentModel.findOne({ id }).lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Chess student record not found.' });
    }

    const {
      nameWithInitials, dob, age, ageGroup, school, chessName, coachNotes, youthTeam,
      parentName, phone, email, category, fideRating, fideTitle,
      playingStyle, fideId, coach, gender, onlineHandle, notes
    } = req.body;

    const calculatedAge = dob ? calculateAge(dob) : (age !== undefined ? parseInt(age) : student.age);

    const updateData = {
      nameWithInitials: nameWithInitials ? nameWithInitials.trim() : student.nameWithInitials,
      fullName: nameWithInitials ? nameWithInitials.trim() : student.fullName,
      dob: dob !== undefined ? dob : student.dob,
      age: calculatedAge,
      ageGroup: ageGroup || student.ageGroup,
      school: school !== undefined ? school.trim() : student.school,
      chessName: chessName !== undefined ? chessName.trim() : student.chessName,
      coachNotes: coachNotes !== undefined ? coachNotes.trim() : student.coachNotes,
      youthTeam: youthTeam !== undefined ? youthTeam.trim() : student.youthTeam,
      parentName: parentName !== undefined ? parentName.trim() : student.parentName,
      email: email ? email.trim().toLowerCase() : student.email,
      phone: phone !== undefined ? phone.trim() : student.phone,
      category: category || student.category,
      fideRating: fideRating !== undefined ? (parseInt(fideRating) || 0) : student.fideRating,
      fideTitle: fideTitle || student.fideTitle,
      playingStyle: playingStyle || student.playingStyle,
      fideId: fideId !== undefined ? fideId.trim() : student.fideId,
      coach: coach || student.coach,
      gender: gender || student.gender,
      onlineHandle: onlineHandle !== undefined ? onlineHandle.trim() : student.onlineHandle,
      notes: notes !== undefined ? notes.trim() : student.notes,
      updatedAt: new Date().toISOString()
    };

    const updated = await StudentModel.findOneAndUpdate({ id }, updateData, { new: true }).lean();
    res.json({ success: true, message: 'Chess student record updated successfully.', data: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: 'Database error updating student.' });
  }
});

// DELETE /api/students/:id - Delete student
app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await StudentModel.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Chess student record not found.' });
    }

    res.json({ success: true, message: 'Chess student record deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Database error deleting student.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`♟️ Caissa Chess Academy Student Portal on port ${PORT}`);
  console.log(`👉 Access URL: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
