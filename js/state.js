// Game state variables
export let numDisks = 4;
export let numTowers = 3;
export let moves = 0;
export let timerInterval;
export let seconds = 0;
export let timerStarted = false;
export let towers = [];
export let draggedDisk = null;
export let sourceTower = null;
export let soundEnabled = true;
export let selectedDiskByKey = null; // For keyboard controls

// Functions to update state (if needed, or update directly in game.js)
export function setNumDisks(value) { numDisks = value; }
export function setNumTowers(value) { numTowers = value; }
export function setMoves(value) { moves = value; }
export function setTimerStarted(value) { timerStarted = value; }
export function setTowers(value) { towers = value; }
export function setDraggedDisk(value) { draggedDisk = value; }
export function setSourceTower(value) { sourceTower = value; }
export function setSoundEnabled(value) { soundEnabled = value; }
export function setSelectedDiskByKey(value) { selectedDiskByKey = value; }
export function setSeconds(value) { seconds = value; }
export function setTimerInterval(value) { timerInterval = value; }

export function resetState() {
    moves = 0;
    seconds = 0;
    towers = [];
    timerStarted = false;
    draggedDisk = null;
    sourceTower = null;
    selectedDiskByKey = null;
    // numDisks and numTowers are set via settings/initGame
}