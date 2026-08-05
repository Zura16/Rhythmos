// Interactive Songbook & Teleprompter Lyrics/Chords Engine
export const SONGS_DATABASE = [
  {
    id: 'let-it-be',
    title: 'Let It Be',
    artist: 'The Beatles',
    key: 'C Major',
    chordsUsed: ['C', 'G', 'Am', 'F'],
    lyrics: [
      { line: "When I find myself in times of trouble,", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 18 }] },
      { line: "Mother Mary comes to me,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'F', pos: 15 }] },
      { line: "Speaking words of wisdom, let it be.", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 15 }, { chord: 'F', pos: 22 }, { chord: 'C', pos: 28 }] },
      { line: "And in my hour of darkness she is standing right in front of me,", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 25 }, { chord: 'Am', pos: 40 }, { chord: 'F', pos: 55 }] },
      { line: "Speaking words of wisdom, let it be.", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 15 }, { chord: 'F', pos: 22 }, { chord: 'C', pos: 28 }] },
      { line: "Let it be, let it be, let it be, let it be,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 10 }, { chord: 'F', pos: 20 }, { chord: 'C', pos: 30 }] },
      { line: "Whisper words of wisdom, let it be.", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 15 }, { chord: 'F', pos: 22 }, { chord: 'C', pos: 28 }] }
    ]
  },
  {
    id: 'riptide',
    title: 'Riptide',
    artist: 'Vance Joy',
    key: 'A Minor',
    chordsUsed: ['Am', 'G', 'C'],
    lyrics: [
      { line: "I was scared of dentists and the dark,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 18 }, { chord: 'C', pos: 30 }] },
      { line: "I was scared of pretty girls and starting conversations,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 18 }, { chord: 'C', pos: 40 }] },
      { line: "Oh all my friends are turning green,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 12 }, { chord: 'C', pos: 25 }] },
      { line: "You're the magician's assistant in their dreams.", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 15 }, { chord: 'C', pos: 30 }] },
      { line: "Lady, running down to the riptide, taken away to the dark side,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 20 }, { chord: 'C', pos: 42 }] },
      { line: "I wanna be your left hand man.", chords: [{ chord: 'Am', pos: 0 }, { chord: 'G', pos: 12 }, { chord: 'C', pos: 22 }] }
    ]
  },
  {
    id: 'perfect',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    key: 'G Major',
    chordsUsed: ['G', 'Em', 'C', 'D'],
    lyrics: [
      { line: "I found a love for me,", chords: [{ chord: 'G', pos: 0 }] },
      { line: "Darling, just dive right in and follow my lead,", chords: [{ chord: 'Em', pos: 0 }, { chord: 'C', pos: 22 }, { chord: 'D', pos: 38 }] },
      { line: "I found a girl, beautiful and sweet,", chords: [{ chord: 'G', pos: 0 }, { chord: 'Em', pos: 15 }] },
      { line: "I never knew you were the someone waiting for me,", chords: [{ chord: 'C', pos: 0 }, { chord: 'D', pos: 25 }] },
      { line: "Baby, I'm dancing in the dark with you between my arms,", chords: [{ chord: 'G', pos: 0 }, { chord: 'Em', pos: 20 }, { chord: 'C', pos: 38 }, { chord: 'D', pos: 50 }] },
      { line: "Barefoot on the grass, listening to our favorite song.", chords: [{ chord: 'G', pos: 0 }, { chord: 'Em', pos: 20 }, { chord: 'C', pos: 38 }, { chord: 'D', pos: 50 }] }
    ]
  },
  {
    id: 'hallelujah',
    title: 'Hallelujah',
    artist: 'Leonard Cohen',
    key: 'C Major',
    chordsUsed: ['C', 'Am', 'F', 'G', 'Em'],
    lyrics: [
      { line: "I've heard there was a secret chord,", chords: [{ chord: 'C', pos: 0 }, { chord: 'Am', pos: 22 }] },
      { line: "That David played, and it pleased the Lord,", chords: [{ chord: 'C', pos: 0 }, { chord: 'Am', pos: 22 }] },
      { line: "But you don't really care for music, do you?", chords: [{ chord: 'F', pos: 0 }, { chord: 'G', pos: 15 }, { chord: 'C', pos: 28 }, { chord: 'G', pos: 35 }] },
      { line: "It goes like this, the fourth, the fifth,", chords: [{ chord: 'C', pos: 0 }, { chord: 'F', pos: 12 }, { chord: 'G', pos: 22 }] },
      { line: "The minor fall, the major lift,", chords: [{ chord: 'Am', pos: 0 }, { chord: 'F', pos: 14 }] },
      { line: "The baffled king composing Hallelujah.", chords: [{ chord: 'G', pos: 0 }, { chord: 'Em', pos: 15 }, { chord: 'Am', pos: 30 }] },
      { line: "Hallelujah, Hallelujah, Hallelujah, Hallelujah.", chords: [{ chord: 'F', pos: 0 }, { chord: 'Am', pos: 12 }, { chord: 'F', pos: 24 }, { chord: 'C', pos: 32 }, { chord: 'G', pos: 38 }, { chord: 'C', pos: 44 }] }
    ]
  },
  {
    id: 'harmonium-kirtan',
    title: 'Harmonium Dhun & Kirtan',
    artist: 'Classical Folk / Harmonium Guide',
    key: 'C Major',
    chordsUsed: ['C', 'G', 'Am', 'F'],
    lyrics: [
      { line: "Hare Krishna Hare Krishna, Krishna Krishna Hare Hare,", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 20 }, { chord: 'Am', pos: 35 }] },
      { line: "Hare Rama Hare Rama, Rama Rama Hare Hare.", chords: [{ chord: 'F', pos: 0 }, { chord: 'C', pos: 18 }, { chord: 'G', pos: 32 }, { chord: 'C', pos: 42 }] },
      { line: "Om Namah Shivaya, Om Namah Shivaya,", chords: [{ chord: 'C', pos: 0 }, { chord: 'G', pos: 16 }, { chord: 'Am', pos: 30 }] },
      { line: "Raghupati Raghav Raja Ram, Patit Pavan Sitaram.", chords: [{ chord: 'C', pos: 0 }, { chord: 'F', pos: 20 }, { chord: 'G', pos: 32 }, { chord: 'C', pos: 44 }] }
    ]
  }
];

export class SongBookManager {
  constructor(containerElement, onChordSelectCallback) {
    this.container = containerElement;
    this.onChordSelect = onChordSelectCallback;
    this.currentSong = SONGS_DATABASE[0];
    this.scrollSpeed = 0; // 0 = off, 1 = slow, 2 = fast
    this.scrollInterval = null;
    this.transposeOffset = 0;
  }

  render() {
    this.container.innerHTML = `
      <div class="songbook-header">
        <div class="songbook-title">
          <span>🎤</span> Songbook & Lyrics
        </div>
        <button id="btnToggleSongbook" class="btn-icon-close">✕</button>
      </div>

      <!-- Search Input -->
      <div class="songbook-search-box">
        <input type="text" id="songSearchInput" placeholder="🔍 Search song title, artist, or chords..." />
      </div>

      <!-- Song Selector Pills -->
      <div class="song-pills-list" id="songPillsList">
        ${SONGS_DATABASE.map(song => `
          <button class="song-pill ${song.id === this.currentSong.id ? 'active' : ''}" data-id="${song.id}">
            ${song.title} (${song.artist})
          </button>
        `).join('')}
      </div>

      <!-- Song Meta & Controls -->
      <div class="song-meta-bar">
        <div>
          <h3 id="currentSongTitle">${this.currentSong.title}</h3>
          <p id="currentSongArtist">${this.currentSong.artist} • <span style="color: var(--accent-cyan);">${this.currentSong.key}</span></p>
        </div>
        <div class="teleprompter-controls">
          <button id="btnAutoScroll" class="btn-option-sm">📜 Scroll: OFF</button>
        </div>
      </div>

      <!-- Quick Chords Bar -->
      <div class="quick-chords-bar">
        <span style="font-size: 0.7rem; color: var(--text-muted);">Song Chords:</span>
        <div class="chord-chips-group" id="quickChordChips">
          ${this.currentSong.chordsUsed.map(c => `<button class="chord-chip-btn" data-chord="${c}">${c}</button>`).join('')}
        </div>
      </div>

      <!-- Teleprompter Sheet -->
      <div class="teleprompter-sheet" id="teleprompterSheet">
        ${this.renderLyricsHTML(this.currentSong.lyrics)}
      </div>
    `;

    this.attachEvents();
  }

  renderLyricsHTML(lyricsList) {
    return lyricsList.map(item => `
      <div class="lyrics-row">
        <div class="chords-line">
          ${item.chords.map(c => `<span class="chord-badge" data-chord="${c.chord}" style="left: ${c.pos * 8.5}px;">${c.chord}</span>`).join('')}
        </div>
        <div class="lyric-text">${item.line}</div>
      </div>
    `).join('');
  }

  attachEvents() {
    const searchInput = this.container.querySelector('#songSearchInput');
    const pillsList = this.container.querySelector('#songPillsList');
    const sheet = this.container.querySelector('#teleprompterSheet');
    const btnAutoScroll = this.container.querySelector('#btnAutoScroll');
    const btnClose = this.container.querySelector('#btnToggleSongbook');

    // Search filter
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = SONGS_DATABASE.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.artist.toLowerCase().includes(q) || 
        s.chordsUsed.some(c => c.toLowerCase().includes(q))
      );

      pillsList.innerHTML = filtered.map(song => `
        <button class="song-pill ${song.id === this.currentSong.id ? 'active' : ''}" data-id="${song.id}">
          ${song.title} (${song.artist})
        </button>
      `).join('');

      pillsList.querySelectorAll('.song-pill').forEach(btn => {
        btn.addEventListener('click', () => this.selectSong(btn.getAttribute('data-id')));
      });
    });

    // Song Selection
    pillsList.querySelectorAll('.song-pill').forEach(btn => {
      btn.addEventListener('click', () => this.selectSong(btn.getAttribute('data-id')));
    });

    // Interactive Chord Badge Click/Hover Sync
    this.container.querySelectorAll('.chord-badge, .chord-chip-btn').forEach(badge => {
      badge.addEventListener('click', (e) => {
        const chordStr = e.currentTarget.getAttribute('data-chord');
        if (this.onChordSelect) this.onChordSelect(chordStr);
      });
    });

    // Auto-scroll toggle
    btnAutoScroll.addEventListener('click', () => {
      this.scrollSpeed = (this.scrollSpeed + 1) % 3;
      if (this.scrollSpeed === 0) {
        btnAutoScroll.textContent = '📜 Scroll: OFF';
        if (this.scrollInterval) clearInterval(this.scrollInterval);
      } else if (this.scrollSpeed === 1) {
        btnAutoScroll.textContent = '📜 Scroll: SLOW';
        this.startAutoScroll(25);
      } else {
        btnAutoScroll.textContent = '📜 Scroll: FAST';
        this.startAutoScroll(12);
      }
    });

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        const drawer = document.getElementById('songbookDrawer');
        if (drawer) drawer.classList.toggle('collapsed');
      });
    }
  }

  selectSong(songId) {
    const found = SONGS_DATABASE.find(s => s.id === songId);
    if (!found) return;
    this.currentSong = found;
    this.render();
  }

  startAutoScroll(intervalMs) {
    if (this.scrollInterval) clearInterval(this.scrollInterval);
    const sheet = this.container.querySelector('#teleprompterSheet');
    if (!sheet) return;

    this.scrollInterval = setInterval(() => {
      sheet.scrollTop += 1;
      if (sheet.scrollTop + sheet.clientHeight >= sheet.scrollHeight - 2) {
        sheet.scrollTop = 0; // Loop back
      }
    }, intervalMs);
  }
}
