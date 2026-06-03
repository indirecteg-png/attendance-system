// Global Variables
let employees = [];
let attendanceRecords = [];
let users = [];
let currentUser = null;
let currentSection = 'attendance';

// Default Admin User
const DEFAULT_ADMIN = {
    id: 'admin001',
    username: 'admin',
    password: '123456',
    employeeName: 'مدير النظام',
    role: 'admin',
    isActive: true
};

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    
    const bgColor = type === 'success' ? 'bg-green-500' : 
                    type === 'error' ? 'bg-red-500' : 
                    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
    
    messageDiv.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 relative`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="absolute top-1 left-1 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    messageContainer.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Data Storage Functions (Local)
function loadDataFromStorage() {
    try {
        employees = JSON.parse(localStorage.getItem('employees')) || [];
        attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
        users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Create admin if no users exist
        if (users.length === 0) {
            users = [DEFAULT_ADMIN];
            saveDataToStorage();
        }
        
        console.log('Data loaded from localStorage');
    } catch (error) {
        console.error('Error loading data:', error);
        employees = [];
        attendanceRecords = [];
        users = [DEFAULT_ADMIN];
    }
}

function saveDataToStorage() {
    try {
        localStorage.setItem('employees', JSON.stringify(employees));
        localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving data:', error);
        showMessage('حدث خطأ في حفظ البيانات', 'error');
    }
}

// Authentication Functions
function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showMessage('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        return;
    }
    
    if (!user.isActive) {
        showMessage('الحساب معطل', 'error');
        return;
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showMainApp();
    showMessage('تم تسجيل الدخول بنجاح', 'success');
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginPage();
        showMessage('تم تسجيل الخروج', 'success');
    }
}

// UI Functions
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('currentUser').textContent = currentUser.employeeName;
    }
    
    showSection('attendance');
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const selectedSection = document.getElementById(sectionName + '-section');
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
    
    if (sectionName === 'attendance') {
        updateAttendanceTable();
        populateEmployeeSelects();
    } else if (sectionName === 'employees') {
        updateEmployeesTable();
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-gray-700');
    });
    
    const activeBtn = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-gray-700');
    }
}

function populateEmployeeSelects() {
    const select = document.getElementById('employeeSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- اختر موظف --</option>';
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} - ${employee.department}`;
        select.appendChild(option);
    });
}

// Attendance Functions
function checkIn() {
    const employeeId = document.getElementById('employeeSelect').value;
    
    if (!employeeId) {
        showMessage('يرجى اختيار الموظف', 'warning');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    const today = new Date().toISOString().split('T')[0];
    
    const existingRecord = attendanceRecords.find(record => 
        record.employeeId === employeeId && record.date === today
    );
    
    if (existingRecord && existingRecord.checkIn) {
        showMessage('الموظف مسجل حضوره بالفعل اليوم', 'warning');
        return;
    }
    
    const attendanceRecord = existingRecord || {
        id: generateId(),
        employeeId: employeeId,
        employeeName: employee.name,
        date: today,
        checkIn: null,
        checkOut: null,
        breakStart: null,
        breakEnd: null,
        totalHours: 0,
        overtimeHours: 0,
        status: 'present'
    };
    
    attendanceRecord.checkIn = new Date().toISOString();
    attendanceRecord.status = 'present';
    
    if (!existingRecord) {
        attendanceRecords.push(attendanceRecord);
    }
    
    saveDataToStorage();
    updateAttendanceTable();
    showMessage(`تم تسجيل حضور ${employee.name} بنجاح`, 'success');
}

function checkOut() {
    const employeeId = document.getElementById('employeeSelect').value;
    
    if (!employeeId) {
        showMessage('يرجى اختيار الموظف', 'warning');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    const today = new Date().toISOString().split('T')[0];
    
    const record = attendanceRecords.find(record => 
        record.employeeId === employeeId && record.date === today
    );
    
    if (!record || !record.checkIn) {
        showMessage('الموظف لم يسجل حضوره بعد', 'warning');
        return;
    }
    
    if (record.checkOut) {
        showMessage('الموظف سجل انصرافه بالفعل اليوم', 'warning');
        return;
    }
    
    const checkInTime = new Date(record.checkIn);
    const checkOutTime = new Date();
    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    record.checkOut = checkOutTime.toISOString();
    record.totalHours = totalHours;
    record.status = 'checked_out';
    
    saveDataToStorage();
    updateAttendanceTable();
    
    let message = `تم تسجيل انصراف ${employee.name} بنجاح`;
    if (totalHours > 8) {
        message += ` (أوفر تايم: ${(totalHours - 8).toFixed(2)} ساعة)`;
    }
    
    showMessage(message, 'success');
}

function takeBreak() {
    const employeeId = document.getElementById('employeeSelect').value;
    
    if (!employeeId) {
        showMessage('يرجى اختيار الموظف', 'warning');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    const today = new Date().toISOString().split('T')[0];
    
    const record = attendanceRecords.find(record => 
        record.employeeId === employeeId && record.date === today
    );
    
    if (!record || !record.checkIn) {
        showMessage('الموظف لم يسجل حضوره بعد', 'warning');
        return;
    }
    
    if (record.checkOut) {
        showMessage('الموظف سجل انصرافه بالفعل', 'warning');
        return;
    }
    
    if (!record.breakStart) {
        record.breakStart = new Date().toISOString();
        record.status = 'break';
        showMessage(`بدأت استراحة ${employee.name} - اضغط مرة أخرى لإنهاء الاستراحة`, 'success');
    } else if (!record.breakEnd) {
        record.breakEnd = new Date().toISOString();
        record.status = 'present';
        showMessage(`انتهت استراحة ${employee.name}`, 'success');
    } else {
        showMessage('الموظف أنهى استراحته بالفعل', 'warning');
        return;
    }
    
    saveDataToStorage();
    updateAttendanceTable();
}

function updateAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');
    const today = new Date().toISOString().split('T')[0];
    
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    
    if (todayRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">لا توجد سجلات حضور اليوم</td></tr>';
        return;
    }
    
    tbody.innerHTML = todayRecords.map(record => {
        const employee = employees.find(emp => emp.id === record.employeeId);
        const department = employee ? employee.department : '-';
        
        const checkInTime = record.checkIn ? formatTime(record.checkIn) : '-';
        const checkOutTime = record.checkOut ? formatTime(record.checkOut) : '-';
        const breakTime = record.breakStart && record.breakEnd ? 
            `${formatTime(record.breakStart)} - ${formatTime(record.breakEnd)}` : 
            (record.breakStart ? formatTime(record.breakStart) : '-');
        
        const totalHours = record.totalHours ? record.totalHours.toFixed(1) : '-';
        
        let statusBadge = '';
        switch (record.status) {
            case 'present':
                statusBadge = '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">حاضر</span>';
                break;
            case 'break':
                statusBadge = '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">استراحة</span>';
                break;
            case 'checked_out':
                statusBadge = '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">منصراف</span>';
                break;
            default:
                statusBadge = '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">غير معروف</span>';
        }
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2">${employee ? employee.name : 'غير معروف'}</td>
                <td class="px-4 py-2">${department}</td>
                <td class="px-4 py-2">${checkInTime}</td>
                <td class="px-4 py-2">${checkOutTime}</td>
                <td class="px-4 py-2">${breakTime}</td>
                <td class="px-4 py-2">${totalHours}</td>
                <td class="px-4 py-2">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// Employee Functions
function showEmployeeForm() {
    document.getElementById('employeeForm').classList.remove('hidden');
}

function hideEmployeeForm() {
    document.getElementById('employeeForm').classList.add('hidden');
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeDepartment').value = 'الإدارة';
    document.getElementById('employeeEmail').value = '';
}

function saveEmployee() {
    const name = document.getElementById('employeeName').value.trim();
    const id = document.getElementById('employeeId').value.trim();
    const department = document.getElementById('employeeDepartment').value;
    const email = document.getElementById('employeeEmail').value.trim();
    
    if (!name || !id) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
    }
    
    const employee = {
        id: id,
        name: name,
        department: department,
        email: email,
        createdAt: new Date().toISOString()
    };
    
    employees.push(employee);
    saveDataToStorage();
    updateEmployeesTable();
    populateEmployeeSelects();
    hideEmployeeForm();
    showMessage('تم إضافة الموظف بنجاح', 'success');
}

function deleteEmployee(id) {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        employees = employees.filter(emp => emp.id !== id);
        saveDataToStorage();
        updateEmployeesTable();
        populateEmployeeSelects();
        showMessage('تم حذف الموظف', 'success');
    }
}

function updateEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">لا يوجد موظفين</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(employee => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2">${employee.name}</td>
            <td class="px-4 py-2">${employee.id}</td>
            <td class="px-4 py-2">${employee.department}</td>
            <td class="px-4 py-2">${employee.email || '-'}</td>
            <td class="px-4 py-2">
                <button onclick="deleteEmployee('${employee.id}')" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Data Management Functions
function exportData() {
    const data = {
        employees: employees,
        attendanceRecords: attendanceRecords,
        users: users,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showMessage('تم تصدير البيانات بنجاح', 'success');
}

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('يرجى اختيار ملف', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.employees) employees = data.employees;
            if (data.attendanceRecords) attendanceRecords = data.attendanceRecords;
            if (data.users) users = data.users;
            
            saveDataToStorage();
            updateAttendanceTable();
            updateEmployeesTable();
            populateEmployeeSelects();
            
            showMessage('تم استيراد البيانات بنجاح', 'success');
        } catch (error) {
            console.error('Error importing data:', error);
            showMessage('حدث خطأ في استيراد البيانات', 'error');
        }
    };
    
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        employees = [];
        attendanceRecords = [];
        users = [DEFAULT_ADMIN];
        
        saveDataToStorage();
        updateAttendanceTable();
        updateEmployeesTable();
        populateEmployeeSelects();
        
        showMessage('تم مسح جميع البيانات', 'success');
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromStorage();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginPage();
    }
});
