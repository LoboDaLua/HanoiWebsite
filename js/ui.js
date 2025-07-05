// DOM Elements
export const gameArea = document.getElementById('game-area');
export const movesCountEl = document.getElementById('moves-count');
export const minMovesEl = document.getElementById('min-moves');
export const timerEl = document.getElementById('timer');
export const winMessageEl = document.getElementById('win-message');
export const menuToggle = document.getElementById('menu-toggle');
export const gameStateLabel = document.getElementById('game-state-label'); // Added

// Settings & Control Elements (Exported for settings.js)
export const diskCountInput = document.getElementById('disk-count');
export const towerCountInput = document.getElementById('tower-count');
export const diskCountValue = document.getElementById('disk-count-value');
export const towerCountValue = document.getElementById('tower-count-value');
export const resetButton = document.getElementById('reset-btn');
export const quickResetBtn = document.getElementById('quick-reset-btn');
export const darkModeToggle = document.getElementById('dark-mode-toggle');
export const showNumbersToggle = document.getElementById('show-numbers-toggle');
// Removed hoverNumbersToggle and hoverSetting
export const soundToggle = document.getElementById('sound-toggle');
export const volumeControl = document.getElementById('volume-control');
export const volumeValue = document.getElementById('volume-value');
export const volumeSetting = document.getElementById('volume-setting');

// UI Update Functions
export function updateUI(numDisks, numTowers, moves) {
    movesCountEl.textContent = moves;
    minMovesEl.textContent = calculateMinMoves(numDisks, numTowers);
}

export function calculateMinMoves(disks, towers) {
    if (towers === 3) return Math.pow(2, disks) - 1;
    return (towers > 3) ? 'N/A' : Math.pow(2, disks) - 1;
}

export function setGameStateLabel(msg) {
    if (gameStateLabel) gameStateLabel.textContent = msg || '';
}


export function applyTheme(isDark) {
    document.body.dataset.theme = isDark ? 'dark' : 'light';
}

export function applyNumberDisplaySetting(showNumbers) {


    document.body.classList.toggle('numbers-hidden', !showNumbers);
}

export function setInitialSliderValues(diskCount, towerCount) {
    diskCountValue.textContent = diskCount;
    towerCountValue.textContent = towerCount;
}

export function setTimerDisplay(mins, secs) {
    timerEl.textContent = `${mins}:${secs}`;
}