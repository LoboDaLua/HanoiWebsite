document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let numDisks = 4;
    let numTowers = 3;
    let moves = 0;
    let timerInterval;
    let seconds = 0;
    let timerStarted = false;
    let towers = [];
    let draggedDisk = null;
    let sourceTower = null;
    let soundEnabled = true;
    let selectedDiskByKey = null; // For keyboard controls
    let tooltipTimeout;
    let tooltipsEnabled = true; // New state variable for tooltips

    // DOM Elements
    const gameArea = document.getElementById('game-area');
    const movesCountEl = document.getElementById('moves-count');
    const minMovesEl = document.getElementById('min-moves');
    const timerEl = document.getElementById('timer');
    const winMessageEl = document.getElementById('win-message');
    const menuToggle = document.getElementById('menu-toggle');
    const tooltipEl = document.getElementById('tooltip');

    // Settings & Control Elements
    const diskCountInput = document.getElementById('disk-count');
    const towerCountInput = document.getElementById('tower-count');
    const diskCountValue = document.getElementById('disk-count-value');
    const towerCountValue = document.getElementById('tower-count-value');
    const resetButton = document.getElementById('reset-btn');
    const quickResetBtn = document.getElementById('quick-reset-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const showNumbersToggle = document.getElementById('show-numbers-toggle');
    const hoverNumbersToggle = document.getElementById('hover-numbers-toggle');
    const hoverSetting = document.getElementById('hover-setting');
    const soundToggle = document.getElementById('sound-toggle');
    const volumeControl = document.getElementById('volume-control');
    const volumeValue = document.getElementById('volume-value');
    const volumeSetting = document.getElementById('volume-setting');
    const tooltipToggle = document.getElementById('tooltip-toggle'); // Added

    // --- Cookie Functions --- // Added
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // --- Settings Saving/Loading --- // Added
    function saveSettings() {
        const settings = {
            soundEnabled: soundToggle.checked,
            volume: parseInt(volumeControl.value),
            darkMode: darkModeToggle.checked,
            showNumbers: showNumbersToggle.checked,
            hoverNumbers: hoverNumbersToggle.checked,
            tooltipsEnabled: tooltipToggle.checked, // Save new setting
            numDisks: parseInt(diskCountInput.value),
            numTowers: parseInt(towerCountInput.value)
        };
        setCookie("hanoiSettings", JSON.stringify(settings), 365); // Save for 1 year
    }

    function loadSettings() {
        const settingsCookie = getCookie("hanoiSettings");
        if (settingsCookie) {
            try {
                const settings = JSON.parse(settingsCookie);

                // Apply settings, falling back to defaults if not found in cookie
                soundToggle.checked = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
                volumeControl.value = settings.volume !== undefined ? settings.volume : 75;
                darkModeToggle.checked = settings.darkMode !== undefined ? settings.darkMode : false;
                showNumbersToggle.checked = settings.showNumbers !== undefined ? settings.showNumbers : false;
                hoverNumbersToggle.checked = settings.hoverNumbers !== undefined ? settings.hoverNumbers : false;
                tooltipToggle.checked = settings.tooltipsEnabled !== undefined ? settings.tooltipsEnabled : true; // Load new setting

                // Update state variables based on loaded settings
                soundEnabled = soundToggle.checked;
                tooltipsEnabled = tooltipToggle.checked; // Update state variable

                // Apply appearance settings immediately
                applyTheme(darkModeToggle.checked);
                setInitialSoundState(); // This also applies volume and shows/hides volume setting
                applyNumberDisplaySetting(showNumbersToggle.checked); // Apply show/hover numbers setting

                // Update game setup inputs, but don't reset game yet
                diskCountInput.value = settings.numDisks !== undefined ? settings.numDisks : 4;
                towerCountInput.value = settings.numTowers !== undefined ? settings.numTowers : 3;
                setInitialSliderValues(); // Update slider value displays

                // Game will be initialized with these values by initGame() later
                numDisks = parseInt(diskCountInput.value);
                numTowers = parseInt(towerCountInput.value);


            } catch (e) {
                console.error("Failed to parse settings cookie:", e);
                // Optionally, erase the corrupted cookie
                // eraseCookie("hanoiSettings");
            }
        } else {
             // No cookie found, apply default settings (which are already in HTML/variables)
             applyTheme(darkModeToggle.checked); // Apply default dark mode based on HTML
             setInitialSoundState(); // Apply default sound/volume based on HTML
             applyNumberDisplaySetting(showNumbersToggle.checked); // Apply default number display based on HTML
             setInitialSliderValues(); // Update slider value displays for defaults
             // numDisks and numTowers already have default values (4 and 3)
        }
    }

    // Helper to apply number display settings // Added
    function applyNumberDisplaySetting(showNumbers) {
         document.body.classList.toggle('numbers-hidden', !showNumbers);
         hoverSetting.style.display = showNumbers ? 'flex' : 'none';
         if (!showNumbers) {
             hoverNumbersToggle.checked = false;
             document.body.classList.remove('numbers-on-hover');
         } else {
             document.body.classList.toggle('numbers-on-hover', hoverNumbersToggle.checked);
         }
    }


    // --- Audio Setup (Tone.js) ---
    let popSound, winSynth, errorSound, masterVolume;

    function setupSounds() {
        masterVolume = new Tone.Volume(0).toDestination();

        popSound = new Tone.MembraneSynth({
            pitchDecay: 0.01,
            octaves: 2,
            envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.01 }
        }).connect(masterVolume);

        winSynth = new Tone.Synth({
            oscillator: { type: 'triangle8' },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 }
        }).connect(masterVolume);

        errorSound = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
        }).connect(masterVolume);
    }

    // --- Sound Player Helper ---
    async function playSound(soundFunction) {
        if (masterVolume.mute) return;
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        soundFunction();
    }

    // --- Game Initialization ---
    function initGame() {
        moves = 0;
        seconds = 0;
        towers = [];
        timerStarted = false;
        stopTimer();
        timerEl.textContent = '00:00';
        gameArea.innerHTML = '';
        hideTooltip();

        // Clear any lingering keyboard selection
        if (selectedDiskByKey) {
            selectedDiskByKey.element.classList.remove('selected-by-key');
            selectedDiskByKey = null;
        }

        for (let i = 0; i < numTowers; i++) {
            const towerEl = document.createElement('div');
            towerEl.classList.add('tower');
            towerEl.dataset.towerId = i;
            gameArea.appendChild(towerEl);
            towers.push([]);
        }

        const firstTowerEl = gameArea.querySelector('.tower');
        for (let i = numDisks; i > 0; i--) {
            const diskEl = document.createElement('div');
            const width = 30 + (i * (150 / numDisks));
            diskEl.classList.add('disk');
            diskEl.dataset.diskId = i;
            diskEl.style.width = `${width}px`;
            diskEl.style.backgroundColor = `hsl(${(i * 360 / numDisks)}, 70%, 50%)`;
            diskEl.draggable = true;

            const numberSpan = document.createElement('span');
            numberSpan.classList.add('disk-number');
            numberSpan.textContent = i;
            diskEl.appendChild(numberSpan);

            firstTowerEl.appendChild(diskEl);
            towers[0].push(i);
        }

        updateUI();
        addDragDropListeners();
    }

    // --- UI Updates ---
    function updateUI() {
        movesCountEl.textContent = moves;
        minMovesEl.textContent = calculateMinMoves(numDisks, numTowers);
    }

    function calculateMinMoves(disks, towers) {
        if (towers === 3) return Math.pow(2, disks) - 1;
        return (towers > 3) ? 'N/A' : Math.pow(2, disks) - 1;
    }

    function showTooltip(message) {
        if (!tooltipsEnabled) return; // Check if tooltips are enabled
        clearTimeout(tooltipTimeout);
        tooltipEl.textContent = message;
        tooltipEl.classList.add('visible');
        tooltipTimeout = setTimeout(hideTooltip, 3000);
    }

    function hideTooltip() {
        tooltipEl.classList.remove('visible');
    }

    // --- Timer ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function stopTimer() { clearInterval(timerInterval); }

    // --- Drag and Drop Logic ---
    function handleDragStart(e) {
        const towerEl = e.target.parentElement;
        if (e.target === towerEl.lastChild) {
            playSound(() => popSound.triggerAttackRelease('C4', '8n'));
            draggedDisk = { id: parseInt(e.target.dataset.diskId), element: e.target };
            sourceTower = { id: parseInt(towerEl.dataset.towerId), element: towerEl };
            setTimeout(() => e.target.classList.add('dragging'), 0);
        } else {
            e.preventDefault();
        }
    }

    function handleDragEnd(e) {
        if (draggedDisk) draggedDisk.element.classList.remove('dragging');
        draggedDisk = null;
        sourceTower = null;
    }

    function handleDragOver(e) { e.preventDefault(); }

    function handleDrop(e) {
        e.preventDefault();
        if (!draggedDisk) return;
        const targetTowerEl = e.target.closest('.tower');
        if (!targetTowerEl) return;
        const targetTowerId = parseInt(targetTowerEl.dataset.towerId);

        if (isValidMove(sourceTower.id, targetTowerId)) {
            playSound(() => popSound.triggerAttackRelease('G3', '8n'));
            if (!timerStarted) {
                startTimer();
                timerStarted = true;
            }
            towers[sourceTower.id].pop();
            towers[targetTowerId].push(draggedDisk.id);
            targetTowerEl.appendChild(draggedDisk.element);
            moves++;
            updateUI();
            checkWinCondition();
        } else {
             showTooltip(`Invalid move from Tower ${sourceTower.id + 1} to Tower ${targetTowerId + 1}.`); // Added tooltip for invalid drag/drop
             playSound(() => errorSound.triggerAttackRelease('A2', '16n')); // Added error sound for invalid move
        }
        saveSettings(); // Save settings after a move
    }

    function isValidMove(fromId, toId) {
        if (fromId === toId) return false;
        const diskToMove = towers[fromId][towers[fromId].length - 1];
        const topDiskOnTarget = towers[toId][towers[toId].length - 1];
        return towers[toId].length === 0 || diskToMove < topDiskOnTarget;
    }

    // --- Win Condition ---
    function checkWinCondition() {
        for (let i = 1; i < numTowers; i++) {
            if (towers[i].length === numDisks) {
                stopTimer();
                playSound(() => {
                    const now = Tone.now();
                    winSynth.triggerAttackRelease("C5", "8n", now);
                    winSynth.triggerAttackRelease("E5", "8n", now + 0.2);
                    winSynth.triggerAttackRelease("G5", "8n", now + 0.4);
                    winSynth.triggerAttackRelease("C6", "4n", now + 0.6);
                });
                winMessageEl.style.display = 'flex';
                saveSettings(); // Save settings on win
                return;
            }
        }
    }

    // --- Keyboard Controls ---
    function handleKeyPress(e) {
        const key = parseInt(e.key);
        // Only handle number keys corresponding to towers
        if (isNaN(key) || key < 1 || key > numTowers) return;

        const towerIndex = key - 1;

        if (selectedDiskByKey) {
            // --- Try to place the disk ---
            const sourceTowerId = selectedDiskByKey.sourceTowerId;

            if (isValidMove(sourceTowerId, towerIndex)) {
                showTooltip(`Moved disk from Tower ${sourceTowerId + 1} to Tower ${towerIndex + 1}.`);
                playSound(() => popSound.triggerAttackRelease('G3', '8n'));
                if (!timerStarted) {
                    startTimer();
                    timerStarted = true;
                }

                // Move data
                towers[sourceTowerId].pop();
                towers[towerIndex].push(selectedDiskByKey.id);

                // Move DOM element
                const targetTowerEl = document.querySelector(`.tower[data-tower-id='${towerIndex}']`);
                targetTowerEl.appendChild(selectedDiskByKey.element);

                moves++;
                updateUI();
                checkWinCondition();
            } else {
                showTooltip(`Invalid move to Tower ${towerIndex + 1}.`);
                playSound(() => errorSound.triggerAttackRelease('A2', '16n'));
            }

            // Deselect disk regardless of move success
            selectedDiskByKey.element.classList.remove('selected-by-key');
            selectedDiskByKey = null;
            saveSettings(); // Save settings after a keyboard move

        } else {
            // --- Try to pick up a disk ---
            if (towers[towerIndex].length > 0) {
                showTooltip(`Selected disk from Tower ${towerIndex + 1}. Press a number key to place it.`);
                playSound(() => popSound.triggerAttackRelease('C4', '8n'));
                const sourceTowerEl = document.querySelector(`.tower[data-tower-id='${towerIndex}']`);
                const diskEl = sourceTowerEl.lastChild;
                const diskId = parseInt(diskEl.dataset.diskId);

                selectedDiskByKey = {
                    id: diskId,
                    element: diskEl,
                    sourceTowerId: towerIndex
                };

                diskEl.classList.add('selected-by-key');
            } else {
                 showTooltip(`Tower ${towerIndex + 1} is empty.`);
                 playSound(() => errorSound.triggerAttackRelease('A2', '16n')); // Added error sound for empty tower selection
            }
        }
    }


    // --- Event Listeners ---
    function addDragDropListeners() {
        document.querySelectorAll('.disk').forEach(disk => {
            disk.addEventListener('dragstart', handleDragStart);
            disk.addEventListener('dragend', handleDragEnd);
        });
        document.querySelectorAll('.tower').forEach(tower => {
            tower.addEventListener('dragover', handleDragOver);
            tower.addEventListener('drop', handleDrop);
        });
    }

    function resetGameAndCloseMenus() {
        document.body.classList.remove('menu-open');
        winMessageEl.style.display = 'none';
        initGame();
        saveSettings(); // Save settings after reset
    }

    // --- Settings & Menu Logic ---
    menuToggle.addEventListener('click', () => document.body.classList.toggle('menu-open'));

    resetButton.addEventListener('click', () => {
        numDisks = parseInt(diskCountInput.value);
        numTowers = parseInt(towerCountInput.value);
        resetGameAndCloseMenus();
    });

    quickResetBtn.addEventListener('click', resetGameAndCloseMenus);

    winMessageEl.addEventListener('click', resetGameAndCloseMenus);

    soundToggle.addEventListener('change', () => {
        soundEnabled = soundToggle.checked;
        masterVolume.mute = !soundEnabled;
        volumeSetting.style.display = soundEnabled ? 'flex' : 'none';
        saveSettings(); // Save settings
    });

    volumeControl.addEventListener('input', (e) => {
        const sliderValue = e.target.value;
        volumeValue.textContent = sliderValue;
        masterVolume.volume.value = Tone.gainToDb(sliderValue / 100);
        // Save settings is called on 'change' event for range inputs, not 'input'
    });
     volumeControl.addEventListener('change', saveSettings); // Save settings on change

    darkModeToggle.addEventListener('change', () => {
        applyTheme(darkModeToggle.checked); // Apply theme immediately
        saveSettings(); // Save settings
    });

    showNumbersToggle.addEventListener('change', () => {
        applyNumberDisplaySetting(showNumbersToggle.checked); // Apply setting immediately
        saveSettings(); // Save settings
    });

    hoverNumbersToggle.addEventListener('change', () => {
        document.body.classList.toggle('numbers-on-hover', hoverNumbersToggle.checked);
        saveSettings(); // Save settings
    });

    tooltipToggle.addEventListener('change', () => { // Added listener for new toggle
        tooltipsEnabled = tooltipToggle.checked; // Update state variable
        hideTooltip(); // Hide tooltip immediately if turned off
        saveSettings(); // Save settings
    });

    diskCountInput.addEventListener('input', (e) => {
        diskCountValue.textContent = e.target.value;
        // Save settings is called on 'change' event for range inputs, not 'input'
    });
    diskCountInput.addEventListener('change', saveSettings); // Save settings on change

    towerCountInput.addEventListener('input', (e) => {
        towerCountValue.textContent = e.target.value;
        // Save settings is called on 'change' event for range inputs, not 'input'
    });
    towerCountInput.addEventListener('change', saveSettings); // Save settings on change

    document.addEventListener('keydown', handleKeyPress);

    // --- Initial Setup ---
    function applyTheme(isDark) {
        document.body.dataset.theme = isDark ? 'dark' : 'light';
    }

    function setupTheme() {
        // This function is now primarily for setting up the initial state based on cookies
        // The actual theme application is done by applyTheme, called from loadSettings or change listener
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        prefersDarkScheme.addEventListener('change', (e) => {
             applyTheme(e.matches);
             // Decide if you want system preference changes to override saved settings
             // For now, we'll let saved settings take precedence on load, but system changes
             // will update the UI unless the user changes the toggle manually.
             // If the user changes the toggle, that should stick.
             // We won't save system preference changes to cookie automatically here.
        });
    }

    function setInitialSliderValues() {
        // This function is now primarily for updating the display spans
        diskCountValue.textContent = diskCountInput.value;
        towerCountValue.textContent = towerCountInput.value;
    }

    function setInitialSoundState() {
        // This function is now primarily for applying the loaded/default sound settings
        soundEnabled = soundToggle.checked;
        masterVolume.mute = !soundEnabled;
        volumeSetting.style.display = soundEnabled ? 'flex' : 'none';

        const initialVolume = volumeControl.value;
        volumeValue.textContent = initialVolume;
        masterVolume.volume.value = Tone.gainToDb(initialVolume / 100);
    }

    // --- App Initialization Flow ---
    setupSounds(); // Setup audio context and synths
    loadSettings(); // Load settings from cookie and apply them to UI/state
    setupTheme(); // Setup system theme preference listener (optional, depends on desired behavior)
    // setInitialSliderValues(); // Called from loadSettings
    // setInitialSoundState(); // Called from loadSettings
    initGame(); // Initialize the game with loaded/default disk/tower count
});