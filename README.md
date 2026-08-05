<<<<<<< HEAD
# Rhythmos
=======
# Rhythmos 🎵

**Rhythmos** is an interactive, vision-based music application that converts webcam hand gestures into real-time musical notes using MediaPipe Hands vision tracking and Web Audio API synthesis.

![Rhythmos Screenshot](./index.html)

## Key Features

- **12-Note Chromatic Circle Wheel**: Arranged from A to G# with clean, uniform light grey sectors and crisp typography.
- **MediaPipe Hand Tracking**: Real-time index finger tip tracking (Landmark 8) with calibrated Y-axis range mapping and 1:1 camera alignment.
- **Polyphonic Web Audio Synth Engine**: Standard 12-TET frequency synthesis ($A_4 = 440\text{ Hz}$), 4 timbres (*Grand Synth*, *Crystal Chime*, *Marimba*, *Cosmic Pad*), ADSR envelope, space reverb, and octave selection (Octaves 2–6).
- **Top Dropdown Navigation**: Minimalist HUD controls for vision stream, timbre, octave range, volume, and reverb.
- **100% Fully Visible Camera Viewport**: Unobstructed camera stream with overlaid note wheel and hand skeleton tracking.

## Getting Started

Simply open `index.html` in any modern web browser or serve static files using Node.js or Python:

```bash
node server.js
```

Navigate to `http://localhost:5173/`, click **"🚀 Initialize Audio & Vision"**, and hover your index finger over any note on the wheel to play!

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules), HTML5 Canvas
- **Vision Tracking**: MediaPipe Hands & `@mediapipe/camera_utils`
- **Audio**: Web Audio API (AudioContext, Oscillators, BiquadFilter, Convolver Reverb)
- **Styling**: Vanilla CSS3 Glassmorphism with Google Fonts (*Outfit*, *Inter*)

## License

MIT License
>>>>>>> 7a274c2 (docs: add project README and documentation)
