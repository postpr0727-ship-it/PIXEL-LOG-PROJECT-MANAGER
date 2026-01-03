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
async function init() {
    await loadProjects();
    renderProjects();
    renderDashboard();
    createParticles();

    // Set default dates in form
    const today = new Date().toISOString().split('T')[0];
    const sd = document.getElementById('startDate');
    if (sd) sd.value = today;

    // Load Theme
    initTheme();

    // Video visibility fix (Eliminate flash & ensure visibility)
    const video = document.getElementById('hero-video');
    if (video) {
        // Function to show video
        const showVideo = () => video.classList.add('video-visible');

        // If already playing or buffered, show immediately
        if (video.readyState >= 3) {
            showVideo();
        }

        // Listen for playing event
        video.addEventListener('playing', showVideo, { once: true });

        // Fallback: Show after 2s regardless to prevent permanent black screen
        setTimeout(showVideo, 2000);
    }
}

// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) {
        if (theme === 'dark') {
            btn.innerHTML = '<i data-lucide="sun" class="w-6 h-6"></i>';
        } else {
            btn.innerHTML = '<i data-lucide="moon" class="w-6 h-6"></i>';
        }
        lucide.createIcons();
    }
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
    } else if (type === 'warning') {
        bgClass = 'bg-yellow-600 border-yellow-400 text-white';
        icon = 'alert-circle';
    } else {
        bgClass = 'bg-navy-muted border-gray-500 text-white';
    }

    toast.className = `flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border ${bgClass} toast-enter text-sm font-bold min-w-[300px]`;
    // Convert \n to <br> for line breaks
    const formattedMsg = msg.replace(/\n/g, '<br>');
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
        <span>${formattedMsg}</span>
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
            return Number(b.id) - Number(a.id);
        } else if (currentState.sort === 'deadline') {
            return new Date(a.endDate) - new Date(b.endDate);
        } else if (currentState.sort === 'progress') {
            return b.progress - a.progress;
        }
        return 0;
    });

    const activeProjects = filtered.filter(p => p.progress < 100);
    const completedProjects = filtered.filter(p => p.progress === 100);

    let showActive = (currentFilter === 'all' || currentFilter === 'active');
    let showCompleted = (currentFilter === 'all' || currentFilter === 'completed');

    if (activeProjects.length === 0) showActive = false;
    if (completedProjects.length === 0) showCompleted = false;

    sectionActive.classList.toggle('hidden', !showActive);
    sectionCompleted.classList.toggle('hidden', !showCompleted);

    activeProjects.forEach(project => gridActive.appendChild(createCardElement(project, false)));
    completedProjects.forEach(project => gridCompleted.appendChild(createCardElement(project, true)));

    lucide.createIcons();
}

function createCardElement(project, isCompleted) {
    const div = document.createElement('div');
    const grayscaleClass = isCompleted ? 'grayscale hover:grayscale-0 transition-all duration-500' : '';
    div.className = `project-card bg-navy-light rounded-xl overflow-hidden border border-navy-muted flex flex-col h-full group cursor-pointer ${grayscaleClass}`;

    const progress = project.progress;
    let progressColor = 'bg-primary-gold';
    if (progress === 100) progressColor = 'bg-success';

    const completedCount = project.checklist.filter(i => i.checked).length;
    const totalCount = project.checklist.length;

    div.innerHTML = `
        <div class="h-40 w-full relative flex flex-col justify-end overflow-hidden">
            ${project.thumbType === 'image'
            ? `<img src="${project.thumbValue}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" style="object-position: center ${project.thumbPosition || 50}%">`
            : `<div class="absolute inset-0 ${project.thumbValue} transition-transform duration-700 group-hover:scale-110"></div>`
        }
            <div class="absolute inset-0 bg-gradient-to-t from-navy-light via-transparent to-transparent opacity-90"></div>
            <div class="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); openModal('${project.id}')" class="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-navy-dark transition-colors"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button onclick="event.stopPropagation(); copyProject('${project.id}')" class="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-navy-dark transition-colors"><i data-lucide="copy" class="w-4 h-4"></i></button>
                <button onclick="event.stopPropagation(); deleteProject('${project.id}')" class="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="relative z-10 p-4">
                <span class="inline-block bg-primary-gold text-navy-dark text-xs font-bold px-2 py-1 rounded w-fit mb-1 shadow-md">${CATEGORY_LABELS[project.category] || '기타'}</span>
                <h3 class="text-xl font-bold leading-tight truncate">${project.title}</h3>
            </div>
        </div>
        <div class="p-5 flex flex-col flex-1">
            <p class="text-gray-400 text-sm line-clamp-2 mb-4 flex-1">${project.description || '설명 없음'}</p>
            <div class="text-xs text-gray-500 mb-3 flex justify-between">
                <span>${project.startDate} ~ ${project.endDate}</span>
                <span>${completedCount}/${totalCount} 완료</span>
            </div>
            <div class="relative w-full h-3 bg-navy-dark rounded-full overflow-hidden">
                <div class="absolute top-0 left-0 h-full ${progressColor} progress-fill shadow-[0_0_10px_rgba(245,197,66,0.5)]" style="width: ${progress}%"></div>
            </div>
        </div>
    `;

    div.onclick = () => toggleChecklistModal(project.id);
    return div;
}

async function deleteProject(id) {
    if (confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
        SoundManager.playDelete();
        projects = projects.filter(p => p.id !== id);
        await saveToStorage();
        renderProjects();
    }
}

async function copyProject(id) {
    const original = projects.find(p => p.id === id);
    if (!original) return;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = Date.now().toString();
    copy.title = `[복사] ${original.title}`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    projects.unshift(copy);
    await saveToStorage();
    renderProjects();
    SoundManager.playSuccess();
    showToast('프로젝트가 복사되었습니다!', 'success');
}

function calculateProgress(checklist) {
    if (!checklist || checklist.length === 0) return 0;
    let totalCurrent = 0, totalTarget = 0;
    checklist.forEach(item => {
        const target = item.target || 1;
        totalCurrent += item.current !== undefined ? item.current : (item.checked ? target : 0);
        totalTarget += target;
    });
    return totalTarget === 0 ? 0 : Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
}

// --- Modal Actions ---
let isDraggingThumb = false;
let startY = 0;
let currentPos = 50;

function initThumbnailDragger() {
    const preview = document.getElementById('uploaded-preview');
    const dragHint = document.getElementById('drag-hint');
    if (!preview) return;

    const startDrag = (e) => {
        if (!preview.classList.contains('hidden')) {
            isDraggingThumb = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            // Prevent default browser dragging behavior
            if (e.cancelable) e.preventDefault();

            const style = window.getComputedStyle(preview);
            const pos = style.objectPosition.split(' ')[1];
            currentPos = parseFloat(pos) || 50;
            preview.classList.add('dragging');
            if (dragHint) dragHint.classList.add('hidden');
        }
    };

    const onDrag = (e) => {
        if (!isDraggingThumb) return;
        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const delta = (y - startY) * 0.2; // Sensitivity
        currentPos = Math.max(0, Math.min(100, currentPos - delta));
        startY = y;

        preview.style.objectPosition = `center ${currentPos}%`;
        document.getElementById('selected-thumb-pos').value = currentPos;
    };

    const stopDrag = () => {
        isDraggingThumb = false;
        preview.classList.remove('dragging');
    };

    preview.addEventListener('mousedown', startDrag);
    preview.addEventListener('touchstart', startDrag);
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
}

function openModal(editingId = null) {
    modal.classList.remove('hidden');
    form.reset();
    checklistContainer.innerHTML = '';
    document.getElementById('editing-id').value = '';
    document.getElementById('modal-title').innerText = '새 프로젝트 생성';
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.innerText = '생성하기';
    setThumbTab('gradient');

    if (editingId) {
        const p = projects.find(pro => pro.id === editingId);
        if (p) {
            document.getElementById('modal-title').innerText = '프로젝트 수정';
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) submitBtn.innerText = '수정 완료';
            document.getElementById('editing-id').value = p.id;
            document.getElementById('title').value = p.title;
            document.getElementById('category').value = p.category;
            document.getElementById('startDate').value = p.startDate;
            document.getElementById('endDate').value = p.endDate;
            document.getElementById('description').value = p.description;
            p.checklist.forEach(item => addChecklistItem(item.text, item.target, item.isCounter));

            if (p.thumbType) {
                const pos = p.thumbPosition !== undefined ? p.thumbPosition : 50;
                document.getElementById('selected-thumb-pos').value = pos;
                selectThumbnail(p.thumbType, p.thumbValue, null);

                if (p.thumbType === 'image') {
                    setThumbTab('custom');
                    const preview = document.getElementById('uploaded-preview');
                    if (preview) {
                        preview.style.objectPosition = `center ${pos}%`;
                    }
                } else {
                    setThumbTab('gradient');
                }
            }
            return;
        }
    }
    // Reset thumbnail preview for new projects
    const preview = document.getElementById('uploaded-preview');
    if (preview) {
        preview.src = '';
        preview.classList.add('hidden');
        preview.style.objectPosition = 'center 50%';
        document.getElementById('selected-thumb-pos').value = 50;
    }
    const dragHint = document.getElementById('drag-hint');
    if (dragHint) dragHint.classList.add('hidden');

    addChecklistItem();
}

// Thumbnail Tab Switching
function setThumbTab(tab) {
    ['gradient', 'gallery', 'custom'].forEach(t => {
        document.getElementById(`thumb-content-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).classList.remove('text-primary-gold', 'font-bold');
    });
    document.getElementById(`thumb-content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.add('text-primary-gold', 'font-bold');
    // Gallery tab now shows free image site links (no rendering needed)
    if (tab === 'gallery') {
        lucide.createIcons(); // Refresh icons for the gallery cards
    }
}

function selectThumbnail(type, value, element) {
    document.getElementById('selected-thumb-type').value = type;
    document.getElementById('selected-thumb-value').value = value;

    // UI Update
    document.querySelectorAll('.thumbnail-option').forEach(opt => opt.classList.remove('selected', 'border-primary-gold'));
    if (element) {
        element.classList.add(element.classList.contains('thumbnail-option') ? 'selected' : 'border-primary-gold');
    }

    // Special handling for Custom Tab preview
    if (type === 'image') {
        const preview = document.getElementById('uploaded-preview');
        const dragHint = document.getElementById('drag-hint');
        const uploadPrompt = document.getElementById('upload-prompt');
        const changeBtn = document.getElementById('change-thumb-btn');
        const fileInput = document.getElementById('thumb-file-input');

        if (preview && preview.src !== value) {
            preview.src = value;
            preview.classList.remove('hidden');
            if (dragHint) dragHint.classList.remove('hidden');
            if (uploadPrompt) uploadPrompt.classList.add('hidden');
            if (changeBtn) changeBtn.classList.remove('hidden');
            if (fileInput) fileInput.classList.add('hidden');
        }
    } else {
        const dragHint = document.getElementById('drag-hint');
        const uploadPrompt = document.getElementById('upload-prompt');
        const changeBtn = document.getElementById('change-thumb-btn');
        const fileInput = document.getElementById('thumb-file-input');

        if (dragHint) dragHint.classList.add('hidden');
        if (uploadPrompt) uploadPrompt.classList.remove('hidden');
        if (changeBtn) changeBtn.classList.add('hidden');
        if (fileInput) fileInput.classList.remove('hidden');
    }
}

// URL Input Handler with Preview
window.handleUrlInput = function () {
    const input = document.getElementById('img-url-input');
    const url = input.value.trim();

    if (!url) {
        showToast('이미지 URL을 입력해주세요.', 'warning');
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        showToast('올바른 URL 형식이 아닙니다.', 'error');
        return;
    }

    // Show preview
    const previewContainer = document.getElementById('url-preview-container');
    const previewImg = document.getElementById('url-preview-img');

    if (previewImg && previewContainer) {
        previewImg.src = url;
        previewImg.onerror = () => {
            showToast('이미지를 불러올 수 없습니다.\nURL을 확인해주세요.', 'error');
            previewContainer.classList.add('hidden');
        };
        previewImg.onload = () => {
            previewContainer.classList.remove('hidden');
            selectThumbnail('image', url, null);
            showToast('이미지 URL이 적용되었습니다!', 'success');
            lucide.createIcons();
        };
    } else {
        // Fallback if preview elements don't exist
        selectThumbnail('image', url, null);
        showToast('이미지 URL이 적용되었습니다!', 'success');
    }
}

// Clear URL Preview
window.clearUrlPreview = function () {
    const input = document.getElementById('img-url-input');
    const previewContainer = document.getElementById('url-preview-container');
    const previewImg = document.getElementById('url-preview-img');

    if (input) input.value = '';
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.classList.add('hidden');

    showToast('미리보기가 초기화되었습니다.', 'success');
}

function closeModal() { modal.classList.add('hidden'); }

function addChecklistItem(text = '', target = 1, isCounter = false) {
    const row = document.createElement('div');
    row.className = 'flex gap-2 checklist-row items-center py-2 group/row border-b border-navy-muted/30 last:border-0';
    row.innerHTML = `
        <div class="flex flex-col gap-1 items-center bg-navy-dark/50 p-1 rounded-lg border border-navy-muted">
            <button type="button" onclick="toggleItemMode(this, false)" class="mode-btn p-1.5 rounded-md transition-all ${!isCounter ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}" title="일반 체크박스">
                <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" onclick="toggleItemMode(this, true)" class="mode-btn p-1.5 rounded-md transition-all ${isCounter ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}" title="회차 카운터">
                <i data-lucide="hash" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        <div class="flex-1 flex flex-col gap-2">
            <input type="text" value="${text}" class="w-full bg-navy-dark border border-navy-muted rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary-gold" placeholder="수행할 목표 입력" required>
            <div class="flex items-center gap-2">
                <div class="counter-input-container ${isCounter ? '' : 'hidden'} flex items-center bg-navy-dark border border-navy-muted rounded-lg px-2 py-1.5">
                    <span class="text-[10px] text-gray-500 font-bold mr-2 uppercase tracking-tighter">Goal</span>
                    <input type="number" min="1" value="${target}" class="w-12 bg-transparent text-sm text-center text-white outline-none focus:text-primary-gold">
                    <span class="text-xs text-gray-500 ml-1">회</span>
                </div>
            </div>
        </div>
        <input type="hidden" class="item-is-counter" value="${isCounter}">
        <button type="button" onclick="removeChecklistItem(this)" class="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    checklistContainer.appendChild(row);
    lucide.createIcons();
}

window.toggleItemMode = function (btn, forcedMode) {
    const row = btn.closest('.checklist-row');
    const hidden = row.querySelector('.item-is-counter');
    const currentMode = hidden.value === 'true';

    // If clicking the same button, do nothing
    if (forcedMode === currentMode) return;

    const isCounter = forcedMode;
    hidden.value = isCounter;

    // Update Buttons UI
    const btns = row.querySelectorAll('.mode-btn');
    btns[0].className = `mode-btn p-1.5 rounded-md transition-all ${!isCounter ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}`;
    btns[1].className = `mode-btn p-1.5 rounded-md transition-all ${isCounter ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}`;

    // Update Counter Input Visibility
    const counterContainer = row.querySelector('.counter-input-container');
    counterContainer.classList.toggle('hidden', !isCounter);

    SoundManager.playClick();
}

function removeChecklistItem(btn) {
    if (checklistContainer.querySelectorAll('.checklist-row').length > 1) btn.closest('.checklist-row').remove();
    else showToast('최소 1개의 항목이 필요합니다.', 'error');
}

async function saveProject() {
    const title = document.getElementById('title').value;
    if (!title) { showToast('이름을 입력하세요.', 'error'); return; }
    const checklist = [];
    checklistContainer.querySelectorAll('.checklist-row').forEach(row => {
        const text = row.querySelector('input[type="text"]').value.trim();
        const isCounter = row.querySelector('.item-is-counter').value === 'true';
        if (text) checklist.push({
            text,
            isCounter,
            target: isCounter ? parseInt(row.querySelector('input[type="number"]').value) || 1 : 1,
            current: 0,
            checked: false
        });
    });
    if (checklist.length === 0) { showToast('항목을 입력하세요.', 'error'); return; }

    const thumbType = document.getElementById('selected-thumb-type').value,
        thumbValue = document.getElementById('selected-thumb-value').value,
        thumbPosition = document.getElementById('selected-thumb-pos').value,
        id = document.getElementById('editing-id').value;
    if (id) {
        const idx = projects.findIndex(p => p.id === id);
        if (idx !== -1) {
            projects[idx] = { ...projects[idx], title, category: document.getElementById('category').value, startDate: document.getElementById('startDate').value, endDate: document.getElementById('endDate').value, description: document.getElementById('description').value, checklist, thumbType, thumbValue, thumbPosition: parseFloat(thumbPosition), progress: calculateProgress(checklist) };
        }
    } else {
        projects.unshift({ id: Date.now().toString(), title, category: document.getElementById('category').value, description: document.getElementById('description').value, startDate: document.getElementById('startDate').value, endDate: document.getElementById('endDate').value, checklist, progress: 0, thumbType, thumbValue, thumbPosition: parseFloat(thumbPosition) });
        showToast('생성되었습니다!', 'success');
    }
    try {
        await saveToStorage();
        renderProjects();
        closeModal();
    } catch (error) {
        // Error already handled in saveToStorage
        console.error('Failed to save project:', error);
    }
}

function renderDashboard() {
    const total = projects.length, avg = total > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / total) : 0;
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = projects.filter(p => p.progress === 100).length;
    document.getElementById('stat-avg').innerText = avg;
    document.getElementById('stat-chart').style.strokeDashoffset = 364.4 - (364.4 * avg) / 100;
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const s = Math.random() * 20 + 5;
        p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;opacity:${Math.random() * 0.3};animation-duration:${Math.random() * 10 + 5}s;animation-delay:${Math.random() * 5}s`;
        container.appendChild(p);
    }
}

function triggerConfetti() {
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.innerText = ['🎉', '✨', '🎊', '🏆'][Math.floor(Math.random() * 4)];
        c.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-10vh;font-size:${Math.random() * 20 + 20}px;z-index:100;transition:top 3s ease-in,transform 3s ease-in`;
        document.body.appendChild(c);
        setTimeout(() => { c.style.top = '110vh'; c.style.transform = `rotate(${Math.random() * 360}deg)`; }, 100);
        setTimeout(() => c.remove(), 3100);
    }
}

function toggleChecklistModal(id) {
    const p = projects.find(x => x.id === id);
    if (p) showDetailModal(p);
}

function showDetailModal(project) {
    const safeChecklist = project.checklist.map(i => ({ ...i, target: i.target || 1, current: i.current !== undefined ? i.current : (i.checked ? i.target : 0), isCounter: i.isCounter !== undefined ? i.isCounter : (i.target > 1) }));
    const html = `
        <div id="detail-backdrop" class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onclick="this.remove()">
            <div class="bg-navy-light w-full max-w-lg rounded-xl border border-navy-muted overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-navy-muted flex justify-between items-start">
                   <div><span class="text-xs font-bold text-primary-gold mb-1 block">${CATEGORY_LABELS[project.category]}</span><h2 class="text-2xl font-bold text-white">${project.title}</h2></div>
                   <button onclick="document.getElementById('detail-backdrop').remove()" class="text-gray-400 hover:text-white"><i data-lucide="x"></i></button>
                </div>
                <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <p class="text-gray-300 text-sm mb-6">${project.description || ''}</p>
                    <div class="space-y-3">
                        ${safeChecklist.map((item, idx) => `
                            <div class="flex items-center justify-between p-4 rounded-xl bg-navy-dark border border-navy-muted">
                                <span class="${item.current >= item.target ? 'text-gray-500 line-through' : 'text-gray-200'} flex-1 text-sm font-medium">${item.text}</span>
                                ${item.isCounter ? `
                                    <div class="flex items-center gap-3 bg-navy-light p-1 rounded-full border border-navy-muted">
                                        <button onclick="updateItemProgress('${project.id}', ${idx}, -1)" class="w-8 h-8 rounded-full bg-navy-dark text-primary-gold flex items-center justify-center font-bold disabled:opacity-30"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                        <div class="flex flex-col items-center min-w-[50px]"><span class="text-white font-mono text-xs font-bold">${item.current}/${item.target}</span><div class="w-full h-1 bg-navy-muted rounded-full overflow-hidden mt-1"><div class="h-full bg-primary-gold transition-all" style="width:${(item.current / item.target) * 100}%"></div></div></div>
                                        <button onclick="updateItemProgress('${project.id}', ${idx}, 1)" class="w-8 h-8 rounded-full bg-navy-dark text-primary-gold flex items-center justify-center font-bold disabled:opacity-30"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                    </div>
                                ` : `
                                    <input type="checkbox" ${item.current >= item.target ? 'checked' : ''} onchange="updateItemProgress('${project.id}', ${idx}, 'toggle')" class="w-6 h-6 rounded border-navy-muted">
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="p-4 bg-navy-dark text-center border-t border-navy-muted"><span class="text-primary-gold font-black text-3xl">${project.progress}%</span></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    lucide.createIcons();
}

window.updateItemProgress = async function (id, idx, action) {
    const p = projects.find(x => x.id === id), item = p.checklist[idx], was = p.progress === 100;
    if (action === 'toggle') item.current = item.current >= item.target ? 0 : item.target;
    else if (item.current + action >= 0 && item.current + action <= item.target) item.current += action;
    item.checked = item.current >= item.target;
    p.progress = calculateProgress(p.checklist);
    await saveToStorage();
    renderProjects();
    const bd = document.getElementById('detail-backdrop'); if (bd) { bd.remove(); showDetailModal(p); }
    if (p.progress === 100 && !was) { SoundManager.playComplete(); triggerConfetti(); showToast('완수했습니다! 🏆', 'success'); }
}

function exportData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `pixel-log-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
}

function importData(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            projects = JSON.parse(e.target.result); saveToStorage(); renderProjects(); location.reload();
        } catch (err) { showToast('잘못된 백업 파일입니다.', 'error'); }
    };
    reader.readAsText(file);
}

const firebaseConfig = { apiKey: "AIzaSyD2Z_C1BQbc5wnMLhX1S6vAVctwLbz5lCE", authDomain: "project-manager-43a31.firebaseapp.com", projectId: "project-manager-43a31", storageBucket: "project-manager-43a31.firebasestorage.app", messagingSenderId: "1060810904284", appId: "1:1060810904284:web:e288cdc31a56cbef321a19" };
let db = null, auth = null, currentUser = null, storage = null;

function initFirebase() {
    if (!firebaseConfig.apiKey) return;
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI(user);
        init();
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
            showToast('로그인에 실패했습니다.', 'error');
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

async function saveToStorage() {
    try {
        if (currentUser && db) {
            await db.collection('users').doc(currentUser.uid).set({
                projects,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        }
    } catch (error) {
        console.error('Save error:', error);
        if (error.code === 'resource-exhausted' || error.message?.includes('exceeds the maximum allowed size')) {
            showToast('전체 프로젝트 데이터 크기 제한 초과 (1MB).\n\n해결 방법:\n1. 일부 프로젝트 삭제\n2. 그라디언트 사용 (용량 거의 없음)\n3. 이미지 URL 방식 사용 (용량 거의 없음)', 'error');
        } else if (error.name === 'QuotaExceededError') {
            showToast('저장 공간이 부족합니다.\n일부 프로젝트를 삭제해주세요.', 'error');
        } else {
            showToast('저장 중 오류가 발생했습니다.', 'error');
        }
        throw error;
    }
}

async function loadProjects() {
    if (currentUser && db) {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) projects = doc.data().projects || [];
    } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) projects = JSON.parse(stored);
        else { projects = [{ id: 'demo-1', title: '매일 아침 조깅하기', category: 'fitness', description: '건강한 하루를 위한 아침 30분 투자', startDate: '2025-01-01', endDate: '2025-01-31', progress: 50, checklist: [{ text: '1주차 완료', target: 1, current: 1, checked: true, isCounter: false }, { text: '2주차 완료', target: 1, current: 1, checked: true, isCounter: false }, { text: '3주차 완료', target: 1, current: 0, checked: false, isCounter: false }, { text: '4주차 완료', target: 1, current: 0, checked: false, isCounter: false }], thumbType: 'gradient', thumbValue: 'bg-gradient-to-br from-purple-500 to-indigo-500' }]; saveToStorage(); }
    }
}

// Start App
initThumbnailDragger();
initFirebase();
if (!firebaseConfig.apiKey) init();
