// Web Audio API Context
let audioContext = null;
const audioBuffers = {};
const soundsToLoad = [
    { name: 'success', url: './assets/audio/success.mp3' },
    { name: 'error', url: './assets/audio/error.mp3' },
    { name: 'click', url: './assets/audio/click.mp3' },
    { name: 'gameOver', url: './assets/audio/game-over.mp3' },
    { name: 'countdown', url: './assets/audio/countdown.mp3' },
];
let soundsLoaded = false;

export function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext initialized.");
    }
    // Attempt to resume context if suspended (required after user gesture)
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully.");
        }).catch(e => console.error("AudioContext resume failed:", e));
    }
}

export async function loadSound(name, url) {
    if (!audioContext) {
         console.warn("AudioContext not initialized. Cannot load sounds yet.");
         return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[name] = audioBuffer;
        // console.log(`Sound loaded: ${name}`);
    } catch (e) {
        console.error(`Error loading sound ${name} from ${url}:`, e);
    }
}

export async function loadAllSounds() {
    if (soundsLoaded) {
        console.log("Sounds already loaded.");
        return;
    }
    initAudioContext(); // Ensure context is initialized before loading
    console.log("Starting sound loading...");
    await Promise.all(soundsToLoad.map(sound => loadSound(sound.name, sound.url)));
    soundsLoaded = true;
    console.log("All sounds loading attempted.");
}

export function playSound(name) {
    const buffer = audioBuffers[name];
    if (buffer && audioContext && audioContext.state === 'running') {
        try {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(0);
        } catch (e) {
             console.error(`Error playing sound ${name}:`, e);
        }
    } else if (!buffer) {
        console.warn(`Sound buffer not found for: ${name}`);
    } else if (audioContext && audioContext.state !== 'running') {
         console.warn(`AudioContext state is ${audioContext.state}. Cannot play sound ${name}.`);
    } else {
         console.warn(`Could not play sound: ${name}`);
    }
}