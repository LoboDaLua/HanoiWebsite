import * as state from './state.js';
import * as audio from './audio.js';
import * as ui from './ui.js';
import * as settings from './settings.js';

// --- Timer ---
function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.setTimerInterval(setInterval(() => {
        state.setSeconds(state.seconds + 1);
        const mins = Math.floor(state.seconds / 60).toString().padStart(2, '0');
        const secs = (state.seconds % 60).toString().padStart(2, '0');
        ui.setTimerDisplay(mins, secs);
    }, 1000));
}

function stopTimer() { clearInterval(state.timerInterval); }

// --- Game Initialization ---
export function initGame() {
    state.resetState(); // Reset state variables
    stopTimer();
    ui.setTimerDisplay('00', '00');
    ui.gameArea.innerHTML = '';
    ui.setGameStateLabel('Select a source tower.'); // Initial message

    // Clear any lingering selection
    clearTowerSelection();

    // Create towers
    const newTowers = [];
    for (let i = 0; i < state.numTowers; i++) {
        const towerEl = document.createElement('div');
        towerEl.classList.add('tower');
        towerEl.dataset.towerId = i;
        towerEl.tabIndex = 0; // Make towers focusable for accessibility
        ui.gameArea.appendChild(towerEl);
        newTowers.push([]);
    }
    state.setTowers(newTowers); // Update state

    // Create disks on the first tower
    const firstTowerEl = ui.gameArea.querySelector('.tower');
    for (let i = state.numDisks; i > 0; i--) {
        const diskEl = document.createElement('div');
        const width = 30 + (i * (150 / state.numDisks));
        diskEl.classList.add('disk');
        diskEl.dataset.diskId = i;
        diskEl.style.width = `${width}px`;
        diskEl.style.backgroundColor = `hsl(${(i * 360 / state.numDisks)}, 70%, 50%)`;
        // No drag events needed for unified scheme

        const numberSpan = document.createElement('span');
        numberSpan.classList.add('disk-number');
        numberSpan.textContent = i;
        diskEl.appendChild(numberSpan);

        firstTowerEl.appendChild(diskEl);
        state.towers[0].push(i);
    }

    ui.updateUI(state.numDisks, state.numTowers, state.moves);
    addTowerClickListeners();
}



// --- Unified Tower-to-Tower Control Logic ---
let selectedSourceTower = null;

function clearTowerSelection() {
    document.querySelectorAll('.tower').forEach(tower => {
        tower.classList.remove('selected-tower', 'move-preview-valid', 'move-preview-invalid');
    });
    selectedSourceTower = null;
}

function handleTowerSelect(towerIndex) {
    if (selectedSourceTower === null) {
        // Select source tower
        if (state.towers[towerIndex].length === 0) {
            ui.setGameStateLabel(`Tower ${towerIndex + 1} is empty.`);
            audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
            return;
        }
        selectedSourceTower = towerIndex;
        document.querySelector(`.tower[data-tower-id='${towerIndex}']`).classList.add('selected-tower');
        updateTopDiskClasses();
        ui.setGameStateLabel(`Selected Tower ${towerIndex + 1} as source.`);
        audio.playSound(() => audio.popSound.triggerAttackRelease('C4', '8n'));
    } else {
        // Select destination tower and attempt move
        const fromId = selectedSourceTower;
        const toId = towerIndex;
        if (fromId === toId) {
            ui.setGameStateLabel('Cannot move to the same tower.');
            audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
            clearTowerSelection();
            return;
        }
        const diskToMove = state.towers[fromId][state.towers[fromId].length - 1];
        const topDiskOnTarget = state.towers[toId][state.towers[toId].length - 1];
        if (state.towers[toId].length === 0 || diskToMove < topDiskOnTarget) {
            // Valid move
            audio.playSound(() => audio.popSound.triggerAttackRelease('G3', '8n'));
            if (!state.timerStarted) {
                startTimer();
                state.setTimerStarted(true);
            }
            state.towers[fromId].pop();
            state.towers[toId].push(diskToMove);
            // Move DOM element
            const diskEl = document.querySelector(`.tower[data-tower-id='${fromId}']`).lastChild;
            document.querySelector(`.tower[data-tower-id='${toId}']`).appendChild(diskEl);
            state.setMoves(state.moves + 1);
            ui.updateUI(state.numDisks, state.numTowers, state.moves);
            checkWinCondition();
            ui.setGameStateLabel(`Moved disk from Tower ${fromId + 1} to Tower ${toId + 1}.`);
        } else {
            ui.setGameStateLabel(`Invalid move to Tower ${toId + 1}.`);
            audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
        }
        clearTowerSelection();
        updateTopDiskClasses();
        settings.saveSettings();
    }
}

function addTowerClickListeners() {
    document.querySelectorAll('.tower').forEach(tower => {
        const towerIndex = parseInt(tower.dataset.towerId);

        tower.addEventListener('click', () => {
            handleTowerSelect(towerIndex);
        });

        // Mouse hover feedback
        tower.addEventListener('mouseenter', () => {
            if (selectedSourceTower === null) {
                tower.classList.add('hovered');
            } else if (selectedSourceTower !== null && selectedSourceTower !== towerIndex) {
                // Move preview state
                tower.classList.remove('hovered');
                if (isValidMove(selectedSourceTower, towerIndex)) {
                    tower.classList.add('move-preview-valid');
                    tower.classList.remove('move-preview-invalid');
                } else {
                    tower.classList.add('move-preview-invalid');
                    tower.classList.remove('move-preview-valid');
                    // Intentionally no sound for invalid move preview to avoid audio spam
                }
            }
        });

        tower.addEventListener('mouseleave', () => {
            tower.classList.remove('hovered', 'move-preview-valid', 'move-preview-invalid');
        });
    });
}

function isValidMove(fromId, toId) {
    if (fromId === toId) return false;
    const diskToMove = state.towers[fromId][state.towers[fromId].length - 1];
    const topDiskOnTarget = state.towers[toId][state.towers[toId].length - 1];
    return state.towers[toId].length === 0 || diskToMove < topDiskOnTarget;
}

// --- Win Condition ---
function checkWinCondition() {
    for (let i = 1; i < state.numTowers; i++) {
        if (state.towers[i].length === state.numDisks) {
            stopTimer();
            audio.playSound(() => {
                const now = Tone.now();
                audio.winSynth.triggerAttackRelease("C5", "8n", now);
                audio.winSynth.triggerAttackRelease("E5", "8n", now + 0.2);
                audio.winSynth.triggerAttackRelease("G5", "8n", now + 0.4);
                audio.winSynth.triggerAttackRelease("C6", "4n", now + 0.6);
            });
            ui.winMessageEl.style.display = 'flex';
            settings.saveSettings(); // Save settings on win
            ui.setGameStateLabel('You Win!'); // Update game state label
            return;
        }
    }
    // If not a win, prompt for next move
    if (selectedSourceTower === null) {
        ui.setGameStateLabel('Select a source tower.');
    } else {
        ui.setGameStateLabel('Select a destination tower.');
    }
}

// --- Keyboard Controls ---
function handleKeyPress(e) {
    const key = parseInt(e.key);
    // Only handle number keys corresponding to towers
    if (isNaN(key) || key < 1 || key > state.numTowers) return;
    const towerIndex = key - 1;
    handleTowerSelect(towerIndex);
}

function updateTopDiskClasses() {
    document.querySelectorAll('.tower').forEach(tower => {
        const disks = tower.querySelectorAll('.disk');
        disks.forEach(disk => disk.classList.remove('top-disk'));
        if (disks.length > 0) {
            disks[disks.length - 1].classList.add('top-disk');
        }
    });
}



// No drag and drop listeners needed for unified scheme

export function resetGameAndCloseMenus() {
    document.body.classList.remove('menu-open');
    ui.winMessageEl.style.display = 'none';
    initGame();
    settings.saveSettings(); // Save settings after reset
}

// Export input handler to be attached in main.js
export { handleKeyPress };