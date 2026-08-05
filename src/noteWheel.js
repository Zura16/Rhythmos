// Chromatic Note Wheel Renderer - High-Contrast Visible Note Wheel
export class NoteWheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 12 Chromatic Notes (A to G#)
    this.notes = [
      { name: 'A' },
      { name: 'A#' },
      { name: 'B' },
      { name: 'C' },
      { name: 'C#' },
      { name: 'D' },
      { name: 'D#' },
      { name: 'E' },
      { name: 'F' },
      { name: 'F#' },
      { name: 'G' },
      { name: 'G#' }
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
    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;

    this.centerX = W * 0.72;
    this.centerY = H * 0.54;
    
    const minDim = Math.min(W, H);
    this.outerRadius = minDim * 0.26;
    this.innerRadius = minDim * 0.10;
  }

  draw(cursorPos, screenLandmarks = null, activeWaveformData = null, currentFreq = null) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Reset transform & scale for retina screens
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    this.ctx.scale(dpr, dpr);

    this.ctx.clearRect(0, 0, W, H);

    this.activeNoteIndex = this.getNoteAtPosition(cursorPos);

    // 1. Draw Clean Hand Skeleton
    if (screenLandmarks && screenLandmarks.length > 0) {
      this.drawHandSkeleton(screenLandmarks);
    }

    // 2. Draw 12 High-Contrast Note Sectors
    for (let i = 0; i < 12; i++) {
      this.drawSector(i, i === this.activeNoteIndex);
    }

    // 3. Draw Outer Accent Ring
    this.drawOuterRing();

    // 4. Draw Center Hub & Audio Waveform Visualizer
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
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
    });

    landmarks.forEach((pt, idx) => {
      const isIndexTip = idx === 8;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, isIndexTip ? 7 : 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = isIndexTip ? '#00E5FF' : '#FFFFFF';
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
      // Pure White Active Fill
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();

      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#0F172A';
      this.ctx.stroke();
    } else {
      // Dark Slate High-Contrast Glassmorphism Sectors
      this.ctx.fillStyle = 'rgba(30, 41, 59, 0.88)';
      this.ctx.fill();

      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.stroke();
    }

    // High-Contrast Typography: Crisp Bold White Text with Black Outline
    const midAngle = startAngle + this.sectorAngle / 2;
    const labelRadius = (this.innerRadius + this.outerRadius) / 2;
    const labelX = this.centerX + Math.cos(midAngle) * labelRadius;
    const labelY = this.centerY + Math.sin(midAngle) * labelRadius;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (isActive) {
      this.ctx.font = 'bold 22px "Outfit", sans-serif';
      this.ctx.fillStyle = '#000000';
      this.ctx.fillText(note.name, labelX, labelY);
    } else {
      this.ctx.font = '700 19px "Outfit", sans-serif';
      
      // Outline stroke for 100% visibility over any background
      this.ctx.lineWidth = 3;
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
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.stroke();

    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 / 60) * i;
      const isMajor = i % 5 === 0;
      const r1 = this.outerRadius + 3;
      const r2 = this.outerRadius + (isMajor ? 10 : 6);

      this.ctx.beginPath();
      this.ctx.moveTo(this.centerX + Math.cos(angle) * r1, this.centerY + Math.sin(angle) * r1);
      this.ctx.lineTo(this.centerX + Math.cos(angle) * r2, this.centerY + Math.sin(angle) * r2);
      this.ctx.lineWidth = isMajor ? 2 : 1;
      this.ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)';
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawCenterHub(waveformData, currentFreq) {
    this.ctx.save();

    // Dark Center Hub
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius - 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.ctx.fill();

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.stroke();

    // Audio Waveform Ring
    if (waveformData && waveformData.length > 0 && this.activeNoteIndex >= 0) {
      this.ctx.beginPath();
      const waveRadius = this.innerRadius * 0.65;
      const sliceAngle = (Math.PI * 2) / waveformData.length;

      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const r = waveRadius + (v - 1) * 12;
        const angle = i * sliceAngle;
        const x = this.centerX + Math.cos(angle) * r;
        const y = this.centerY + Math.sin(angle) * r;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.activeNoteIndex >= 0) {
      const activeNote = this.notes[this.activeNoteIndex];
      this.ctx.font = 'bold 24px "Outfit", sans-serif';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(activeNote.name, this.centerX, this.centerY - 5);

      if (currentFreq) {
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(`${Math.round(currentFreq)} Hz`, this.centerX, this.centerY + 14);
      }
    } else {
      this.ctx.font = '600 10px "Outfit", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText('HOVER NOTE', this.centerX, this.centerY - 4);

      this.ctx.font = '9px sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillText('A ➔ G#', this.centerX, this.centerY + 10);
    }

    this.ctx.restore();
  }

  drawCursorOverlay(cursorPos) {
    this.ctx.save();
    
    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, 15, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();

    this.ctx.restore();
  }

  getNoteAtPosition(pos) {
    if (!pos || pos.x < 0 || pos.y < 0) return -1;

    const dx = pos.x - this.centerX;
    const dy = pos.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.innerRadius || dist > this.outerRadius + 12) {
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
