# Rhythmos 🎵
> **Empowering Everyone to Play, Sing, and Belong Through Air-Gesture Music**

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00E5FF?style=for-the-badge&logo=github)](https://zura16.github.io/Rhythmos/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 🌟 The Vision: Solving the Barrier to Making Music

For millions of people worldwide, music is a deep emotional calling—yet traditional instruments present formidable barriers:
- **Physical & Financial Barriers**: High cost of physical instruments like Harmoniums or Grand Pianos.
- **Motor Skill & Dexterity Challenges**: Finger fatigue or physical limitations with complex guitar frets and piano keys.
- **Exclusion from Musical Accompaniment**: Many passionate singers feel sidelined from performing because they cannot play an instrument to accompany themselves.

**Rhythmos was created to solve this major problem.**

By uniting **Webcam Computer Vision Gesture Tracking** with **Polyphonic Acoustic Instrument Synthesis** and an **Interactive Lyrics & Chord Teleprompter**, Rhythmos empowers *anyone*—regardless of experience, equipment, or physical dexterity—to trigger rich, real-time chords in thin air while singing their favorite songs. 

---

## 🚀 Key Features

### 🪗 1. Authentic Acoustic & Classical Sound Engine
Replaced synthetic tones with 6 physically modeled, studio-grade acoustic instruments:
- 🪗 **Free-Reed Harmonium**: Dual brass reed ranks, octave coupler, and air bellows tremolo.
- 🎹 **Acoustic Grand Piano**: Steinway-model string overtones & soundboard warmth.
- 🎸 **Nylon Acoustic Guitar**: Plucked string attack & wooden body resonance.
- 🎻 **Symphonic Strings**: Bowed section layering with natural vibrato.
- 🪵 **Concert Marimba**: Rosewood fundamental & aluminum tube resonator.
- ⚡ **Vintage Rhodes**: Tine bell strike transient & warm decay.
- ⛪ **Church Pipe Organ**: Multi-rank chapel organ pipes.

### 🎼 2. Concentric 24-Chord Wheel & Continuous Scale Pitch
- **24 Side-by-Side Sectors**: Major and Minor chords arranged continuously around the wheel (`A Maj`, `A min`, `A# Maj`, `A# min`, `B Maj`, `B min`, ...).
- **Continuous Ascending Pitch Math**: Smooth scale pitch progression from **A4 ($440\text{ Hz}$)** up to **G#5 ($830.6\text{ Hz}$)**—moving from B to C continuously ascends into C5 without pitch drops!
- **Dynamic Radial Octave Shift**: Hovering outwards towards the outer edge of any chord slice instantly shifts the pitch **+1 Octave higher in real time**.
- **Color-Coded Pitch Families**: Light translucent shades for Major chords and darker translucent shades of the same pitch family for Minor chords.

### 🎤 3. "Sing Along & Play" Interactive Teleprompter
- **Instant Song Search**: Built-in song catalog + real-time search by song title, artist, or chords.
- **Auto-Scrolling Lyrics**: Hands-free auto-scrolling (**Slow** / **Fast**) so singers can perform without stopping.
- **Interactive Chord Badge Sync**: Clicking any chord tag (`[C]`, `[Am]`, `[G]`, `[F]`) highlights the exact sector slice on the Rhythmos wheel.

### 📹 4. Full Camera Visibility & Ferrofluid WebGL Background
- **100% Unobstructed Camera Feed**: Zero dark dimming or contrast filters on the webcam stream.
- **React Bits Ferrofluid WebGL Splash Screen**: Interactive WebGL fluid shader hero background.
- **Floating CardNav Navigation**: Smooth spring expansion physics and calligraphic brand typography.

---

## 🛠️ Tech Stack

- **Computer Vision**: MediaPipe Hands & Camera Utils
- **Audio Engine**: Web Audio API (`AudioContext`, `BiquadFilterNode`, `ConvolverNode`, `DynamicsCompressorNode`)
- **WebGL Shader**: `ogl` 3D WebGL Library (Ferrofluid background)
- **Typography**: Great Vibes (Calligraphic Logo), Plus Jakarta Sans, Outfit, Inter

---

## 💻 Local Setup & Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Zura16/Rhythmos.git
   cd Rhythmos
   ```

2. **Start Local HTTP Server**:
   ```bash
   node server.js
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5173/` in Google Chrome or Microsoft Edge, grant camera permissions, and start making music!

---

## 🌐 Live Deployment

Rhythmos is deployed live on GitHub Pages:
👉 **[https://zura16.github.io/Rhythmos/](https://zura16.github.io/Rhythmos/)**

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
