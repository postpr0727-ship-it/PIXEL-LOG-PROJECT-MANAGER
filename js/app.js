// Init Icons
lucide.createIcons();

// Constants & State
const STORAGE_KEY = 'pixel-log-projects-v1';
let projects = [];

// DOM Elements
const gridActive = document.getElementById('grid-active');
const gridCompleted = document.getElementById('grid-completed');
const sectionActive = document.getElementById('section-active');
const sectionCompleted = document.getElementById('section-completed');
const emptyState = document.getElementById('empty-state');
const modal = document.getElementById('project-modal');
const form = document.getElementById('project-form');
const checklistContainer = document.getElementById('checklist-container');

// Filter state
let currentFilter = 'all';
let currentState = {
    search: '',
    sort: 'recent' // recent, deadline, progress
};
let isMuted = false;

// Sound System (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const SoundManager = {
    playTone: (freq, type, duration) => {
        if (isMuted) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },

    playSuccess: () => {
        // Happy Major Chord
        setTimeout(() => SoundManager.playTone(523.25, 'sine', 0.3), 0);   // C5
        setTimeout(() => SoundManager.playTone(659.25, 'sine', 0.3), 100); // E5
        setTimeout(() => SoundManager.playTone(783.99, 'sine', 0.6), 200); // G5
    },

    playClick: () => {
        // Short tick
        SoundManager.playTone(800, 'triangle', 0.05);
    },

    playComplete: () => {
        // Fanfare
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => SoundManager.playTone(freq, 'square', 0.4), i * 100);
        });
        setTimeout(() => SoundManager.playTone(1046.50, 'square', 0.8), 400);
    },

    playDelete: () => {
        // Low descending
        SoundManager.playTone(200, 'sawtooth', 0.2);
        setTimeout(() => SoundManager.playTone(100, 'sawtooth', 0.3), 100);
    }
};

function toggleSound() {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    btn.innerHTML = isMuted
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-gray-500"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
}

// Styles Map
const CATEGORY_COLORS = {
    fitness: 'bg-category-fitness',
    growth: 'bg-category-growth',
    work: 'bg-category-work',
    hobby: 'bg-category-hobby',
    study: 'bg-category-study',
    custom: 'bg-gray-500'
};

const CATEGORY_LABELS = {
    fitness: '운동 💪',
    growth: '자기계발 📚',
    work: '업무 💼',
    hobby: '취미 🎨',
    study: '학습 🎓',
    custom: '직접지정 ⭐'
};

// --- Init ---
function init() {
    // Load from local storage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        projects = JSON.parse(stored);
    } else {
        // Dummy Data - Only if empty
        // Clean start or keep dummy logic? Let's keep dummy logic for new users
        projects = [{
            id: 'demo-1',
            title: '매일 아침 조깅하기',
            category: 'fitness',
            description: '건강한 하루을 위한 아침 30분 투자',
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            progress: 50,
            checklist: [
                { text: '1주차 완료', checked: true },
                { text: '2주차 완료', checked: true },
                { text: '3주차 완료', checked: false },
                { text: '4주차 완료', checked: false },
            ]
        }];
        saveToStorage();
    }

    renderProjects();
    createParticles();

    // Set default dates in form
    const today = new Date().toISOString().split('T')[0];
    const sd = document.getElementById('startDate');
    if (sd) sd.value = today;

    // Load Theme
    initTheme();
}

// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    applyThemeClasses(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    applyThemeClasses(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-btn');
    if (theme === 'dark') {
        btn.innerHTML = '<i data-lucide="sun" class="w-6 h-6"></i>';
    } else {
        btn.innerHTML = '<i data-lucide="moon" class="w-6 h-6"></i>';
    }
    lucide.createIcons();
}

function applyThemeClasses(theme) {
    // Handled via CSS overrides in style.css
}

// --- Toast Logic ---
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    let bgClass = 'bg-navy-light border-primary-gold';
    let icon = 'info';

    if (type === 'success') {
        bgClass = 'bg-green-600 border-green-400 text-white';
        icon = 'check-circle';
    } else if (type === 'error') {
        bgClass = 'bg-red-600 border-red-400 text-white';
        icon = 'alert-triangle';
    } else {
        bgClass = 'bg-navy-muted border-gray-500 text-white';
    }

    toast.className = `flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border ${bgClass} toast-enter text-sm font-bold min-w-[300px]`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span>${msg}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Animate In
    requestAnimationFrame(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-enter-active');
    });

    // Remove
    setTimeout(() => {
        toast.classList.remove('toast-enter-active');
        toast.classList.add('toast-exit-active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Filtering & Sorting ---
function setFilter(filter) {
    currentFilter = filter;
    updateFilterUI();
    renderProjects();
}

function handleSearch() {
    currentState.search = document.getElementById('search-input').value.toLowerCase();
    renderProjects();
}

function handleSort() {
    currentState.sort = document.getElementById('sort-select').value;
    renderProjects();
}

function updateFilterUI() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = 'filter-btn px-4 py-2 rounded-md text-gray-400 hover:text-white hover:bg-navy-muted text-sm transition-colors';
    });
    const activeBtn = document.getElementById(`btn-${currentFilter}`);
    if (activeBtn) {
        activeBtn.className = 'filter-btn px-4 py-2 rounded-md bg-navy-dark text-white text-sm font-medium shadow-sm transition-colors';
    }
}

// --- Rendering ---
function renderProjects() {
    gridActive.innerHTML = '';
    gridCompleted.innerHTML = '';
    renderDashboard();

    if (projects.length === 0) {
        emptyState.classList.remove('hidden');
        sectionActive.classList.add('hidden');
        sectionCompleted.classList.add('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // 1. Filter by Status
    let filtered = projects.filter(p => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return p.progress < 100;
        if (currentFilter === 'completed') return p.progress === 100;
        return true;
    });

    // 2. Filter by Search
    if (currentState.search) {
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(currentState.search) ||
            (p.description && p.description.toLowerCase().includes(currentState.search))
        );
    }

    // 3. Sort
    filtered.sort((a, b) => {
        if (currentState.sort === 'recent') {
            // Newest (higher ID/Time) first
            return Number(b.id) - Number(a.id);
        } else if (currentState.sort === 'deadline') {
            // Nearest deadline first
            return new Date(a.endDate) - new Date(b.endDate);
        } else if (currentState.sort === 'progress') {
            // Highest progress first
            return b.progress - a.progress;
        }
        return 0;
    });

    // Separating 
    const activeProjects = filtered.filter(p => p.progress < 100);
    const completedProjects = filtered.filter(p => p.progress === 100);

    // Hide/Show sections based on filter
    let showActive = (currentFilter === 'all' || currentFilter === 'active');
    let showCompleted = (currentFilter === 'all' || currentFilter === 'completed');

    if (activeProjects.length === 0) showActive = false;
    if (completedProjects.length === 0) showCompleted = false;

    sectionActive.classList.toggle('hidden', !showActive);
    sectionCompleted.classList.toggle('hidden', !showCompleted);

    // Render Active
    activeProjects.forEach(project => {
        const card = createCardElement(project, false);
        gridActive.appendChild(card);
    });

    // Render Completed
    completedProjects.forEach(project => {
        const card = createCardElement(project, true);
        gridCompleted.appendChild(card);
    });

    lucide.createIcons();
}

function createCardElement(project, isCompleted) {
    const div = document.createElement('div');
    // Add 'grayscale' if completed
    const grayscaleClass = isCompleted ? 'grayscale hover:grayscale-0 transition-all duration-500' : '';
    // Note: hover:grayscale-0 allows seeing color on hover for effect!

    div.className = `project-card bg-navy-light rounded-xl overflow-hidden border border-navy-muted flex flex-col h-full group cursor-pointer ${grayscaleClass}`;

    // Determine progress visual state
    const progress = project.progress;
    let progressColor = 'bg-primary-gold'; // Default
    if (progress === 100) progressColor = 'bg-success'; // Finished

    // Generate Checklist HTML (limit to 2 lines preview or just summary)
    const completedCount = project.checklist.filter(i => i.checked).length;
    const totalCount = project.checklist.length;

    div.innerHTML = `
        <!-- Thumbnail Area -->
        <div class="h-40 w-full relative flex flex-col justify-end overflow-hidden">
            ${project.thumbType === 'image'
            ? `<img src="${project.thumbValue}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">`
            : `<div class="absolute inset-0 ${project.thumbValue} transition-transform duration-700 group-hover:scale-110"></div>`
        }
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-navy-light via-transparent to-transparent opacity-90"></div>
            
            <!-- Actions (Edit, Copy & Delete) -->
            <div class="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); openModal('${project.id}')" class="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-navy-dark transition-colors" title="수정">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button onclick="event.stopPropagation(); copyProject('${project.id}')" class="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-navy-dark transition-colors" title="복사">
                    <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteProject('${project.id}')" class="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-colors" title="삭제">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="relative z-10 p-4">
                <span class="inline-block bg-primary-gold text-navy-dark text-xs font-bold px-2 py-1 rounded w-fit mb-1 shadow-md">
                    ${CATEGORY_LABELS[project.category] || '기타'}
                </span>
                <h3 class="text-xl font-bold leading-tight truncate">${project.title}</h3>
            </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex flex-col flex-1">
            <p class="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                ${project.description || '설명 없음'}
            </p>
            
            <div class="text-xs text-gray-500 mb-3 flex justify-between">
                <span>${project.startDate} ~ ${project.endDate}</span>
                <span>${completedCount}/${totalCount} 완료</span>
            </div>

            <!-- Progress Bar -->
            <div class="relative w-full h-3 bg-navy-dark rounded-full overflow-hidden">
                <div class="absolute top-0 left-0 h-full ${progressColor} progress-fill shadow-[0_0_10px_rgba(245,197,66,0.5)]" 
                     style="width: ${progress}%"></div>
            </div>
        </div>
    `;

    div.onclick = () => toggleChecklistModal(project.id); // Or expand detail
    return div;
}

function deleteProject(id) {
    if (confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
        SoundManager.playDelete();
        projects = projects.filter(p => p.id !== id);
        saveToStorage();
        renderProjects();
    }
}

function copyProject(id) {
    const original = projects.find(p => p.id === id);
    if (!original) return;

    // Deep clone original project
    const copy = JSON.parse(JSON.stringify(original));

    // Modify copy
    copy.id = Date.now().toString(); // New unique ID
    copy.title = `[복사] ${original.title}`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();

    // Add to projects (unshift to show at the top)
    projects.unshift(copy);

    saveToStorage();
    renderProjects();

    SoundManager.playSuccess();
    showToast('프로젝트가 복사되었습니다!', 'success');
}

// --- Logic ---
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function calculateProgress(checklist) {
    if (!checklist || checklist.length === 0) return 0;

    // Weighted Progress
    let totalCurrent = 0;
    let totalTarget = 0;

    checklist.forEach(item => {
        const target = item.target || 1;
        const current = item.current !== undefined ? item.current : (item.checked ? target : 0);
        totalCurrent += current;
        totalTarget += target;
    });

    if (totalTarget === 0) return 0;
    return Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
}

// --- Modal Actions ---
function openModal(editingId = null) {
    modal.classList.remove('hidden');
    form.reset();
    checklistContainer.innerHTML = '';
    document.getElementById('editing-id').value = '';
    document.getElementById('modal-title').innerText = '새 프로젝트 생성';

    // Reset Tab
    setThumbTab('gradient');

    // Default Thumbnail
    document.getElementById('selected-thumb-type').value = 'gradient';
    document.getElementById('selected-thumb-value').value = 'bg-gradient-to-br from-purple-500 to-indigo-500';
    document.getElementById('uploaded-preview').classList.add('hidden');
    document.querySelectorAll('.thumbnail-option').forEach((opt, idx) => {
        opt.classList.remove('selected');
        if (idx === 0) opt.classList.add('selected');
    });

    if (editingId) {
        // Editing Mode
        const p = projects.find(pro => pro.id === editingId);
        if (p) {
            document.getElementById('modal-title').innerText = '프로젝트 수정';
            document.getElementById('editing-id').value = p.id;
            document.getElementById('title').value = p.title;
            document.getElementById('category').value = p.category;
            document.getElementById('startDate').value = p.startDate;
            document.getElementById('endDate').value = p.endDate;
            document.getElementById('description').value = p.description;

            // Fill Checklist
            p.checklist.forEach(item => {
                addChecklistItem(item.text, item.target);
            });

            // Fill Thumbnail
            if (p.thumbType) {
                selectThumbnail(p.thumbType, p.thumbValue, document.getElementById('upload-btn'));

                // Switch tab based on type roughly (optional refinement)
                if (p.thumbType === 'image') {
                    setThumbTab('custom'); // Or gallery, hard to distinguish without data
                    const preview = document.getElementById('uploaded-preview');
                    preview.src = p.thumbValue;
                    preview.classList.remove('hidden');
                } else {
                    setThumbTab('gradient');
                    const el = Array.from(document.querySelectorAll('.thumbnail-option')).find(d => d.getAttribute('onclick') && d.getAttribute('onclick').includes(p.thumbValue));
                    if (el) selectThumbnail('gradient', p.thumbValue, el);
                }
            }
            return;
        }
    }

    // Create Mode Defaults
    addChecklistItem();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
}

// --- Web Image Logic ---
const STOCK_IMAGES = [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=300&q=80', // Work/Plan
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80', // Fitness
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=300&q=80', // Nature
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80', // Study
    'https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=300&q=80', // Gym
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80', // Nature
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=300&q=80', // Office
    'https://images.unsplash.com/photo-1552674605-db6ffd547515?auto=format&fit=crop&w=300&q=80', // Running
];

function setThumbTab(tab) {
    // Hide all
    ['gradient', 'gallery', 'custom'].forEach(t => {
        document.getElementById(`thumb-content-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).classList.remove('text-primary-gold', 'font-bold');
        document.getElementById(`tab-${t}`).classList.add('text-gray-400');
    });

    // Show current
    document.getElementById(`thumb-content-${tab}`).classList.remove('hidden');
    const btn = document.getElementById(`tab-${tab}`);
    btn.classList.add('text-primary-gold', 'font-bold');
    btn.classList.remove('text-gray-400');

    // If gallery, render if empty
    if (tab === 'gallery' && document.getElementById('gallery-grid').innerHTML.trim() === '') {
        renderGallery();
    }
}

function renderGallery() {
    const container = document.getElementById('gallery-grid');
    container.innerHTML = STOCK_IMAGES.map(src => {
        // High res version for value (simple replace trick)
        const highRes = src.replace('w=300', 'w=800');
        return `
            <div class="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary-gold transition-colors" 
                 onclick="selectThumbnail('image', '${highRes}', this)">
                <img src="${src}" class="w-full h-full object-cover">
            </div>
        `;
    }).join('');
}

function handleUrlInput() {
    const url = document.getElementById('img-url-input').value;
    if (url) {
        const preview = document.getElementById('uploaded-preview');
        preview.src = url;
        preview.classList.remove('hidden');

        document.getElementById('selected-thumb-type').value = 'image';
        document.getElementById('selected-thumb-value').value = url;

        // Visual feedback: select the upload box
        const uploadBtn = document.getElementById('upload-btn');
        document.querySelectorAll('.thumbnail-option').forEach(opt => opt.classList.remove('selected'));
        // Note: uploadBtn is in custom tab, which is fine.
    }
}

// --- Thumbnail Logic ---
function selectThumbnail(type, value, element) {
    document.getElementById('selected-thumb-type').value = type;
    document.getElementById('selected-thumb-value').value = value;

    // Visual feedback
    // Clear all selected states globally
    document.querySelectorAll('.thumbnail-option, #gallery-grid > div').forEach(opt => opt.classList.remove('selected', 'border-primary-gold'));

    // Add to clicked
    if (element.classList.contains('thumbnail-option')) {
        element.classList.add('selected');
    } else {
        // Gallery item
        element.classList.add('border-primary-gold');
    }
}

function closeModal() {
    modal.classList.add('hidden');
}

function addChecklistItem(text = '', target = 1, isCounter = false) {
    const row = document.createElement('div');
    row.className = 'flex gap-2 checklist-row animate-fade-in-up items-center py-1 group/row';
    row.innerHTML = `
        <button type="button" onclick="toggleItemMode(this)" class="p-2 rounded bg-navy-muted/50 text-gray-500 hover:text-primary-gold transition-colors flex items-center justify-center shrink-0" title="모드 전환 (체크박스/카운터)">
            <i data-lucide="${isCounter ? 'hash' : 'check-square'}" class="w-4 h-4"></i>
        </button>
        <input type="text" value="${text}" class="flex-1 bg-navy-dark border border-navy-muted rounded px-3 py-2 text-sm text-white focus:border-primary-gold outline-none" placeholder="할 일 입력" required>
        <div class="relative w-20 counter-input ${isCounter ? '' : 'hidden'}">
             <input type="number" min="1" value="${target}" class="w-full bg-navy-dark border border-navy-muted rounded px-2 py-2 text-sm text-center text-white focus:border-primary-gold outline-none" placeholder="목표">
             <span class="absolute right-7 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">회</span>
        </div>
        <input type="hidden" class="item-is-counter" value="${isCounter ? 'true' : 'false'}">
        <button type="button" onclick="removeChecklistItem(this)" class="text-gray-500 hover:text-red-400 px-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    checklistContainer.appendChild(row);
    lucide.createIcons();
}

window.toggleItemMode = function (btn) {
    const row = btn.closest('.checklist-row');
    const counterInput = row.querySelector('.counter-input');
    const hiddenInput = row.querySelector('.item-is-counter');
    const icon = btn.querySelector('i');

    const currentlyCounter = hiddenInput.value === 'true';
    const nextIsCounter = !currentlyCounter;

    hiddenInput.value = nextIsCounter ? 'true' : 'false';
    counterInput.classList.toggle('hidden', !nextIsCounter);

    // Update Icon
    icon.setAttribute('data-lucide', nextIsCounter ? 'hash' : 'check-square');
    lucide.createIcons();

    SoundManager.playClick();
}

function removeChecklistItem(btn) {
    const rows = checklistContainer.querySelectorAll('.checklist-row');
    if (rows.length > 1) {
        btn.closest('.checklist-row').remove();
    } else {
        showToast('최소 1개의 항목이 필요합니다.', 'error');
        SoundManager.playDelete(); // Reuse negative sound
    }
}

function saveProject() {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const description = document.getElementById('description').value;

    if (!title) {
        showToast('프로젝트 이름을 입력하세요.', 'error');
        return;
    }

    // Gather checklist
    const rows = checklistContainer.querySelectorAll('.checklist-row');
    const checklist = [];
    rows.forEach(row => {
        const text = row.querySelector('input[type="text"]').value.trim();
        const isCounter = row.querySelector('.item-is-counter').value === 'true';
        const target = isCounter ? (parseInt(row.querySelector('input[type="number"]').value) || 1) : 1;

        if (text) {
            checklist.push({
                text,
                target: target,
                current: 0,
                isCounter: isCounter,
                checked: false
            });
        }
    });

    if (checklist.length === 0) {
        showToast('최소 1개의 체크리스트 항목을 입력하세요.', 'error');
        return;
    }

    // Thumbnail
    const thumbType = document.getElementById('selected-thumb-type').value;
    const thumbValue = document.getElementById('selected-thumb-value').value;
    const editingId = document.getElementById('editing-id').value;

    if (editingId) {
        // Update Existing
        const idx = projects.findIndex(p => p.id === editingId);
        if (idx !== -1) {
            const oldList = projects[idx].checklist;

            // Remap new items to keep progress
            const mergedChecklist = checklist.map(newItem => {
                const match = oldList.find(old => old.text === newItem.text);
                if (match) {
                    let current = match.current !== undefined ? match.current : (match.checked ? match.target || 1 : 0);
                    if (current > newItem.target) current = newItem.target; // Clamp

                    return {
                        ...newItem,
                        current: current,
                        checked: current >= newItem.target
                    };
                }
                return newItem; // Brand new item
            });

            projects[idx] = {
                ...projects[idx],
                title, category, startDate, endDate, description,
                checklist: mergedChecklist,
                thumbType, thumbValue,
                progress: calculateProgress(mergedChecklist)
            };
        }
    } else {
        // Create New
        const newProject = {
            id: Date.now().toString(),
            title, category, description, startDate, endDate,
            checklist,
            progress: 0,
            thumbType, thumbValue
        };
        projects.unshift(newProject);
        setTimeout(SoundManager.playSuccess, 200);
        showToast('새 프로젝트가 생성되었습니다!', 'success');
    }

    saveToStorage();
    renderProjects();
    closeModal();
}

function renderDashboard() {
    const total = projects.length;
    const completed = projects.filter(p => p.progress === 100).length;
    let avg = 0;
    if (total > 0) {
        const sum = projects.reduce((acc, cur) => acc + cur.progress, 0);
        avg = Math.round(sum / total);
    }

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = completed;

    // Animated Counter for Avg
    document.getElementById('stat-avg').innerText = avg;

    // Circle Stroke
    // New Radius = 58
    // Circumference = 2 * pi * 58 ≈ 364.4
    const offset = 364.4 - (364.4 * avg) / 100;
    document.getElementById('stat-chart').style.strokeDashoffset = offset;
}

// --- Visual Effects ---
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 20 + 5;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.opacity = Math.random() * 0.3;
        p.style.animationDuration = `${Math.random() * 10 + 5}s`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(p);
    }
}

function triggerConfetti() {
    // Simple emoji confetti
    const count = 50;
    const defaults = { origin: { y: 0.7 } };

    for (let i = 0; i < count; i++) {
        const conf = document.createElement('div');
        conf.innerText = ['🎉', '✨', '🎊', '🏆'][Math.floor(Math.random() * 4)];
        conf.style.position = 'fixed';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.top = '-10vh';
        conf.style.fontSize = Math.random() * 20 + 20 + 'px';
        conf.style.zIndex = '100';
        conf.style.transition = 'top 3s ease-in, transform 3s ease-in';
        document.body.appendChild(conf);

        setTimeout(() => {
            conf.style.top = '110vh';
            conf.style.transform = `rotate(${Math.random() * 360}deg)`;
        }, 100);

        setTimeout(() => conf.remove(), 3100);
    }
}

// --- Detail Interaction (Counters) ---
function toggleChecklistModal(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    showDetailModal(project);
}

function showDetailModal(project) {
    // Ensure compat
    const safeChecklist = project.checklist.map(i => ({
        ...i,
        target: i.target || 1,
        current: i.current !== undefined ? i.current : (i.checked ? i.target || 1 : 0),
        isCounter: i.isCounter !== undefined ? i.isCounter : (i.target > 1)
    }));

    const modalHtml = `
        <div id="detail-backdrop" class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onclick="this.remove()">
            <div class="bg-navy-light w-full max-w-lg rounded-xl border border-navy-muted overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-navy-muted flex justify-between items-start">
                   <div>
                        <span class="text-xs font-bold text-primary-gold mb-1 block">${CATEGORY_LABELS[project.category]}</span>
                        <h2 class="text-2xl font-bold text-white">${project.title}</h2>
                   </div>
                   <button onclick="document.getElementById('detail-backdrop').remove()" class="text-gray-400 hover:text-white"><i data-lucide="x"></i></button>
                </div>
                <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <p class="text-gray-300 mb-6 text-sm">${project.description || '설명 없음'}</p>
                    <h4 class="font-bold text-white mb-3 flex items-center gap-2">
                        <i data-lucide="list-checks" class="w-5 h-5 text-primary-gold"></i>
                        Project Tasks
                    </h4>
                    <div class="space-y-3">
                        ${safeChecklist.map((item, idx) => {
        const isDone = item.current >= item.target;
        const isCounterMode = item.isCounter;

        if (isCounterMode) {
            return `
                                <div class="flex items-center justify-between p-4 rounded-xl bg-navy-dark border border-navy-muted shadow-inner group/item ${isDone ? 'border-primary-gold/30' : ''}">
                                    <span class="${isDone ? 'text-gray-500 line-through' : 'text-gray-200'} font-medium">${item.text}</span>
                                    <div class="flex items-center gap-3 bg-navy-light p-1 rounded-full border border-navy-muted">
                                        <button onclick="updateItemProgress('${project.id}', ${idx}, -1)" class="w-8 h-8 rounded-full bg-navy-dark hover:bg-navy-muted text-primary-gold flex items-center justify-center font-bold disabled:opacity-30 transition-all ${item.current <= 0 ? 'pointer-events-none' : ''}">
                                            <i data-lucide="minus" class="w-4 h-4"></i>
                                        </button>
                                        <div class="flex flex-col items-center min-w-[50px]">
                                            <span class="text-white font-mono text-sm font-bold">${item.current} / ${item.target}</span>
                                            <div class="w-full h-1 bg-navy-muted rounded-full mt-1 overflow-hidden">
                                                <div class="h-full bg-primary-gold" style="width: ${(item.current / item.target) * 100}%"></div>
                                            </div>
                                        </div>
                                        <button onclick="updateItemProgress('${project.id}', ${idx}, 1)" class="w-8 h-8 rounded-full bg-navy-dark hover:bg-navy-muted text-primary-gold flex items-center justify-center font-bold disabled:opacity-30 transition-all ${isDone ? 'pointer-events-none' : ''}">
                                            <i data-lucide="plus" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                                `;
        } else {
            // Standard Checkbox
            return `
                                <label class="flex items-center gap-4 p-4 rounded-xl bg-navy-dark border border-navy-muted cursor-pointer hover:border-primary-gold/50 transition-all group/item shadow-inner ${isDone ? 'border-primary-gold/30' : ''}">
                                    <div class="relative flex items-center justify-center">
                                        <input type="checkbox" ${isDone ? 'checked' : ''} onchange="updateItemProgress('${project.id}', ${idx}, 'toggle')" class="w-6 h-6 opacity-0 absolute cursor-pointer">
                                        <div class="w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-primary-gold border-primary-gold shadow-[0_0_10px_rgba(245,197,66,0.5)]' : 'border-navy-muted bg-navy-light'}">
                                            ${isDone ? '<i data-lucide="check" class="w-4 h-4 text-navy-dark font-bold"></i>' : ''}
                                        </div>
                                    </div>
                                    <span class="${isDone ? 'text-gray-500 line-through' : 'text-gray-200'} font-medium flex-1">${item.text}</span>
                                </label>
                                `;
        }
    }).join('')}
                    </div>
                </div>
                <div class="p-4 bg-navy-dark text-center border-t border-navy-muted">
                    <div class="flex items-center justify-center gap-2 mb-1">
                        <span class="text-xs text-gray-500 uppercase tracking-widest font-bold">Overall Progress</span>
                    </div>
                    <span class="text-primary-gold font-black text-3xl tracking-tighter">${project.progress}%</span>
                </div>
            </div>
        </div>
     `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();
}

window.updateItemProgress = function (projectId, itemIdx, action) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const item = project.checklist[itemIdx];
    // Ensure schema
    item.target = item.target || 1;
    item.current = item.current !== undefined ? item.current : (item.checked ? item.target : 0);

    const wasCompleted = project.progress === 100;

    if (action === 'toggle') {
        item.current = (item.current >= item.target) ? 0 : item.target;
        if (item.current > 0) SoundManager.playClick();
        else SoundManager.playDelete();
    } else {
        // Numeric Delta
        const newVal = item.current + action;
        if (newVal >= 0 && newVal <= item.target) {
            item.current = newVal;
        }
        SoundManager.playTone(400 + (item.current * 50), 'triangle', 0.1);
    }

    // Sync checked
    item.checked = (item.current >= item.target);

    // Recalc Project Progress
    project.progress = calculateProgress(project.checklist);

    saveToStorage();
    renderProjects();

    // Refresh Modal
    const backdrop = document.getElementById('detail-backdrop');
    if (backdrop) backdrop.remove();
    showDetailModal(project);

    // Celebration
    if (project.progress === 100 && !wasCompleted) {
        SoundManager.playComplete();
        triggerConfetti();
        showToast('축하합니다! 프로젝트를 완수했습니다! 🏆', 'success');
    }
}

// --- Data Backup Logic (New) ---
function exportData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        showToast('내보낼 데이터가 없습니다.', 'error');
        return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel-log-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('데이터가 내보내졌습니다.', 'success');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;

    if (confirm('현재 데이터가 모두 지워지고 백업 파일로 덮어씌워집니다. 계속하시겠습니까?')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                // Basic Array Check
                if (!Array.isArray(data)) throw new Error('Invalid Format');

                // Set data
                projects = data;
                saveToStorage();
                renderProjects();

                // Reset state
                input.value = '';
                showToast('데이터가 복원되었습니다.', 'success');
                setTimeout(() => window.location.reload(), 1000); // Reload to ensure full sync
            } catch (err) {
                console.error(err);
                showToast('잘못된 백업 파일입니다.', 'error');
            }
        };
        reader.readAsText(file);
    } else {
        input.value = '';
    }
}

function triggerImport() {
    document.getElementById('import-input').click();
}

// --- Firebase Configuration (User Review Required) ---
const firebaseConfig = {
    apiKey: "AIzaSyD2Z_C1BQbc5wnMLhX1S6vAVctwLbz5lCE",
    authDomain: "project-manager-43a31.firebaseapp.com",
    projectId: "project-manager-43a31",
    storageBucket: "project-manager-43a31.firebasestorage.app",
    messagingSenderId: "1060810904284",
    appId: "1:1060810904284:web:e288cdc31a56cbef321a19"
};

let db = null;
let auth = null;
let currentUser = null;

function initFirebase() {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.warn('Firebase config missing or default. Running in Local Storage mode.');
        return;
    }
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI(user);
        init(); // Re-init data based on user login state
    });
}

window.handleAuthClick = function () {
    if (!auth) {
        showToast('Firebase 설정이 필요합니다.', 'error');
        return;
    }
    if (currentUser) {
        auth.signOut().then(() => {
            showToast('로그아웃 되었습니다.', 'success');
        });
    } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(error => {
            console.error(error);
            showToast('로그인에 실패했습니다. (도메인 등록 확인 필요)', 'error');
        });
    }
}

function updateAuthUI(user) {
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    const userPhoto = document.getElementById('user-photo');
    const userName = document.getElementById('user-name');

    if (!authBtn) return;

    if (user) {
        authBtn.innerText = '로그아웃';
        if (userInfo) userInfo.classList.remove('hidden');
        if (userPhoto) userPhoto.src = user.photoURL;
        if (userName) userName.innerText = user.displayName;
    } else {
        authBtn.innerText = 'Google 로그인';
        if (userInfo) userInfo.classList.add('hidden');
    }
}

function saveToStorage() {
    if (currentUser && db) {
        db.collection('users').doc(currentUser.uid).set({
            projects: projects,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => {
            console.error('Firestore save error:', err);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        });
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
}

async function loadProjects() {
    if (currentUser && db) {
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            if (doc.exists) {
                projects = doc.data().projects || [];
            } else {
                projects = [];
            }
        } catch (err) {
            console.error('Firestore load error:', err);
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) projects = JSON.parse(stored);
        }
    } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            projects = JSON.parse(stored);
        } else {
            // Default Dummy Data
            projects = [{
                id: 'demo-1',
                title: '매일 아침 조깅하기',
                category: 'fitness',
                description: '건강한 하루를 위한 아침 30분 투자',
                startDate: '2025-01-01',
                endDate: '2025-01-31',
                progress: 50,
                checklist: [
                    { text: '1주차 완료', target: 1, current: 1, checked: true, isCounter: false },
                    { text: '2주차 완료', target: 1, current: 1, checked: true, isCounter: false },
                    { text: '3주차 완료', target: 1, current: 0, checked: false, isCounter: false },
                    { text: '4주차 완료', target: 1, current: 0, checked: false, isCounter: false },
                ],
                thumbType: 'gradient',
                thumbValue: 'bg-gradient-to-br from-purple-500 to-indigo-500'
            }];
            saveToStorage();
        }
    }
}

async function init() {
    await loadProjects();
    renderProjects();
    renderDashboard();
    createParticles();

    const today = new Date().toISOString().split('T')[0];
    const sd = document.getElementById('startDate');
    if (sd) sd.value = today;

    initTheme();
}

// Start Firebase & App
initFirebase();
if (!firebaseConfig.apiKey) {
    init(); // Run once if no firebase to avoid waiting for auth state
}
