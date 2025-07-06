import * as audio from './audio.js';
import * as settings from './settings.js';
import * as game from './game.js';
import * as ui from './ui.js'; // Import ui for DOMContentLoaded

document.addEventListener('DOMContentLoaded', () => {
    // Ensure Tone.js is loaded before setting up sounds
    if (window.Tone) {
        audio.setupSounds(window.Tone);
    } else {
        console.warn("Tone.js not found. Sound will be disabled.");
        // Optionally disable sound toggle if Tone.js is missing
        if (ui.soundToggle) {
            ui.soundToggle.checked = false;
            ui.soundToggle.disabled = true;
            ui.volumeSetting.style.display = 'none';
        }
    }

    settings.loadSettings(); // Load settings from cookie and apply them
    settings.setupSettingsEventListeners(); // Setup listeners for settings changes

    // Setup system theme preference listener (optional, depends on desired behavior)
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkScheme.addEventListener('change', (e) => {
         // Decide if you want system preference changes to override saved settings
         // For now, we'll let saved settings take precedence on load, but system changes
         // will update the UI unless the user changes the toggle manually.
         // If the user changes the toggle, that should stick.
         // We won't save system preference changes to cookie automatically here.
         ui.applyTheme(e.matches);
    });


    document.addEventListener('keydown', game.handleKeyPress); // Attach keyboard listener

    game.initGame(); // Initialize the game with loaded/default disk/tower count
});