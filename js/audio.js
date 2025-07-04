export let popSound, winSynth, errorSound, masterVolume;

export function setupSounds(Tone) {
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

export async function playSound(soundFunction) {
    // Check if Tone.js is available and context is running
    if (window.Tone && Tone.context.state !== 'running') {
        try {
            await Tone.start();
        } catch (e) {
            console.error("Failed to start Tone.js audio context:", e);
            // Optionally disable sound if it fails to start
            // import * as state from './state.js';
            // state.setSoundEnabled(false);
            // import * as ui from './ui.js';
            // ui.soundToggle.checked = false;
            return;
        }
    }
     // Check master volume mute state after ensuring context is running
    if (masterVolume && !masterVolume.mute) {
        soundFunction();
    }
}

export function setMasterVolumeMute(mute) {
    if (masterVolume) {
        masterVolume.mute = mute;
    }
}

export function setMasterVolumeLevel(levelDb) {
     if (masterVolume) {
         masterVolume.volume.value = levelDb;
     }
}