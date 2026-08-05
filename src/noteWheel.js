// Chromatic Note Wheel Renderer - 100% High Visibility Note Wheel
export class NoteWheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 12 Chromatic Notes (A to G#) starting at 12 o'clock
    this.notes = [
      { name: 'A',  color: '#FF2D55' },
      { name: 'A#', color: '#9C27B0' },
      { name: 'B',  color: '#673AB7' },
      { name: 'C',  color: '#00E5FF' },
      { name: 'C#', color: '#00897B' },
      { name: 'D',  color: '#00E676' },
      { name: 'D#', color: '#2E7D32' },
      { name: 'E',  color: '#AEEA00' },
      { name: 'F',  color: '#FFD600' },
      { name: 'F#', color: '#FF6D00' },
      { name: 'G',  color: '#FF3D00' },
      { name: 'G#', color: '#C2185B' }
    ];

    this.activeNoteIndex = -1;
    
    this.centerX = 0;
    this.centerY = 0;
    this.outerRadius = 0;
    this.innerRadius = 0;
    this.sectorAngle = (Math.PI * 2) / 12;

    this.handConnections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17]
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const W = window.innerWidth || 1280;
    const H = window.innerHeight || 720;
    const dpr = window.devicePixelRatio || 1;

    // Explicitly set element CSS dimensions AND buffer dimensions
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.canvas.width = Math.floor(W * dpr);
    this.canvas.height = Math.floor(H * dpr);

    // Position wheel centered-right for optimum visibility
    this.centerX = W * 0.62;
    this.centerY = H * 0.52;
    
    const minDim = Math.min(W, H);
    this.outerRadius = Math.max(160, minDim * 0.32);
    this.innerRadius = Math.max(60, minDim * 0.12);
  }

  draw(cursorPos, screenLandmarks = null, activeWaveformData = null, currentFreq = null) {
    const W = window.innerWidth || 1280;
    const H = window.innerHeight || 720;
    const dpr = window.devicePixelRatio || 1;

    // Set DPR scale on every frame
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.ctx.clearRect(0, 0, W, H);

    this.activeNoteIndex = this.getNoteAtPosition(cursorPos);

    // 1. Draw Hand Skeleton Overlay
    if (screenLandmarks && screenLandmarks.length > 0) {
      this.drawHandSkeleton(screenLandmarks);
    }

    // 2. Draw 12 High-Visibility Note Sectors
    for (let i = 0; i < 12; i++) {
      this.drawSector(i, i === this.activeNoteIndex);
    }

    // 3. Draw Outer Accent Ring
    this.drawOuterRing();

    // 4. Draw Center Hub Display
    this.drawCenterHub(activeWaveformData, currentFreq);

    // 5. Draw Finger Target Reticle
    if (cursorPos && cursorPos.x >= 0 && cursorPos.y >= 0) {
      this.drawCursorOverlay(cursorPos);
    }
  }

  drawHandSkeleton(landmarks) {
    this.ctx.save();

    this.handConnections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    });

    landmarks.forEach((pt, idx) => {
      const isIndexTip = idx === 8;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, isIndexTip ? 8 : 4, 0, Math.PI * 2);
      this.ctx.fillStyle = isIndexTip ? '#FFD600' : '#00E5FF';
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawSector(index, isActive) {
    const note = this.notes[index];
    const startAngle = -Math.PI / 2 + index * this.sectorAngle - this.sectorAngle / 2;
    const endAngle = startAngle + this.sectorAngle;

    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius, startAngle, endAngle, false);
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius, endAngle, startAngle, true);
    this.ctx.closePath();

    if (isActive) {
      // Solid White Active Sector
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();

      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.stroke();
    } else {
      // Solid High-Contrast Dark Slate Sector with Cyan Accent Divider
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      this.ctx.fill();

      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.stroke();
    }

    // High Visibility Note Name Label
    const midAngle = startAngle + this.sectorAngle / 2;
    const labelRadius = (this.innerRadius + this.outerRadius) / 2;
    const labelX = this.centerX + Math.cos(midAngle) * labelRadius;
    const labelY = this.centerY + Math.sin(midAngle) * labelRadius;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (isActive) {
      this.ctx.font = '800 24px "Outfit", sans-serif';
      this.ctx.fillStyle = '#0F172A';
      this.ctx.fillText(note.name, labelX, labelY);
    } else {
      this.ctx.font = '800 22px "Outfit", sans-serif';
      
      // Black stroke outline guarantees 100% visibility over any background
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#000000';
      this.ctx.strokeText(note.name, labelX, labelY);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(note.name, labelX, labelY);
    }

    this.ctx.restore();
  }

  drawOuterRing() {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius + 2, 0, Math.PI * 2);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.stroke();

    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 / 60) * i;
      const isMajor = i % 5 === 0;
      const r1 = this.outerRadius + 4;
      const r2 = this.outerRadius + (isMajor ? 12 : 7);

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX + Math.cos(angle) * r1, this.centerY + Math.sin(angle) * r1);
      this.ctx.lineTo(this.centerX + Math.cos(angle) * r2, this.centerY + Math.sin(angle) * r2);
      this.ctx.lineWidth = isMajor ? 2 : 1;
      this.ctx.strokeStyle = isMajor ? 'rgba(0, 229, 255, 0.7)' : 'rgba(255, 255, 255, 0.2)';
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawCenterHub(waveformData, currentFreq) {
    this.ctx.save();

    // Solid Center Display Hub
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius - 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.ctx.fill();

    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    this.ctx.stroke();

    // Audio Waveform
    if (waveformData && waveformData.length > 0 && this.activeNoteIndex >= 0) {
      this.ctx.beginPath();
      const waveRadius = this.innerRadius * 0.65;
      const sliceAngle = (Math.PI * 2) / waveformData.length;

      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const r = waveRadius + (v - 1) * 14;
        const angle = i * sliceAngle;
        const x = this.centerX + Math.cos(angle) * r;
        const y = this.centerY + Math.sin(angle) * r;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.activeNoteIndex >= 0) {
      const activeNote = this.notes[this.activeNoteIndex];
      this.ctx.font = 'bold 26px "Outfit", sans-serif';
      this.ctx.fillStyle = '#00E5FF';
      this.ctx.fillText(activeNote.name, this.centerX, this.centerY - 6);

      if (currentFreq) {
        this.ctx.font = '11px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillText(`${Math.round(currentFreq)} Hz`, this.centerX, this.centerY + 16);
      }
    } else {
      this.ctx.font = '700 11px "Outfit", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText('HOVER NOTE', this.centerX, this.centerY - 5);

      this.ctx.font = '10px sans-serif';
      this.ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
      this.ctx.fillText('A ➔ G# Scale', this.centerX, this.centerY + 12);
    }

    this.ctx.restore();
  }

  drawCursorOverlay(cursorPos) {
    this.ctx.save();
    
    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, 16, 0, Math.PI * 2);
    this.ctx.strokeStyle = cursorPos.isCamera ? '#00E5FF' : '#FFD600';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();

    this.ctx.restore();
  }

  getNoteAtPosition(pos) {
    if (!pos || pos.x < 0 || pos.y < 0) return -1;

    const dx = pos.x - this.centerX;
    const dy = pos.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.innerRadius || dist > this.outerRadius + 15) {
      return -1;
    }

    let angle = Math.atan2(dy, dx) - (-Math.PI / 2) + (this.sectorAngle / 2);

    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;

    const sectorIndex = Math.floor(angle / this.sectorAngle) % 12;
    return sectorIndex;
  }

  triggerRipple(noteIndex) {}
}
