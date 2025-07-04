import * as ui from './ui.js';
import * as state from './state.js';
import * as audio from './audio.js';
import * as game from './game.js'; // Import game to call resetGameAndCloseMenus

// --- Cookie Functions ---
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

// --- Settings Saving/Loading ---
export function saveSettings() {
    const settings = {
        soundEnabled: ui.soundToggle.checked,
        volume: parseInt(ui.volumeControl.value),
        darkMode: ui.darkModeToggle.checked,
        showNumbers: ui.showNumbersToggle.checked,
        hoverNumbers: ui.hoverNumbersToggle.checked,
        numDisks: parseInt(ui.diskCountInput.value),
        numTowers: parseInt(ui.towerCountInput.value)
    };
    setCookie("hanoiSettings", JSON.stringify(settings), 365); // Save for 1 year
}

export function loadSettings() {
    const settingsCookie = getCookie("hanoiSettings");
    if (settingsCookie) {
        try {
            const settings = JSON.parse(settingsCookie);

            // Apply settings to UI elements, falling back to defaults
            ui.soundToggle.checked = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
            ui.volumeControl.value = settings.volume !== undefined ? settings.volume : 75;
            ui.darkModeToggle.checked = settings.darkMode !== undefined ? settings.darkMode : false;
            ui.showNumbersToggle.checked = settings.showNumbers !== undefined ? settings.showNumbers : false;
            ui.hoverNumbersToggle.checked = settings.hoverNumbers !== undefined ? settings.hoverNumbers : false;

            // Update state variables based on loaded settings
            state.setSoundEnabled(ui.soundToggle.checked);

            // Apply appearance settings immediately
            ui.applyTheme(ui.darkModeToggle.checked);
            setInitialSoundState(); // This also applies volume and shows/hides volume setting
            ui.applyNumberDisplaySetting(ui.showNumbersToggle.checked); // Apply show/hover numbers setting

            // Update game setup inputs, but don't reset game yet
            ui.diskCountInput.value = settings.numDisks !== undefined ? settings.numDisks : 4;
            ui.towerCountInput.value = settings.numTowers !== undefined ? settings.numTowers : 3;
            ui.setInitialSliderValues(ui.diskCountInput.value, ui.towerCountInput.value); // Update slider value displays

            // Update state variables for game setup
            state.setNumDisks(parseInt(ui.diskCountInput.value));
            state.setNumTowers(parseInt(ui.towerCountInput.value));

        } catch (e) {
            console.error("Failed to parse settings cookie:", e);
            // Optionally, erase the corrupted cookie
            // eraseCookie("hanoiSettings");
        }
    } else {
         // No cookie found, apply default settings (which are already in HTML/variables)
         // These functions apply the default values from the HTML attributes
         ui.applyTheme(ui.darkModeToggle.checked);
         setInitialSoundState();
         ui.applyNumberDisplaySetting(ui.showNumbersToggle.checked);
         ui.setInitialSliderValues(ui.diskCountInput.value, ui.towerCountInput.value);
         state.setNumDisks(parseInt(ui.diskCountInput.value));
         state.setNumTowers(parseInt(ui.towerCountInput.value));
    }
}

// Helper to apply initial sound state based on loaded/default settings
function setInitialSoundState() {
    state.setSoundEnabled(ui.soundToggle.checked);
    audio.setMasterVolumeMute(!state.soundEnabled);
    ui.volumeSetting.style.display = state.soundEnabled ? 'flex' : 'none';

    const initialVolume = ui.volumeControl.value;
    ui.volumeValue.textContent = initialVolume;
    audio.setMasterVolumeLevel(Tone.gainToDb(initialVolume / 100));
}


// --- Settings Event Listeners ---
export function setupSettingsEventListeners() {
    ui.menuToggle.addEventListener('click', () => document.body.classList.toggle('menu-open'));

    ui.resetButton.addEventListener('click', () => {
        state.setNumDisks(parseInt(ui.diskCountInput.value));
        state.setNumTowers(parseInt(ui.towerCountInput.value));
        game.resetGameAndCloseMenus(); // Call reset from game.js
    });

    ui.quickResetBtn.addEventListener('click', game.resetGameAndCloseMenus); // Call reset from game.js

    ui.winMessageEl.addEventListener('click', game.resetGameAndCloseMenus); // Call reset from game.js

    ui.soundToggle.addEventListener('change', () => {
        state.setSoundEnabled(ui.soundToggle.checked);
        audio.setMasterVolumeMute(!state.soundEnabled);
        ui.volumeSetting.style.display = state.soundEnabled ? 'flex' : 'none';
        saveSettings();
    });

    ui.volumeControl.addEventListener('input', (e) => {
        const sliderValue = e.target.value;
        ui.volumeValue.textContent = sliderValue;
        audio.setMasterVolumeLevel(Tone.gainToDb(sliderValue / 100));
    });
    ui.volumeControl.addEventListener('change', saveSettings);

    ui.darkModeToggle.addEventListener('change', () => {
        ui.applyTheme(ui.darkModeToggle.checked);
        saveSettings();
    });

    ui.showNumbersToggle.addEventListener('change', () => {
        ui.applyNumberDisplaySetting(ui.showNumbersToggle.checked);
        saveSettings();
    });

    ui.hoverNumbersToggle.addEventListener('change', () => {
        document.body.classList.toggle('numbers-on-hover', ui.hoverNumbersToggle.checked);
        saveSettings();
    });

    ui.diskCountInput.addEventListener('input', (e) => {
        ui.diskCountValue.textContent = e.target.value;
    });
    ui.diskCountInput.addEventListener('change', saveSettings);

    ui.towerCountInput.addEventListener('input', (e) => {
        ui.towerCountValue.textContent = e.target.value;
    });
    ui.towerCountInput.addEventListener('change', saveSettings);
}