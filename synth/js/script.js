document.addEventListener('DOMContentLoaded', () => {
    let synth, reverb, delay, masterVolume, activeInstrument;

    const startButton = document.getElementById('start-button');
    const startPrompt = document.getElementById('start-prompt');
    const keyboard = document.getElementById('keyboard');
    const keyboardContainer = document.getElementById('keyboard-container');
    const notesWrapper = document.getElementById('notes-wrapper');
    const controlPanel = document.getElementById('control-panel');
    const toggleControlsBtn = document.getElementById('toggle-controls-btn');
    const pianoRollContainer = document.getElementById('piano-roll-container');

    const activeNoteRects = {};
    const whiteKeyWidth = 50, blackKeyWidth = 32, blackKeyHeight = '60%';

    const defaultPresets = {
        "Default": { instrument: "synth", waveform: "sawtooth", volume: 0.2, attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8, reverb: 0.2, delay: 0.1 },
        "Piano Synth": { instrument: "synth", waveform: "triangle", volume: 0.8, attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.8, reverb: 0.3, delay: 0 },
        "Flute Synth": { instrument: "synth", waveform: "sine", volume: 0.7, attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.5, reverb: 0.1, delay: 0.2 },
        "Organ": { instrument: "synth", waveform: "fatsine", volume: 0.7, attack: 0.08, decay: 0.1, sustain: 0.8, release: 0.2, reverb: 0.3, delay: 0 },
        "Bell Synth": { instrument: "synth", waveform: "triangle", volume: 0.8, attack: 0.01, decay: 0.5, sustain: 0.1, release: 1.5, reverb: 0.5, delay: 0.3 },
        "Synth Bass": { instrument: "synth", waveform: "square", volume: 0.9, attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.3, reverb: 0.1, delay: 0.05 },
        "Ambient Pad": { instrument: "synth", waveform: "fatsawtooth", volume: 0.6, attack: 1.5, decay: 0.5, sustain: 0.8, release: 2.0, reverb: 0.7, delay: 0.4 },
    };

    function initializeAudio() {
        if (Tone.context.state !== 'running') Tone.start();
        masterVolume = new Tone.Volume(0).toDestination();
        reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).connect(masterVolume);
        delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.5, wet: 0.1 }).connect(masterVolume);

        // Basic Synth
        synth = new Tone.PolySynth(Tone.Synth).connect(reverb).connect(delay);
        activeInstrument = synth; // Set synth as the default active instrument

        populatePresets();
        loadPreset("Default");
        initializeSliders();
    }

    startButton.addEventListener('click', () => {
        initializeAudio();
        startPrompt.style.display = 'none';
    });

    toggleControlsBtn.addEventListener('click', () => {
        const isHidden = controlPanel.classList.toggle('hidden');
        toggleControlsBtn.textContent = isHidden ? 'Show Controls' : 'Hide Controls';
    });

    function updateSynthSettings() {
        if (!activeInstrument) return;

        const settings = {};
        document.querySelectorAll('.slider-track').forEach(slider => {
            settings[slider.dataset.parameter] = parseFloat(slider.dataset.value);
        });

        if (settings.volume !== undefined) masterVolume.volume.value = Tone.gainToDb(settings.volume);
        if (settings.reverb !== undefined) reverb.wet.value = settings.reverb;
        if (settings.delay !== undefined) delay.wet.value = settings.delay;

        const envelopeSettings = {
            attack: settings.attack,
            decay: settings.decay,
            sustain: settings.sustain,
            release: settings.release
        };

        // Always apply settings to the synth since it's the only instrument now
        activeInstrument.set({
            oscillator: { type: document.getElementById('waveform').value },
            envelope: envelopeSettings
        });
    }

    function onControlChange() {
        const presetSelect = document.getElementById('preset-select');
        if (presetSelect.value !== 'custom' && presetSelect.value) {
            presetSelect.value = "custom";
        }
        updateSynthSettings();
    }

    document.getElementById('waveform').addEventListener('input', onControlChange);

    function getCustomPresets() {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('customSynthPresets='));
        if (cookieValue) {
            try {
                return JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    function populatePresets() {
        const presetSelect = document.getElementById('preset-select');
        const currentVal = presetSelect.value;
        presetSelect.innerHTML = '';
        const customPresets = getCustomPresets();

        const customOption = document.createElement('option');
        customOption.value = "custom"; customOption.textContent = "Custom"; presetSelect.appendChild(customOption);

        for (const name in defaultPresets) { const option = document.createElement('option'); option.value = name; option.textContent = name; presetSelect.appendChild(option); }
        for (const name in customPresets) { const option = document.createElement('option'); option.value = name; option.textContent = `* ${name}`; presetSelect.appendChild(option); }
        presetSelect.value = currentVal || 'Default';
    }

    function loadPreset(name) {
        const customPresets = getCustomPresets();
        const preset = defaultPresets[name] || customPresets[name];
        if (!preset) { document.getElementById('preset-select').value = "custom"; return; }

        // Since only synth is available, no need to switch instruments
        activeInstrument = synth;

        if (preset.waveform) document.getElementById('waveform').value = preset.waveform;

        document.querySelectorAll('.slider-track').forEach(slider => {
            const param = slider.dataset.parameter;
            if (preset.hasOwnProperty(param)) {
                const value = preset[param];
                slider.dataset.value = value;
                updateSliderPosition(slider, value);
            }
        });

        updateSynthSettings();
        document.getElementById('preset-select').value = name;
    }

    function saveCurrentPreset() {
        const name = prompt("Enter a name for your preset:", "My Sound");
        if (!name || name.trim() === "") return;
        const customPresets = getCustomPresets();

        const newPreset = {
            instrument: "synth", // Always synth now
            waveform: document.getElementById('waveform').value
        };
        document.querySelectorAll('.slider-track').forEach(slider => {
            newPreset[slider.dataset.parameter] = parseFloat(slider.dataset.value);
        });

        customPresets[name.trim()] = newPreset;
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `customSynthPresets=${encodeURIComponent(JSON.stringify(customPresets))}; expires=${expires}; path=/; SameSite=Lax`;

        populatePresets();
        document.getElementById('preset-select').value = name.trim();
    }

    document.getElementById('preset-select').addEventListener('change', (e) => loadPreset(e.target.value));
    document.getElementById('save-preset-button').addEventListener('click', saveCurrentPreset);

    function updateSliderPosition(slider, value) {
        const min = parseFloat(slider.dataset.min);
        const max = parseFloat(slider.dataset.max);
        const pointer = slider.querySelector('.slider-pointer');
        const trackHeight = slider.offsetHeight;
        const pointerHeight = pointer.offsetHeight;

        const percentage = (Math.max(min, Math.min(max, value)) - min) / (max - min);
        const topPostition = (1 - percentage) * (trackHeight - pointerHeight);

        pointer.style.top = `${topPostition}px`;
    }

    function initializeSliders() {
         document.querySelectorAll('.slider-track').forEach(slider => {
            updateSliderPosition(slider, parseFloat(slider.dataset.value));

            const handleInteraction = (e) => {
                e.preventDefault();
                const min = parseFloat(slider.dataset.min), max = parseFloat(slider.dataset.max);
                const startY = e.clientY || e.touches[0].clientY;
                const startValue = parseFloat(slider.dataset.value);

                const onMove = (moveEvent) => {
                    const currentY = moveEvent.clientY || moveEvent.touches[0].clientY;
                    const deltaY = startY - currentY;
                    let newValue = startValue + (deltaY * ((max - min) / (slider.offsetHeight * 0.8)));
                    newValue = Math.max(min, Math.min(max, newValue));
                    slider.dataset.value = newValue;
                    updateSliderPosition(slider, newValue);
                    onControlChange();
                };
                const onEnd = () => {
                    window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd);
                    window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd);
                };
                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
                window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onEnd);
            };
            slider.addEventListener('mousedown', handleInteraction);
            slider.addEventListener('touchstart', handleInteraction, { passive: false });
        });
    }

    let whiteKeyIndex = 0;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let octave = 0; octave <= 8; octave++) {
        for (const noteName of noteNames) {
            if (octave === 8 && noteName !== 'C') continue;
            const note = `${noteName}${octave}`;
            const key = document.createElement('div');
            key.classList.add('key', note.includes('#') ? 'black' : 'white');
            key.dataset.note = note;
            const noteNameSpan = document.createElement('span');
            noteNameSpan.classList.add('note-name');
            noteNameSpan.textContent = note;
            key.appendChild(noteNameSpan);
            if (note.includes('#')) { key.style.cssText = `width:${blackKeyWidth}px; height:${blackKeyHeight}; position:absolute; left:${(whiteKeyIndex - 0.5) * whiteKeyWidth + (whiteKeyWidth - blackKeyWidth) / 2}px;`; }
            else { key.style.cssText = `width:${whiteKeyWidth}px; height:100%;`; whiteKeyIndex++; }
            keyboard.appendChild(key);
        }
    }
    keyboard.style.width = `${whiteKeyIndex * whiteKeyWidth}px`;
    notesWrapper.style.width = keyboard.style.width;

    keyboardContainer.scrollLeft = (keyboard.offsetWidth - keyboardContainer.offsetWidth) / 2;


    keyboardContainer.addEventListener('scroll', () => {
        notesWrapper.style.transform = `translateX(-${keyboardContainer.scrollLeft}px)`;
    });

    function triggerNoteStart(note) {
        if (!activeInstrument) return;

        const keyElement = document.querySelector(`.key[data-note="${note}"]`);
        if (!keyElement) return;

        activeInstrument.triggerAttack(note);
        keyElement.classList.add('active');

        const rect = document.createElement('div');
        rect.classList.add('note-rectangle');

        const rectWidth = keyElement.clientWidth * 0.9;
        const leftPos = keyElement.offsetLeft + keyElement.clientLeft + (keyElement.clientWidth - rectWidth) / 2 + 9;

        rect.style.width = `${rectWidth}px`;
        rect.style.left = `${leftPos}px`;

        const midi = Tone.Frequency(note).toMidi();
        const hue = (midi % 12) * 30;
        rect.style.backgroundColor = `hsl(${hue}, 90%, 65%)`;
        rect.style.boxShadow = `0 0 15px hsl(${hue}, 90%, 65%, 0.7)`;

        notesWrapper.appendChild(rect);

        const newNoteInfo = {
            element: rect,
            released: false,
            animationFrame: null
        };

        if (!activeNoteRects[note]) {
            activeNoteRects[note] = [];
        }
        activeNoteRects[note].push(newNoteInfo);

        let height = 0;
        const rate = parseFloat(document.querySelector('[data-parameter="viz_rate"]').dataset.value);

        function grow() {
            if (newNoteInfo.released) return;
            height += rate;
            rect.style.height = `${height}px`;
            newNoteInfo.animationFrame = requestAnimationFrame(grow);
        }
        newNoteInfo.animationFrame = requestAnimationFrame(grow);
    }

    function triggerNoteEnd(note) {
        if (!activeInstrument || !activeNoteRects[note] || activeNoteRects[note].length === 0) {
            return;
        }

        const noteInfo = activeNoteRects[note].find(n => !n.released);
        if (!noteInfo) return;

        activeInstrument.triggerRelease(note);

        const activeSoundsForNote = activeNoteRects[note].filter(n => !n.released).length;
        if (activeSoundsForNote <= 1) {
            document.querySelector(`[data-note="${note}"]`)?.classList.remove('active');
        }

        cancelAnimationFrame(noteInfo.animationFrame);
        noteInfo.released = true;

        let bottomPos = parseFloat(noteInfo.element.style.bottom) || 0;
        const rate = parseFloat(document.querySelector('[data-parameter="viz_rate"]').dataset.value);

        function moveUp() {
            bottomPos += rate;
            noteInfo.element.style.bottom = `${bottomPos}px`;
            const pianoRollHeight = pianoRollContainer.offsetHeight;

            if (bottomPos < pianoRollHeight) {
               noteInfo.animationFrame = requestAnimationFrame(moveUp);
            } else {
               noteInfo.element.remove();
               const index = activeNoteRects[note].indexOf(noteInfo);
               if (index > -1) {
                   activeNoteRects[note].splice(index, 1);
               }
               if (activeNoteRects[note].length === 0) {
                   delete activeNoteRects[note];
               }
            }
        }
        noteInfo.animationFrame = requestAnimationFrame(moveUp);
    }

    let isMouseDown = false, currentMouseNote = null;
    document.body.addEventListener('mousedown', (e) => { if (!e.target.closest('.slider-track, .key')) isMouseDown = false; else if (e.target.closest('.key')) isMouseDown = true; });
    document.body.addEventListener('mouseup', () => { if (isMouseDown && currentMouseNote) { triggerNoteEnd(currentMouseNote); } isMouseDown = false; currentMouseNote = null; });
    keyboard.addEventListener('mousedown', e => { if (e.target.classList.contains('key')) { triggerNoteStart(e.target.dataset.note); currentMouseNote = e.target.dataset.note; } });
    keyboard.addEventListener('mouseover', e => { if (isMouseDown && e.target.classList.contains('key') && currentMouseNote !== e.target.dataset.note) { if(currentMouseNote) triggerNoteEnd(currentMouseNote); triggerNoteStart(e.target.dataset.note); currentMouseNote = e.target.dataset.note; } });
    keyboard.addEventListener('mouseleave', () => { if (isMouseDown && currentMouseNote) { triggerNoteEnd(currentMouseNote); currentMouseNote = null; } });

    if (navigator.requestMIDIAccess) { navigator.requestMIDIAccess().then(onMIDISuccess, (err) => console.error(`MIDI access failed: ${err}`)); }
    function onMIDISuccess(midi) { midi.inputs.forEach(input => input.onmidimessage = getMIDIMessage); }
    function getMIDIMessage(message) {
        if(!activeInstrument) return;
        const [cmd, noteNum, velocity] = message.data;
        const noteName = Tone.Frequency(noteNum, "midi").toNote();
        if (cmd === 144 && velocity > 0) { triggerNoteStart(noteName); }
        else if (cmd === 128 || (cmd === 144 && velocity === 0)) { triggerNoteEnd(noteName); }
    }
});