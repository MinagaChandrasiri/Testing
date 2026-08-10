document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const studentForm = document.getElementById('student-form');
  const studentDbId = document.getElementById('student-db-id');
  const formTitle = document.getElementById('form-title');
  const formModeBadge = document.getElementById('form-mode-badge');
  const submitBtnText = document.getElementById('submit-btn-text');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  
  const dobInput = document.getElementById('dob');
  const ageInput = document.getElementById('age');
  const ageGroupSelect = document.getElementById('ageGroup');

  // Step Navigation Buttons
  const btnNextStep1 = document.getElementById('btn-next-step-1');
  const btnBackStep2 = document.getElementById('btn-back-step-2');
  const btnNextStep2 = document.getElementById('btn-next-step-2');
  const btnBackStep3 = document.getElementById('btn-back-step-3');

  const stepPane1 = document.getElementById('step-pane-1');
  const stepPane2 = document.getElementById('step-pane-2');
  const stepPane3 = document.getElementById('step-pane-3');

  const stepTab1 = document.getElementById('step-tab-1');
  const stepTab2 = document.getElementById('step-tab-2');
  const stepTab3 = document.getElementById('step-tab-3');
  const stepLine1 = document.getElementById('step-line-1');
  const stepLine2 = document.getElementById('step-line-2');

  let currentStep = 1;

  // Success Modal Elements
  const successModal = document.getElementById('success-modal');
  const successStudentId = document.getElementById('success-student-id');
  const successStudentName = document.getElementById('success-student-name');
  const successSchool = document.getElementById('success-school');
  const successYouthTeam = document.getElementById('success-youth-team');
  const downloadRulesPdfBtn = document.getElementById('download-rules-pdf-btn');
  const closeSuccessModalBtn = document.getElementById('close-success-modal-btn');

  let lastRegisteredStudentData = null;

  const studentPortalView = document.getElementById('student-portal-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');
  const adminToggleBtn = document.getElementById('admin-toggle-btn');
  const exitAdminBtn = document.getElementById('exit-admin-btn');
  const passcodeModal = document.getElementById('admin-passcode-modal');
  const closePasscodeModal = document.getElementById('close-passcode-modal');
  const passcodeForm = document.getElementById('passcode-form');
  const passcodeError = document.getElementById('passcode-error');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterCategory = document.getElementById('filter-category');
  const sortBySelect = document.getElementById('sort-by');
  const tableBody = document.getElementById('students-table-body');
  const noRecordsMsg = document.getElementById('no-records-msg');
  
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');

  // Stats elements
  const statTotal = document.getElementById('stat-total');
  const statAvgRating = document.getElementById('stat-avg-rating');
  const statTitledCount = document.getElementById('stat-titled-count');
  const statTopPlayer = document.getElementById('stat-top-player');

  let currentStudentsData = [];
  let isCoachUnlocked = sessionStorage.getItem('coachUnlocked') === 'true';

  // Step Wizard Navigation Logic
  btnNextStep1.addEventListener('click', () => {
    if (validateStep1()) {
      goToStep(2);
    }
  });

  btnBackStep2.addEventListener('click', () => {
    goToStep(1);
  });

  btnNextStep2.addEventListener('click', () => {
    if (validateStep2()) {
      goToStep(3);
    }
  });

  btnBackStep3.addEventListener('click', () => {
    goToStep(2);
  });

  function goToStep(stepNum) {
    currentStep = stepNum;
    
    stepPane1.classList.add('hidden');
    stepPane2.classList.add('hidden');
    stepPane3.classList.add('hidden');

    stepTab1.classList.remove('active', 'completed');
    stepTab2.classList.remove('active', 'completed');
    stepTab3.classList.remove('active', 'completed');
    stepLine1.classList.remove('completed');
    stepLine2.classList.remove('completed');

    if (stepNum === 1) {
      stepPane1.classList.remove('hidden');
      stepTab1.classList.add('active');
    } else if (stepNum === 2) {
      stepPane2.classList.remove('hidden');
      stepTab1.classList.add('completed');
      stepLine1.classList.add('completed');
      stepTab2.classList.add('active');
    } else if (stepNum === 3) {
      stepPane3.classList.remove('hidden');
      stepTab1.classList.add('completed');
      stepLine1.classList.add('completed');
      stepTab2.classList.add('completed');
      stepLine2.classList.add('completed');
      stepTab3.classList.add('active');
    }

    studentForm.scrollIntoView({ behavior: 'smooth' });
  }

  function validateStep1() {
    clearErrors();
    let isValid = true;

    const nameWithInitials = document.getElementById('nameWithInitials').value.trim();
    const dob = document.getElementById('dob').value;
    const ageGroup = document.getElementById('ageGroup').value;
    const school = document.getElementById('school').value.trim();

    if (!nameWithInitials) {
      showError('nameWithInitials', 'Student name with initials is required.');
      isValid = false;
    }

    if (!dob) {
      showError('dob', 'Birthday is required.');
      isValid = false;
    }

    if (!ageGroup) {
      showError('ageGroup', 'Please select related age category.');
      isValid = false;
    }

    if (!school) {
      showError('school', 'School name is required.');
      isValid = false;
    }

    return isValid;
  }

  function validateStep2() {
    clearErrors();
    let isValid = true;

    const parentName = document.getElementById('parentName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!parentName) {
      showError('parentName', 'Parent\'s name is required.');
      isValid = false;
    }

    if (!phone) {
      showError('phone', 'WhatsApp number is required.');
      isValid = false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showError('email', 'Please enter a valid email address.');
      isValid = false;
    }

    return isValid;
  }

  // Dynamic Age Calculation on DOB Change
  dobInput.addEventListener('change', () => {
    const dobValue = dobInput.value;
    if (dobValue) {
      const calculatedAge = calculateAgeFromDOB(dobValue);
      ageInput.value = calculatedAge;
      suggestAgeCategory(calculatedAge);
    } else {
      ageInput.value = '';
    }
  });

  function calculateAgeFromDOB(dobString) {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  }

  function suggestAgeCategory(age) {
    let cat = 'Open / Adult';
    if (age <= 6) cat = 'Under 7';
    else if (age <= 8) cat = 'Under 9';
    else if (age <= 10) cat = 'Under 11';
    else if (age <= 12) cat = 'Under 13';
    else if (age <= 14) cat = 'Under 15';
    else if (age <= 16) cat = 'Under 17';

    ageGroupSelect.value = cat;
  }

  // Theme Toggle (Default: Light Theme)
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-moon"></i>' 
      : '<i class="fa-solid fa-sun"></i>';
  }

  // Initial View State
  if (isCoachUnlocked) {
    showCoachDashboard();
  }

  adminToggleBtn.addEventListener('click', () => {
    if (isCoachUnlocked) {
      showCoachDashboard();
    } else {
      passcodeModal.showModal();
    }
  });

  closePasscodeModal.addEventListener('click', () => passcodeModal.close());

  passcodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('coach-passcode').value.trim();
    if (code === 'coach123' || code === 'admin123' || code === '1234') {
      isCoachUnlocked = true;
      sessionStorage.setItem('coachUnlocked', 'true');
      passcodeModal.close();
      passcodeForm.reset();
      passcodeError.style.display = 'none';
      showCoachDashboard();
      showToast('Coach Access Unlocked!');
    } else {
      passcodeError.style.display = 'block';
    }
  });

  exitAdminBtn.addEventListener('click', () => {
    isCoachUnlocked = false;
    sessionStorage.removeItem('coachUnlocked');
    adminDashboardView.classList.add('hidden');
    studentPortalView.classList.remove('hidden');
    showToast('Exited Coach Access Mode.');
  });

  function showCoachDashboard() {
    studentPortalView.classList.add('hidden');
    adminDashboardView.classList.remove('hidden');
    fetchStudents();
    fetchStats();
  }

  function populateFormForEdit(student) {
    studentDbId.value = student.id;
    document.getElementById('nameWithInitials').value = student.nameWithInitials || student.fullName || '';
    document.getElementById('dob').value = student.dob || '';
    document.getElementById('age').value = student.dob ? calculateAgeFromDOB(student.dob) : (student.age || '');
    document.getElementById('ageGroup').value = student.ageGroup || '';
    document.getElementById('school').value = student.school || '';
    document.getElementById('chessName').value = student.chessName || '';
    document.getElementById('coachNotes').value = student.coachNotes || '';
    document.getElementById('parentName').value = student.parentName || '';
    document.getElementById('phone').value = student.phone || '';
    document.getElementById('email').value = student.email || '';
    document.getElementById('youthTeam').value = student.youthTeam || 'Team A - Focus to Top 10 Places in Your Category';

    formTitle.textContent = 'Update Student Details';
    formModeBadge.textContent = 'Editing Mode';
    formModeBadge.classList.add('editing');
    submitBtnText.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');

    goToStep(1);
  }

  // Fetch Students for Admin view
  async function fetchStudents() {
    const search = searchInput.value.trim();
    const team = filterCategory.value;
    const sortBy = sortBySelect.value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (team && team !== 'All') params.append('youthTeam', team);
    if (sortBy) params.append('sortBy', sortBy);

    try {
      const res = await fetch(`/api/students?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        currentStudentsData = json.data;
        renderStudentsTable(currentStudentsData);
      }
    } catch (err) {
      showToast('Error fetching student roster.', 'error');
    }
  }

  // Fetch Stats for Admin view
  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        statTotal.textContent = json.totalStudents;
        statAvgRating.textContent = json.averageRating || '0';
        statTitledCount.textContent = json.titledCount || '0';
        
        if (json.topPlayer && json.topPlayer.name !== '-') {
          const ratingText = json.topPlayer.rating ? ` (${json.topPlayer.rating})` : '';
          statTopPlayer.textContent = `${json.topPlayer.name}${ratingText}`;
        } else {
          statTopPlayer.textContent = '-';
        }
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }

  // Render Admin Table Rows
  function renderStudentsTable(students) {
    tableBody.innerHTML = '';

    if (!students || students.length === 0) {
      noRecordsMsg.classList.remove('hidden');
      return;
    }

    noRecordsMsg.classList.add('hidden');

    students.forEach(student => {
      const tr = document.createElement('tr');
      
      const displayName = student.nameWithInitials || student.fullName;
      const calcAge = student.dob ? calculateAgeFromDOB(student.dob) : (student.age || 'N/A');
      const teamTag = student.youthTeam ? student.youthTeam.split(' - ')[0] : 'Team A';

      tr.innerHTML = `
        <td><span class="student-id-tag">${escapeHtml(student.id)}</span></td>
        <td>
          <div class="student-name-cell">
            <span class="student-name">${escapeHtml(displayName)}</span>
            <span class="student-subtext">${escapeHtml(student.email)}</span>
          </div>
        </td>
        <td><span class="badge" style="background: var(--primary-light); color: var(--primary-color);">${escapeHtml(teamTag)}</span></td>
        <td>${student.school ? escapeHtml(student.school) : '<span class="student-subtext">N/A</span>'}</td>
        <td>${student.parentName ? escapeHtml(student.parentName) : '<span class="student-subtext">N/A</span>'}</td>
        <td>
          <div class="dob-cell">
            <span>${student.dob ? escapeHtml(student.dob) : 'N/A'}</span>
            <span class="student-subtext">${calcAge} Yrs Old (${escapeHtml(student.ageGroup.split('/')[0])})</span>
          </div>
        </td>
        <td>
          <div class="contact-cell">
            <div>${escapeHtml(student.email)}</div>
            ${student.phone ? `<div class="student-subtext"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> ${escapeHtml(student.phone)}</div>` : ''}
          </div>
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="action-btn view" onclick="viewStudentDetails('${student.id}')" title="View Full Details">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="action-btn edit" onclick="editStudent('${student.id}')" title="Edit Student">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn delete" onclick="deleteStudent('${student.id}')" title="Delete Record">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Coach View Full Student Details Modal logic
  const coachViewModal = document.getElementById('coach-view-student-modal');
  const coachViewModalBody = document.getElementById('coach-view-modal-body');
  const closeCoachViewModal = document.getElementById('close-coach-view-modal');

  if (closeCoachViewModal) {
    closeCoachViewModal.addEventListener('click', () => coachViewModal.close());
  }

  window.viewStudentDetails = function(id) {
    const student = currentStudentsData.find(s => s.id === id);
    if (!student) return;

    const displayName = student.nameWithInitials || student.fullName;
    const calcAge = student.dob ? calculateAgeFromDOB(student.dob) : (student.age || 'N/A');

    coachViewModalBody.innerHTML = `
      <div class="submitted-summary-card" style="margin-bottom: 1rem;">
        <div class="summary-row">
          <span class="sum-label">Student ID:</span>
          <span class="sum-val highlight">${escapeHtml(student.id)}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q1. Student Name with Initials:</span>
          <span class="sum-val">${escapeHtml(displayName)}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q2. BirthDay:</span>
          <span class="sum-val">${student.dob ? escapeHtml(student.dob) : 'N/A'}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q3. Calculated Age:</span>
          <span class="sum-val">${calcAge} Years Old</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q4. Related Age Category:</span>
          <span class="sum-val">${escapeHtml(student.ageGroup)}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q5. School:</span>
          <span class="sum-val">${student.school ? escapeHtml(student.school) : 'N/A'}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q6. Name Used in Chess:</span>
          <span class="sum-val">${student.chessName ? escapeHtml(student.chessName) : 'Same as above'}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q7. Special Notes for Coach:</span>
          <span class="sum-val" style="color: var(--primary-color); font-weight: 600;">${student.coachNotes ? escapeHtml(student.coachNotes) : 'None'}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q8. Parent's Name:</span>
          <span class="sum-val">${student.parentName ? escapeHtml(student.parentName) : 'N/A'}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q9. WhatsApp Number:</span>
          <span class="sum-val" style="color: #25d366;"><i class="fa-brands fa-whatsapp"></i> ${student.phone ? escapeHtml(student.phone) : 'N/A'}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q10. Email:</span>
          <span class="sum-val">${escapeHtml(student.email)}</span>
        </div>
        <div class="summary-row">
          <span class="sum-label">Q11. Selected Youth Team:</span>
          <span class="sum-val youth-team-val">${escapeHtml(student.youthTeam || 'Team A')}</span>
        </div>
      </div>
      <div class="flex-between gap-1" style="margin-top: 1.2rem;">
        <button class="btn btn-secondary full-width" onclick="document.getElementById('coach-view-student-modal').close()">
          <i class="fa-solid fa-xmark"></i> Close Details
        </button>
        <button class="btn btn-primary full-width" onclick="document.getElementById('coach-view-student-modal').close(); editStudent('${student.id}')">
          <i class="fa-solid fa-pen"></i> Edit Student
        </button>
      </div>
    `;

    coachViewModal.showModal();
  };

  window.editStudent = function(id) {
    const student = currentStudentsData.find(s => s.id === id);
    if (!student) return;

    studentPortalView.classList.remove('hidden');
    adminDashboardView.classList.add('hidden');

    populateFormForEdit(student);
  };

  window.deleteStudent = async function(id) {
    if (!confirm(`Are you sure you want to remove chess student ${id}?`)) return;

    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Chess student record deleted successfully!');
        if (studentDbId.value === id) resetForm();
        fetchStudents();
        fetchStats();
      } else {
        showToast(json.message || 'Failed to delete record.', 'error');
      }
    } catch (err) {
      showToast('Server error while deleting student.', 'error');
    }
  };

  // Form Submit
  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      goToStep(1);
      return;
    }

    if (!validateStep2()) {
      goToStep(2);
      return;
    }

    const isEdit = Boolean(studentDbId.value);
    const payload = {
      nameWithInitials: document.getElementById('nameWithInitials').value.trim(),
      dob: document.getElementById('dob').value,
      age: document.getElementById('age').value,
      ageGroup: document.getElementById('ageGroup').value,
      school: document.getElementById('school').value.trim(),
      chessName: document.getElementById('chessName').value.trim(),
      coachNotes: document.getElementById('coachNotes').value.trim(),
      parentName: document.getElementById('parentName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      youthTeam: document.getElementById('youthTeam').value
    };

    const url = isEdit ? `/api/students/${studentDbId.value}` : '/api/students';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        lastRegisteredStudentData = json.data;
        showToast(json.message);
        
        // Show Success Modal with PDF Download option
        showRegistrationSuccessModal(json.data);

        resetForm();
        if (isCoachUnlocked) {
          fetchStudents();
          fetchStats();
        }
      } else {
        showToast(json.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      showToast('Error saving student details.', 'error');
    }
  });

  // Registration Success Modal & Rules PDF Download
  function showRegistrationSuccessModal(studentData) {
    if (!studentData) return;
    successStudentId.textContent = studentData.id || 'CHS1001';
    successStudentName.textContent = studentData.nameWithInitials || studentData.fullName || '-';
    successSchool.textContent = studentData.school || '-';
    successYouthTeam.textContent = studentData.youthTeam || '-';

    successModal.showModal();
  }

  closeSuccessModalBtn.addEventListener('click', () => {
    successModal.close();
  });

  downloadRulesPdfBtn.addEventListener('click', () => {
    generateRulesAndRegulationsPDF(lastRegisteredStudentData);
  });

  // Generate Rules & Regulations PDF Sheet (Pure English)
  function generateRulesAndRegulationsPDF(student) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const studentName = student ? (student.nameWithInitials || student.fullName) : 'Student';
    const studentId = student ? student.id : 'CHS1001';
    const youthTeam = student ? student.youthTeam : 'Youth Team Training';
    const school = student ? student.school : 'N/A';
    const whatsapp = student ? student.phone : 'N/A';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Page styling & header (Red Background)
    doc.setFillColor(185, 28, 28); // Bold Red Header
    doc.rect(0, 0, 595.28, 85, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CAISSA CHESS ACADEMY', 40, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Youth Championship Training & Rules Sheet', 40, 62);
    doc.text(`Date: ${dateStr}`, 440, 62);

    // Registration Receipt Box (Soft Red Background & Red Title)
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(40, 105, 515, 95, 6, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28); // Red
    doc.text('STUDENT REGISTRATION CONFIRMATION', 55, 125);

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text('Student ID:', 55, 148);
    doc.text('Student Name:', 55, 168);
    doc.text('School Name:', 55, 188);

    doc.setFont('helvetica', 'normal');
    doc.text(studentId, 145, 148);
    doc.text(studentName, 145, 168);
    doc.text(school, 145, 188);

    doc.setFont('helvetica', 'bold');
    doc.text('Youth Team:', 310, 148);
    doc.text('WhatsApp:', 310, 168);

    doc.setFont('helvetica', 'normal');
    doc.text(youthTeam.split(' - ')[0], 390, 148);
    doc.text(whatsapp, 390, 168);

    // Rules Section Title (Pure English)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('ACADEMY RULES & REGULATIONS', 40, 230);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(40, 238, 555, 238);

    // Rules Content List (100% Pure English)
    const rules = [
      {
        num: '1.',
        title: 'Attendance & Punctuality',
        desc: 'Students must attend all scheduled Youth Championship preparation sessions on time. Late arrival without prior notice is strictly discouraged.'
      },
      {
        num: '2.',
        title: 'Youth Team Target Commitment',
        desc: `The student is enrolled in ${youthTeam}. Daily assignment of tactical puzzles and opening analysis must be completed within day.`
      },
      {
        num: '3.',
        title: 'Sportsmanship & Chess Etiquette',
        desc: 'Respect for opponents, tournament arbiters, and coaches is mandatory. High standards of sportsmanship are expected during all internal and external fixtures.'
      },
      {
        num: '4.',
        title: 'Official WhatsApp Communication',
        desc: `Official announcements, pairing charts, and schedule changes will be sent via WhatsApp to ${whatsapp}. Parents must check updates regularly.`
      },
      {
        num: '5.',
        title: 'Tournament Equipment & Clock',
        desc: 'Students must bring their standard tournament chess clock, notebook, and pen to all live academy training matches.'
      },
      {
        num: '6.',
        title: 'Parent & Guardian Code of Conduct',
        desc: 'Parents are requested to support their children positively. Coaching advice during ongoing tournament games is strictly prohibited.'
      }
    ];

    let currentY = 265;
    rules.forEach(rule => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(185, 28, 28); // Red Rule Header
      doc.text(`${rule.num} ${rule.title}`, 40, currentY);

      currentY += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      const splitDesc = doc.splitTextToSize(rule.desc, 515);
      doc.text(splitDesc, 55, currentY);

      currentY += (splitDesc.length * 13) + 12;
    });

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(40, 780, 555, 780);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Caissa Chess Academy • Official Student Registration Document', 40, 796);
    doc.text('Page 1 of 1', 510, 796);

    // Save PDF
    doc.save(`Caissa_Chess_Academy_Rules_${studentId}_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    showToast('Rules & Regulations PDF Downloaded!');
  }

  cancelEditBtn.addEventListener('click', resetForm);

  function resetForm() {
    studentForm.reset();
    studentDbId.value = '';
    formTitle.textContent = 'Student Registration Form';
    formModeBadge.textContent = 'Step-by-Step Form';
    formModeBadge.classList.remove('editing');
    submitBtnText.textContent = 'Submit Details';
    cancelEditBtn.classList.add('hidden');
    clearErrors();
    goToStep(1);
  }

  function showError(fieldId, message) {
    const errSpan = document.getElementById(`${fieldId}-error`);
    if (errSpan) {
      errSpan.textContent = message;
      errSpan.style.display = 'block';
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
      el.style.display = 'none';
    });
  }

  // Admin Search & Filters
  let searchDebounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearSearchBtn.classList.toggle('hidden', searchInput.value.trim() === '');
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(fetchStudents, 250);
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      fetchStudents();
    });

    filterCategory.addEventListener('change', fetchStudents);
    sortBySelect.addEventListener('change', fetchStudents);
  }

  // Admin Exports
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!currentStudentsData || currentStudentsData.length === 0) {
        showToast('No records available to export.', 'error');
        return;
      }

      const headers = ['Chess ID', 'Name With Initials', 'DOB', 'Age', 'Age Category', 'School', 'Chess Name', 'Coach Notes', 'Parent Name', 'WhatsApp Number', 'Email', 'Youth Team'];
      const csvRows = [headers.join(',')];

      currentStudentsData.forEach(s => {
        const row = [
          escapeCsv(s.id),
          escapeCsv(s.nameWithInitials || s.fullName),
          escapeCsv(s.dob || ''),
          s.age || 0,
          escapeCsv(s.ageGroup),
          escapeCsv(s.school || ''),
          escapeCsv(s.chessName || ''),
          escapeCsv(s.coachNotes || ''),
          escapeCsv(s.parentName || ''),
          escapeCsv(s.phone || ''),
          escapeCsv(s.email),
          escapeCsv(s.youthTeam || '')
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `chess_students_export_${new Date().toISOString().slice(0,10)}.csv`);
      a.click();
      showToast('CSV export downloaded!');
    });

    exportJsonBtn.addEventListener('click', () => {
      if (!currentStudentsData || currentStudentsData.length === 0) {
        showToast('No records available to export.', 'error');
        return;
      }

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentStudentsData, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `chess_students_export_${new Date().toISOString().slice(0,10)}.json`);
      a.click();
      showToast('JSON export downloaded!');
    });
  }

  function escapeCsv(val) {
    if (!val) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  function showToast(msg, type = 'success') {
    toastMessage.textContent = msg;
    if (type === 'error') {
      toastIcon.className = 'fa-solid fa-circle-exclamation';
      toast.style.borderColor = 'var(--accent-rose)';
    } else {
      toastIcon.className = 'fa-solid fa-circle-check';
      toast.style.borderColor = 'var(--accent-emerald)';
    }
    toast.classList.remove('hidden');
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
