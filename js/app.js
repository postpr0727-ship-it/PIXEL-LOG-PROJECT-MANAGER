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
    certificate: 'bg-category-certificate',
    language: 'bg-category-language',
    health: 'bg-category-health',
    finance: 'bg-category-finance',
    coding: 'bg-category-coding',
    reading: 'bg-category-reading',
    travel: 'bg-category-travel',
    diet: 'bg-category-diet',
    habit: 'bg-category-habit',
    side: 'bg-category-side',
    project: 'bg-category-project',
    custom: 'bg-gray-500'
};

const CATEGORY_LABELS = {
    fitness: '운동 💪',
    growth: '자기계발 📚',
    work: '업무 💼',
    hobby: '취미 🎨',
    study: '학습 🎓',
    certificate: '자격증 📜',
    language: '외국어 🌍',
    health: '건강관리 🏥',
    finance: '재테크 💰',
    coding: '코딩 💻',
    reading: '독서 📖',
    travel: '여행 ✈️',
    diet: '다이어트 🥗',
    habit: '습관형성 ⏰',
    side: '사이드프로젝트 🚀',
    project: '프로젝트 📋',
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

    const stats = getChecklistStats(project.checklist);
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
                <div class="flex items-center gap-2">
                    ${stats.in_progress > 0 ? `<span class="text-blue-400">🔵 ${stats.in_progress}</span>` : ''}
                    <span class="text-success">✅ ${stats.completed}/${totalCount}</span>
                </div>
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
        const isCalendar = item.isCalendar || item.itemMode === 'calendar';
        
        // Handle calendar items - based on dates count vs target
        if (isCalendar) {
            const dates = item.dates || [];
            // 이번 달 기록 수 계산
            const now = new Date();
            const thisMonthDates = dates.filter(d => {
                const date = new Date(d);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            });
            totalCurrent += thisMonthDates.length; // 실제 달성 횟수
            totalTarget += target; // 목표 횟수
        }
        // Handle counter items
        else if (item.isCounter) {
            totalCurrent += item.current !== undefined ? item.current : 0;
            totalTarget += target;
        } else {
            // Handle status-based items (pending/in_progress/completed)
            const status = item.status || (item.checked ? 'completed' : 'pending');
            if (status === 'completed') {
                totalCurrent += target;
            } else if (status === 'in_progress') {
                totalCurrent += target * 0.5; // 진행중은 50%
            }
            // pending은 0
            totalTarget += target;
        }
    });
    return totalTarget === 0 ? 0 : Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
}

// Get checklist stats (pending, in_progress, completed counts)
function getChecklistStats(checklist) {
    const stats = { pending: 0, in_progress: 0, completed: 0 };
    if (!checklist) return stats;
    
    checklist.forEach(item => {
        const isCalendar = item.isCalendar || item.itemMode === 'calendar';
        
        if (isCalendar) {
            // Calendar items: check this month's dates vs target
            const dates = item.dates || [];
            const target = item.target || 1;
            const now = new Date();
            const thisMonthCount = dates.filter(d => {
                const date = new Date(d);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length;
            
            if (thisMonthCount >= target) stats.completed++;
            else if (thisMonthCount > 0) stats.in_progress++;
            else stats.pending++;
        } else if (item.isCounter) {
            // Counter items: completed if current >= target
            if (item.current >= item.target) stats.completed++;
            else if (item.current > 0) stats.in_progress++;
            else stats.pending++;
        } else {
            const status = item.status || (item.checked ? 'completed' : 'pending');
            stats[status]++;
        }
    });
    return stats;
}

// --- Modal Actions ---
let isDraggingThumb = false;
let startY = 0;
let currentPos = 50;

function initThumbnailDragger() {
    const preview = document.getElementById('url-preview-img');
    const dragHint = document.getElementById('drag-hint');
    if (!preview) return;
    
    // Remove existing listeners to prevent duplicates
    const newPreview = preview.cloneNode(true);
    preview.parentNode.replaceChild(newPreview, preview);

    const startDrag = (e) => {
        const currentPreview = document.getElementById('url-preview-img');
        const container = document.getElementById('url-preview-container');
        if (container && !container.classList.contains('hidden')) {
            isDraggingThumb = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            // Prevent default browser dragging behavior
            if (e.cancelable) e.preventDefault();

            const style = window.getComputedStyle(currentPreview);
            const pos = style.objectPosition.split(' ')[1];
            currentPos = parseFloat(pos) || 50;
            currentPreview.classList.add('dragging');
            const hint = document.getElementById('drag-hint');
            if (hint) hint.classList.add('hidden');
        }
    };

    const onDrag = (e) => {
        if (!isDraggingThumb) return;
        const currentPreview = document.getElementById('url-preview-img');
        const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const delta = (y - startY) * 0.3; // Sensitivity
        currentPos = Math.max(0, Math.min(100, currentPos - delta));
        startY = y;

        if (currentPreview) {
            currentPreview.style.objectPosition = `center ${currentPos}%`;
        }
        document.getElementById('selected-thumb-pos').value = currentPos;
    };

    const stopDrag = () => {
        isDraggingThumb = false;
        const currentPreview = document.getElementById('url-preview-img');
        if (currentPreview) currentPreview.classList.remove('dragging');
    };

    newPreview.addEventListener('mousedown', startDrag);
    newPreview.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
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
    
    // Initialize drag & drop after modal opens
    setTimeout(() => {
        initDragDrop();
        lucide.createIcons();
    }, 100);

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
            p.checklist.forEach(item => {
                const mode = item.itemMode || (item.isCalendar ? 'calendar' : (item.isCounter ? 'counter' : 'checkbox'));
                addChecklistItem(item.text, item.target, mode);
            });

            if (p.thumbType) {
                const pos = p.thumbPosition !== undefined ? p.thumbPosition : 50;
                document.getElementById('selected-thumb-pos').value = pos;
                selectThumbnail(p.thumbType, p.thumbValue, null);

                if (p.thumbType === 'image') {
                    setThumbTab('custom');
                    // Show preview with existing image
                    setTimeout(() => {
                        const previewImg = document.getElementById('url-preview-img');
                        const previewContainer = document.getElementById('url-preview-container');
                        const dragHint = document.getElementById('drag-hint');
                        const uploadPrompt = document.getElementById('upload-prompt');
                        
                        if (previewImg) {
                            previewImg.src = p.thumbValue;
                            previewImg.style.objectPosition = `center ${pos}%`;
                        }
                        if (previewContainer) previewContainer.classList.remove('hidden');
                        if (dragHint) dragHint.classList.remove('hidden');
                        if (uploadPrompt) uploadPrompt.classList.add('hidden');
                        
                        // Initialize dragger for position adjustment
                        initThumbnailDragger();
                        lucide.createIcons();
                    }, 150);
                } else {
                    setThumbTab('gradient');
                }
            }
            return;
        }
    }
    // Reset thumbnail preview for new projects
    const preview = document.getElementById('url-preview-img');
    const previewContainer = document.getElementById('url-preview-container');
    const uploadPrompt = document.getElementById('upload-prompt');
    
    if (preview) {
        preview.src = '';
        preview.style.objectPosition = 'center 50%';
    }
    if (previewContainer) previewContainer.classList.add('hidden');
    if (uploadPrompt) uploadPrompt.classList.remove('hidden');
    document.getElementById('selected-thumb-pos').value = 50;
    
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
    
    // Initialize features based on tab
    if (tab === 'gallery') {
        lucide.createIcons();
    } else if (tab === 'custom') {
        setUploadMethod('file'); // Default to file upload
        setTimeout(() => {
            initDragDrop();
            lucide.createIcons();
        }, 50);
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
    let url = input.value.trim();

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

    // Convert Google Drive links to direct image URLs
    if (url.includes('drive.google.com')) {
        // Check if it's a folder link
        if (url.includes('/folders/') || url.includes('/drive/folders/')) {
            showToast('폴더 링크는 사용할 수 없습니다.\n\n개별 이미지 파일을 우클릭하여\n"공유" → "링크 복사"를 선택해주세요.', 'error');
            return;
        }

        // Extract file ID from file link
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            url = `https://drive.google.com/uc?export=view&id=${fileId}`;
            console.log('Converted Google Drive link:', url);
            showToast('Google Drive 링크를 변환했습니다.', 'success');
            // Update input to show converted URL
            input.value = url;
        } else {
            showToast('Google Drive 파일 링크가 아닙니다.\n\n올바른 형식:\nhttps://drive.google.com/file/d/FILE_ID/view', 'error');
            return;
        }
    }

    // Show preview
    const previewContainer = document.getElementById('url-preview-container');
    const previewImg = document.getElementById('url-preview-img');
    const dragHint = document.getElementById('drag-hint');

    if (previewImg && previewContainer) {
        previewImg.src = url;
        previewImg.style.objectPosition = 'center 50%';
        document.getElementById('selected-thumb-pos').value = 50;
        
        previewImg.onerror = () => {
            showToast('이미지를 불러올 수 없습니다.\n\nGoogle Drive 이미지인 경우:\n공유 설정을 "링크가 있는 모든 사용자"로 변경해주세요.', 'error');
            previewContainer.classList.add('hidden');
        };
        previewImg.onload = () => {
            previewContainer.classList.remove('hidden');
            if (dragHint) dragHint.classList.remove('hidden');
            selectThumbnail('image', url, null);
            showToast('이미지 URL이 적용되었습니다!', 'success');
            lucide.createIcons();
            // Initialize thumbnail dragger for position adjustment
            setTimeout(() => initThumbnailDragger(), 100);
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
    const uploadPrompt = document.getElementById('upload-prompt');
    const dragHint = document.getElementById('drag-hint');

    if (input) input.value = '';
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.classList.add('hidden');
    if (uploadPrompt) uploadPrompt.classList.remove('hidden');
    if (dragHint) dragHint.classList.add('hidden');
    
    // Reset thumbnail selection to default gradient
    selectThumbnail('gradient', 'bg-gradient-to-br from-purple-500 to-indigo-500', null);
    document.getElementById('selected-thumb-pos').value = 50;

    showToast('이미지가 제거되었습니다.', 'success');
}

function closeModal() { modal.classList.add('hidden'); }

function addChecklistItem(text = '', target = 1, itemMode = 'checkbox') {
    // itemMode: 'checkbox', 'counter', 'calendar'
    const isCounter = itemMode === 'counter';
    const isCalendar = itemMode === 'calendar';
    const isCheckbox = itemMode === 'checkbox';
    
    const row = document.createElement('div');
    row.className = 'flex gap-2 checklist-row items-center py-2 group/row border-b border-navy-muted/30 last:border-0';
    row.innerHTML = `
        <div class="flex flex-col gap-1 items-center bg-navy-dark/50 p-1 rounded-lg border border-navy-muted">
            <button type="button" onclick="setItemMode(this, 'checkbox')" class="mode-btn p-1.5 rounded-md transition-all ${isCheckbox ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}" title="일반 체크박스">
                <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" onclick="setItemMode(this, 'counter')" class="mode-btn p-1.5 rounded-md transition-all ${isCounter ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}" title="회차 카운터">
                <i data-lucide="hash" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" onclick="setItemMode(this, 'calendar')" class="mode-btn p-1.5 rounded-md transition-all ${isCalendar ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}" title="달력 기록">
                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
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
                <div class="calendar-input-container ${isCalendar ? '' : 'hidden'} flex items-center bg-navy-dark border border-navy-muted rounded-lg px-2 py-1.5">
                    <span class="text-[10px] text-gray-500 font-bold mr-2 uppercase tracking-tighter">목표</span>
                    <input type="number" min="1" value="${target}" class="calendar-target w-12 bg-transparent text-sm text-center text-white outline-none focus:text-primary-gold">
                    <span class="text-xs text-gray-500 ml-1">회/월</span>
                </div>
            </div>
        </div>
        <input type="hidden" class="item-mode" value="${itemMode}">
        <button type="button" onclick="removeChecklistItem(this)" class="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    checklistContainer.appendChild(row);
    lucide.createIcons();
}

window.setItemMode = function (btn, newMode) {
    const row = btn.closest('.checklist-row');
    const hidden = row.querySelector('.item-mode');
    const currentMode = hidden.value;

    // If clicking the same button, do nothing
    if (newMode === currentMode) return;

    hidden.value = newMode;
    const isCounter = newMode === 'counter';
    const isCalendar = newMode === 'calendar';

    // Update Buttons UI
    const btns = row.querySelectorAll('.mode-btn');
    const isCheckbox = newMode === 'checkbox';
    btns[0].className = `mode-btn p-1.5 rounded-md transition-all ${isCheckbox ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}`;
    btns[1].className = `mode-btn p-1.5 rounded-md transition-all ${isCounter ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}`;
    btns[2].className = `mode-btn p-1.5 rounded-md transition-all ${isCalendar ? 'bg-primary-gold text-navy-dark' : 'text-gray-500 hover:text-gray-300'}`;

    // Update Input Visibility
    const counterContainer = row.querySelector('.counter-input-container');
    const calendarContainer = row.querySelector('.calendar-input-container');
    counterContainer.classList.toggle('hidden', !isCounter);
    calendarContainer.classList.toggle('hidden', !isCalendar);

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
        const itemMode = row.querySelector('.item-mode').value;
        const isCounter = itemMode === 'counter';
        const isCalendar = itemMode === 'calendar';
        
        // Get target based on mode
        let target = 1;
        if (isCounter) {
            target = parseInt(row.querySelector('.counter-input-container input[type="number"]').value) || 1;
        } else if (isCalendar) {
            target = parseInt(row.querySelector('.calendar-target').value) || 1;
        }
        
        if (text) checklist.push({
            text,
            isCounter,
            isCalendar,
            itemMode,
            target,
            current: 0,
            checked: false,
            status: 'pending',
            dates: [] // 달력 모드용 날짜 기록 배열
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
    const total = projects.length;
    const avg = total > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / total) : 0;
    const completedProjects = projects.filter(p => p.progress === 100).length;
    
    // Count total in-progress items across all projects
    let totalInProgress = 0;
    projects.forEach(p => {
        const stats = getChecklistStats(p.checklist);
        totalInProgress += stats.in_progress;
    });
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-completed').innerText = completedProjects;
    document.getElementById('stat-avg').innerText = avg;
    document.getElementById('stat-chart').style.strokeDashoffset = 364.4 - (364.4 * avg) / 100;
    
    // Update in-progress stat if element exists
    const inProgressEl = document.getElementById('stat-in-progress');
    if (inProgressEl) inProgressEl.innerText = totalInProgress;
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
    const safeChecklist = project.checklist.map(i => ({ 
        ...i, 
        target: i.target || 1, 
        current: i.current !== undefined ? i.current : (i.checked ? i.target : 0), 
        isCounter: i.isCounter !== undefined ? i.isCounter : (i.target > 1),
        isCalendar: i.isCalendar || i.itemMode === 'calendar',
        status: i.status || (i.checked ? 'completed' : 'pending'),
        dates: i.dates || []
    }));
    
    const stats = getChecklistStats(project.checklist);
    
    const getStatusUI = (item, idx) => {
        const status = item.status || 'pending';
        const statusConfig = {
            pending: { icon: 'circle', color: 'text-gray-500', bg: 'bg-gray-500/20', label: '미시작' },
            in_progress: { icon: 'loader', color: 'text-blue-400', bg: 'bg-blue-500/20', label: '진행중' },
            completed: { icon: 'check-circle', color: 'text-success', bg: 'bg-success/20', label: '완료' }
        };
        const config = statusConfig[status];
        return `
            <button onclick="cycleItemStatus('${project.id}', ${idx})" 
                class="flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg} ${config.color} hover:opacity-80 transition-all min-w-[90px] justify-center">
                <i data-lucide="${config.icon}" class="w-5 h-5"></i>
                <span class="text-xs font-bold">${config.label}</span>
            </button>
        `;
    };
    
    const getCalendarUI = (item, idx) => {
        const dates = item.dates || [];
        const target = item.target || 1;
        const thisMonth = new Date();
        const monthCount = dates.filter(d => {
            const date = new Date(d);
            return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear();
        }).length;
        
        const progress = Math.round((monthCount / target) * 100);
        const isOver = monthCount >= target;
        const progressColor = isOver ? 'text-success' : 'text-blue-400';
        const bgColor = isOver ? 'bg-success/20' : 'bg-blue-500/20';
        
        return `
            <div class="flex items-center gap-2">
                <div class="flex flex-col items-end">
                    <span class="${progressColor} text-xs font-bold">${monthCount}/${target}회</span>
                    <span class="text-[10px] ${isOver ? 'text-success' : 'text-gray-500'}">${progress}%${isOver ? ' 🎉' : ''}</span>
                </div>
                <button onclick="openCalendarModal('${project.id}', ${idx})" 
                    class="flex items-center gap-1 px-3 py-2 rounded-lg ${bgColor} ${progressColor} hover:opacity-80 transition-all">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    <span class="text-xs font-bold">달력</span>
                </button>
            </div>
        `;
    };
    
    const getItemUI = (item, idx) => {
        if (item.isCalendar) return getCalendarUI(item, idx);
        if (item.isCounter) return `
            <div class="flex items-center gap-3 bg-navy-light p-1 rounded-full border border-navy-muted">
                <button onclick="updateItemProgress('${project.id}', ${idx}, -1)" class="w-8 h-8 rounded-full bg-navy-dark text-primary-gold flex items-center justify-center font-bold disabled:opacity-30"><i data-lucide="minus" class="w-4 h-4"></i></button>
                <div class="flex flex-col items-center min-w-[50px]"><span class="text-white font-mono text-xs font-bold">${item.current}/${item.target}</span><div class="w-full h-1 bg-navy-muted rounded-full overflow-hidden mt-1"><div class="h-full bg-primary-gold transition-all" style="width:${(item.current / item.target) * 100}%"></div></div></div>
                <button onclick="updateItemProgress('${project.id}', ${idx}, 1)" class="w-8 h-8 rounded-full bg-navy-dark text-primary-gold flex items-center justify-center font-bold disabled:opacity-30"><i data-lucide="plus" class="w-4 h-4"></i></button>
            </div>
        `;
        return getStatusUI(item, idx);
    };
    
    const html = `
        <div id="detail-backdrop" class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onclick="this.remove()">
            <div class="bg-navy-light w-full max-w-lg rounded-xl border border-navy-muted overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-navy-muted flex justify-between items-start">
                   <div><span class="text-xs font-bold text-primary-gold mb-1 block">${CATEGORY_LABELS[project.category]}</span><h2 class="text-2xl font-bold text-white">${project.title}</h2></div>
                   <button onclick="document.getElementById('detail-backdrop').remove()" class="text-gray-400 hover:text-white"><i data-lucide="x"></i></button>
                </div>
                <div class="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <p class="text-gray-300 text-sm mb-4">${project.description || ''}</p>
                    
                    <!-- Status Summary -->
                    <div class="flex items-center gap-4 mb-6 p-3 bg-navy-dark rounded-lg">
                        <div class="flex items-center gap-1 text-xs">
                            <span class="w-3 h-3 rounded-full bg-gray-500"></span>
                            <span class="text-gray-400">미시작 ${stats.pending}</span>
                        </div>
                        <div class="flex items-center gap-1 text-xs">
                            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                            <span class="text-blue-400">진행중 ${stats.in_progress}</span>
                        </div>
                        <div class="flex items-center gap-1 text-xs">
                            <span class="w-3 h-3 rounded-full bg-success"></span>
                            <span class="text-success">완료 ${stats.completed}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        ${safeChecklist.map((item, idx) => `
                            <div class="flex items-center justify-between p-4 rounded-xl bg-navy-dark border border-navy-muted gap-3">
                                <span class="${item.status === 'completed' ? 'text-gray-500 line-through' : item.status === 'in_progress' ? 'text-blue-300' : 'text-gray-200'} flex-1 text-sm font-medium">${item.text}</span>
                                ${getItemUI(item, idx)}
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

// Calendar Modal for date tracking
let calendarState = { projectId: null, itemIdx: null, currentMonth: new Date() };

window.openCalendarModal = function(projectId, itemIdx) {
    calendarState = { projectId, itemIdx, currentMonth: new Date() };
    renderCalendarModal();
}

function renderCalendarModal() {
    const { projectId, itemIdx, currentMonth } = calendarState;
    const project = projects.find(p => p.id === projectId);
    const item = project.checklist[itemIdx];
    const dates = item.dates || [];
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    
    // Get first day and total days of month
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Count this month's records
    const monthDates = dates.filter(d => {
        const date = new Date(d);
        return date.getMonth() === month && date.getFullYear() === year;
    });
    
    // Generate calendar grid
    let calendarHTML = '';
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    // Day headers
    calendarHTML += '<div class="grid grid-cols-7 gap-1 mb-2">';
    dayNames.forEach((day, i) => {
        const color = i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400';
        calendarHTML += `<div class="text-center text-xs font-bold ${color} py-1">${day}</div>`;
    });
    calendarHTML += '</div>';
    
    // Calendar days
    calendarHTML += '<div class="grid grid-cols-7 gap-1">';
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div></div>';
    }
    
    // Days
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isMarked = dates.includes(dateStr);
        const isToday = dateStr === todayStr;
        const isFuture = new Date(dateStr) > today;
        const dayOfWeek = new Date(year, month, day).getDay();
        const isSunday = dayOfWeek === 0;
        const isSaturday = dayOfWeek === 6;
        
        let classes = 'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer ';
        if (isFuture) {
            classes += 'text-gray-600 cursor-not-allowed';
        } else if (isMarked) {
            classes += 'bg-success text-white shadow-lg shadow-success/30';
        } else if (isToday) {
            classes += 'bg-primary-gold/20 text-primary-gold border border-primary-gold';
        } else if (isSunday) {
            classes += 'text-red-400 hover:bg-red-500/20';
        } else if (isSaturday) {
            classes += 'text-blue-400 hover:bg-blue-500/20';
        } else {
            classes += 'text-gray-300 hover:bg-navy-muted';
        }
        
        calendarHTML += `<button ${isFuture ? 'disabled' : ''} onclick="toggleCalendarDate('${dateStr}')" class="${classes}">${day}</button>`;
    }
    calendarHTML += '</div>';
    
    // Remove existing calendar modal
    const existing = document.getElementById('calendar-modal');
    if (existing) existing.remove();
    
    const html = `
        <div id="calendar-modal" class="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onclick="this.remove()">
            <div class="bg-navy-light w-full max-w-md rounded-xl border border-navy-muted overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="p-4 border-b border-navy-muted">
                    <div class="flex items-center justify-between mb-2">
                        <button onclick="changeCalendarMonth(-1)" class="p-2 rounded-lg hover:bg-navy-muted text-gray-400 hover:text-white transition-colors">
                            <i data-lucide="chevron-left" class="w-5 h-5"></i>
                        </button>
                        <h3 class="text-lg font-bold text-white">${year}년 ${monthNames[month]}</h3>
                        <button onclick="changeCalendarMonth(1)" class="p-2 rounded-lg hover:bg-navy-muted text-gray-400 hover:text-white transition-colors">
                            <i data-lucide="chevron-right" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <p class="text-center text-sm text-gray-400">${item.text}</p>
                </div>
                
                <!-- Calendar -->
                <div class="p-4">
                    ${calendarHTML}
                </div>
                
                <!-- Stats -->
                <div class="p-4 bg-navy-dark border-t border-navy-muted">
                    <div class="flex items-center justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs text-gray-400">이번달 목표</span>
                                <span class="text-sm font-bold ${monthDates.length >= (item.target || 1) ? 'text-success' : 'text-white'}">${monthDates.length} / ${item.target || 1}회</span>
                            </div>
                            <div class="w-full h-3 bg-navy-muted rounded-full overflow-hidden">
                                <div class="h-full ${monthDates.length >= (item.target || 1) ? 'bg-success' : 'bg-primary-gold'} transition-all" style="width: ${Math.min(100, Math.round((monthDates.length / (item.target || 1)) * 100))}%"></div>
                            </div>
                            <div class="flex justify-between mt-1">
                                <span class="text-xs text-gray-500">전체 ${dates.length}회</span>
                                <span class="text-xs font-bold ${monthDates.length >= (item.target || 1) ? 'text-success' : 'text-primary-gold'}">${Math.round((monthDates.length / (item.target || 1)) * 100)}%${monthDates.length >= (item.target || 1) ? ' 🎉' : ''}</span>
                            </div>
                        </div>
                        <button onclick="document.getElementById('calendar-modal').remove()" 
                            class="px-4 py-2 bg-primary-gold text-navy-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors whitespace-nowrap">
                            완료
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    lucide.createIcons();
}

window.changeCalendarMonth = function(delta) {
    calendarState.currentMonth.setMonth(calendarState.currentMonth.getMonth() + delta);
    renderCalendarModal();
}

window.toggleCalendarDate = async function(dateStr) {
    const { projectId, itemIdx } = calendarState;
    const project = projects.find(p => p.id === projectId);
    const item = project.checklist[itemIdx];
    
    if (!item.dates) item.dates = [];
    
    const index = item.dates.indexOf(dateStr);
    if (index > -1) {
        item.dates.splice(index, 1);
        SoundManager.playClick();
    } else {
        item.dates.push(dateStr);
        item.dates.sort();
        SoundManager.playSuccess();
    }
    
    // Update status based on dates count
    if (item.dates.length > 0) {
        item.status = 'in_progress';
        item.current = item.dates.length;
    } else {
        item.status = 'pending';
        item.current = 0;
    }
    
    project.progress = calculateProgress(project.checklist);
    await saveToStorage();
    renderProjects();
    renderCalendarModal();
    
    // Update detail modal if open
    const detailBackdrop = document.getElementById('detail-backdrop');
    if (detailBackdrop) {
        detailBackdrop.remove();
        showDetailModal(project);
    }
}

// Cycle through status: pending -> in_progress -> completed -> pending
window.cycleItemStatus = async function(id, idx) {
    const p = projects.find(x => x.id === id);
    const item = p.checklist[idx];
    const was = p.progress === 100;
    
    const statusOrder = ['pending', 'in_progress', 'completed'];
    const currentStatus = item.status || 'pending';
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    
    item.status = statusOrder[nextIndex];
    item.checked = item.status === 'completed';
    item.current = item.status === 'completed' ? (item.target || 1) : (item.status === 'in_progress' ? 0.5 : 0);
    
    p.progress = calculateProgress(p.checklist);
    await saveToStorage();
    renderProjects();
    
    const bd = document.getElementById('detail-backdrop');
    if (bd) { bd.remove(); showDetailModal(p); }
    
    SoundManager.playClick();
    if (p.progress === 100 && !was) { 
        SoundManager.playComplete(); 
        triggerConfetti(); 
        showToast('완수했습니다! 🏆', 'success'); 
    }
}

window.updateItemProgress = async function (id, idx, action) {
    const p = projects.find(x => x.id === id), item = p.checklist[idx], was = p.progress === 100;
    if (action === 'toggle') {
        // Legacy toggle for counter items
        item.current = item.current >= item.target ? 0 : item.target;
    } else if (item.current + action >= 0 && item.current + action <= item.target) {
        item.current += action;
    }
    item.checked = item.current >= item.target;
    
    // Update status based on current for counter items
    if (item.isCounter) {
        if (item.current >= item.target) item.status = 'completed';
        else if (item.current > 0) item.status = 'in_progress';
        else item.status = 'pending';
    }
    
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

// Supabase Configuration
const supabaseUrl = 'https://bcrbxmzddugewnmledbl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmJ4bXpkZHVnZXdubWxlZGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTg3NjEsImV4cCI6MjA4Mjk5NDc2MX0.Vrkb1bXeidPZUNLPSiRyap2XUNkAwoiACqUHLvOAxiA';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
const SUPABASE_BUCKET = 'project-thumbnails';

// Upload Method Toggle
window.setUploadMethod = function(method) {
    const fileTab = document.getElementById('upload-tab-file');
    const urlTab = document.getElementById('upload-tab-url');
    const fileSection = document.getElementById('upload-method-file');
    const urlSection = document.getElementById('upload-method-url');
    
    if (method === 'file') {
        fileTab.className = 'flex-1 py-2 px-3 rounded-md text-sm font-bold bg-primary-gold text-navy-dark transition-all';
        urlTab.className = 'flex-1 py-2 px-3 rounded-md text-sm font-medium text-gray-400 hover:text-white transition-all';
        fileSection.classList.remove('hidden');
        urlSection.classList.add('hidden');
    } else {
        urlTab.className = 'flex-1 py-2 px-3 rounded-md text-sm font-bold bg-primary-gold text-navy-dark transition-all';
        fileTab.className = 'flex-1 py-2 px-3 rounded-md text-sm font-medium text-gray-400 hover:text-white transition-all';
        urlSection.classList.remove('hidden');
        fileSection.classList.add('hidden');
    }
    lucide.createIcons();
}

// Supabase Storage Upload
async function uploadToSupabase(file) {
    if (!file) return null;
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('파일 크기는 5MB 이하여야 합니다.', 'error');
        return null;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.', 'error');
        return null;
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const fileName = `thumb_${timestamp}_${randomStr}.${ext}`;
    
    try {
        const { data, error } = await supabaseClient.storage
            .from(SUPABASE_BUCKET)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Supabase upload error:', error);
            showToast('업로드 실패: ' + error.message, 'error');
            return null;
        }
        
        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
    } catch (err) {
        console.error('Upload exception:', err);
        showToast('업로드 중 오류가 발생했습니다.', 'error');
        return null;
    }
}

// File Upload Handler
window.handleFileUpload = async function(input) {
    const file = input.files[0];
    if (!file) return;
    
    const uploadPrompt = document.getElementById('upload-prompt');
    const uploadLoading = document.getElementById('upload-loading');
    const previewContainer = document.getElementById('url-preview-container');
    const previewImg = document.getElementById('url-preview-img');
    const dragHint = document.getElementById('drag-hint');
    
    // Show loading state
    if (uploadPrompt) uploadPrompt.classList.add('hidden');
    if (uploadLoading) uploadLoading.classList.remove('hidden');
    
    try {
        const imageUrl = await uploadToSupabase(file);
        
        if (imageUrl) {
            // Show preview
            if (previewImg) {
                previewImg.src = imageUrl;
                previewImg.style.objectPosition = 'center 50%';
                document.getElementById('selected-thumb-pos').value = 50;
                
                previewImg.onload = () => {
                    if (previewContainer) previewContainer.classList.remove('hidden');
                    if (dragHint) dragHint.classList.remove('hidden');
                    selectThumbnail('image', imageUrl, null);
                    showToast('이미지가 업로드되었습니다!', 'success');
                    lucide.createIcons();
                    // Initialize thumbnail dragger for position adjustment
                    setTimeout(() => initThumbnailDragger(), 100);
                };
            }
        }
    } finally {
        // Reset loading state
        if (uploadLoading) uploadLoading.classList.add('hidden');
        if (uploadPrompt) uploadPrompt.classList.remove('hidden');
        // Reset file input
        input.value = '';
    }
}

// Drag & Drop Support
function initDragDrop() {
    const dropZone = document.getElementById('file-drop-zone');
    if (!dropZone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-primary-gold', 'bg-primary-gold/10');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-primary-gold', 'bg-primary-gold/10');
        });
    });
    
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('thumb-file-input');
            fileInput.files = files;
            handleFileUpload(fileInput);
        }
    });
}

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

    if (!authBtn) return;

    if (user) {
        authBtn.innerText = '로그아웃';
        if (userInfo) userInfo.classList.remove('hidden');
        if (userPhoto) {
            userPhoto.src = user.photoURL;
            userPhoto.title = user.displayName; // 마우스 오버 시 이름 표시
        }
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
