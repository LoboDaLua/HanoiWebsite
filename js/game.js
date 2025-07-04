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
    // Removed hideTooltip()
    ui.setGameStateLabel('Make a move to start the game.'); // Initial message

    // Clear any lingering keyboard selection
    if (state.selectedDiskByKey) {
        state.selectedDiskByKey.element.classList.remove('selected-by-key');
        state.setSelectedDiskByKey(null);
    }

    // Create towers
    const newTowers = [];
    for (let i = 0; i < state.numTowers; i++) {
        const towerEl = document.createElement('div');
        towerEl.classList.add('tower');
        towerEl.dataset.towerId = i;
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
        diskEl.draggable = true;

        const numberSpan = document.createElement('span');
        numberSpan.classList.add('disk-number');
        numberSpan.textContent = i;
        diskEl.appendChild(numberSpan);

        firstTowerEl.appendChild(diskEl);
        state.towers[0].push(i);
    }

    ui.updateUI(state.numDisks, state.numTowers, state.moves);
    addDragDropListeners(); // Re-add listeners after game area is cleared and rebuilt
}


// --- Drag and Drop Logic ---
function handleDragStart(e) {
    const towerEl = e.target.parentElement;
    if (e.target === towerEl.lastChild) {
        audio.playSound(() => audio.popSound.triggerAttackRelease('C4', '8n'));
        state.setDraggedDisk({ id: parseInt(e.target.dataset.diskId), element: e.target });
        state.setSourceTower({ id: parseInt(towerEl.dataset.towerId), element: towerEl });
        setTimeout(() => e.target.classList.add('dragging'), 0);
        ui.setGameStateLabel(`Dragging disk ${state.draggedDisk.id} from Tower ${state.sourceTower.id + 1}.`); // Update label on drag start
    } else {
        e.preventDefault();
        ui.setGameStateLabel('Only the top disk can be moved.'); // Update label for invalid drag start
    }
}

function handleDragEnd(e) {
    if(state.draggedDisk) state.draggedDisk.element.classList.remove('dragging');
    state.setDraggedDisk(null);
    state.setSourceTower(null);
    // Label updated on drop or invalid drop
}

function handleDragOver(e) { e.preventDefault(); }

function handleDrop(e) {
    e.preventDefault();
    if (!state.draggedDisk) return;
    const targetTowerEl = e.target.closest('.tower');
    if (!targetTowerEl) {
        ui.setGameStateLabel('Invalid drop location.'); // Update label for dropping outside towers
        audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
        return;
    }
    const targetTowerId = parseInt(targetTowerEl.dataset.towerId);

    if (isValidMove(state.sourceTower.id, targetTowerId)) {
        audio.playSound(() => audio.popSound.triggerAttackRelease('G3', '8n'));
        if (!state.timerStarted) {
            startTimer();
            state.setTimerStarted(true);
        }
        state.towers[state.sourceTower.id].pop();
        state.towers[targetTowerId].push(state.draggedDisk.id);
        targetTowerEl.appendChild(state.draggedDisk.element);
        state.setMoves(state.moves + 1);
        ui.updateUI(state.numDisks, state.numTowers, state.moves);
        checkWinCondition();
        ui.setGameStateLabel(`Moved disk ${state.draggedDisk.id} from Tower ${state.sourceTower.id + 1} to Tower ${targetTowerId + 1}.`); // Update label on successful drop
    } else {
         ui.setGameStateLabel(`Invalid move to Tower ${targetTowerId + 1}.`); // Update label for invalid drop
         audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
    }
    // Removed settings.saveSettings() here to avoid unnecessary saves on every move
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
     // If not a win, set label back to waiting for selection if no disk is selected
     if (!state.selectedDiskByKey) {
         ui.setGameStateLabel('Waiting for selection.');
     }
}

// --- Keyboard Controls ---
function handleKeyPress(e) {
    const key = parseInt(e.key);
    // Only handle number keys corresponding to towers
    if (isNaN(key) || key < 1 || key > state.numTowers) return;

    const towerIndex = key - 1;

    if (state.selectedDiskByKey) {
        // --- Try to place the disk ---
        const sourceTowerId = state.selectedDiskByKey.sourceTowerId;

        if (isValidMove(sourceTowerId, towerIndex)) {
            ui.setGameStateLabel(`Moved disk from Tower ${sourceTowerId + 1} to Tower ${towerIndex + 1}.`); // Update game state label
            audio.playSound(() => audio.popSound.triggerAttackRelease('G3', '8n'));
            if (!state.timerStarted) {
                startTimer();
                state.setTimerStarted(true);
            }

            // Move data
            state.towers[sourceTowerId].pop();
            state.towers[towerIndex].push(state.selectedDiskByKey.id);

            // Move DOM element
            const targetTowerEl = document.querySelector(`.tower[data-tower-id='${towerIndex}']`);
            targetTowerEl.appendChild(state.selectedDiskByKey.element);

            state.setMoves(state.moves + 1);
            ui.updateUI(state.numDisks, state.numTowers, state.moves);
            checkWinCondition(); // checkWinCondition will update label if win or waiting
        } else {
            ui.setGameStateLabel(`Invalid move to Tower ${towerIndex + 1}.`); // Update game state label
            audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
             // Keep disk selected on invalid move via keyboard
             return; // Don't deselect on invalid keyboard move
        }

        // Deselect disk on successful move via keyboard
        state.selectedDiskByKey.element.classList.remove('selected-by-key');
        state.setSelectedDiskByKey(null);
        settings.saveSettings(); // Save settings after a keyboard move

    } else {
        // --- Try to pick up a disk ---
        if (state.towers[towerIndex].length > 0) {
            ui.setGameStateLabel(`Selected disk from Tower ${towerIndex + 1}.`); // Update game state label
            audio.playSound(() => audio.popSound.triggerAttackRelease('C4', '8n'));
            const sourceTowerEl = document.querySelector(`.tower[data-tower-id='${towerIndex}']`);
            const diskEl = sourceTowerEl.lastChild;
            const diskId = parseInt(diskEl.dataset.diskId);

            state.setSelectedDiskByKey({
                id: diskId,
                element: diskEl,
                sourceTowerId: towerIndex
            });

            diskEl.classList.add('selected-by-key');
        } else {
             ui.setGameStateLabel(`Tower ${towerIndex + 1} is empty.`); // Update game state label
             audio.playSound(() => audio.errorSound.triggerAttackRelease('A2', '16n'));
        }
    }
}


// --- Event Listeners ---
function addDragDropListeners() {
    // Remove existing listeners to prevent duplicates when initGame is called
    document.querySelectorAll('.disk').forEach(disk => {
        disk.removeEventListener('dragstart', handleDragStart);
        disk.removeEventListener('dragend', handleDragEnd);
    });
     document.querySelectorAll('.tower').forEach(tower => {
        tower.removeEventListener('dragover', handleDragOver);
        tower.removeEventListener('drop', handleDrop);
    });

    // Add new listeners
    document.querySelectorAll('.disk').forEach(disk => {
        disk.addEventListener('dragstart', handleDragStart);
        disk.addEventListener('dragend', handleDragEnd);
    });
    document.querySelectorAll('.tower').forEach(tower => {
        tower.addEventListener('dragover', handleDragOver);
        tower.addEventListener('drop', handleDrop);
    });
}

export function resetGameAndCloseMenus() {
    document.body.classList.remove('menu-open');
    ui.winMessageEl.style.display = 'none';
    initGame();
    settings.saveSettings(); // Save settings after reset
}

// Export input handler to be attached in main.js
export { handleKeyPress };