// Chromatic Note Wheel Renderer - Light Translucent Glass Grey Theme & Right-Side Placement
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

    this.ctx.scale(dpr, dpr);

    // Firmly position wheel on the RIGHT SIDE of the screen
    this.centerX = W * 0.78;
    this.centerY = H * 0.54;
    
    // Compact size
    const minDim = Math.min(W, H);
    this.outerRadius = minDim * 0.25;
    this.innerRadius = minDim * 0.10;
  }

  draw(cursorPos, screenLandmarks = null, activeWaveformData = null, currentFreq = null) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    this.ctx.clearRect(0, 0, W, H);

    this.activeNoteIndex = this.getNoteAtPosition(cursorPos);

    // 1. Draw Clean Hand Skeleton
    if (screenLandmarks && screenLandmarks.length > 0) {
      this.drawHandSkeleton(screenLandmarks);
    }

    // 2. Draw 12 Light Translucent Grey Note Sectors
    for (let i = 0; i < 12; i++) {
      this.drawSector(i, i === this.activeNoteIndex);
    }

    // 3. Draw Clean Outer Ring
    this.drawOuterRing();

    // 4. Draw Center Hub & Waveform Visualizer
    this.drawCenterHub(activeWaveformData, currentFreq);

    // 5. Draw Clean Finger Target Reticle
    if (cursorPos && cursorPos.x >= 0 && cursorPos.y >= 0) {
      this.drawCursorOverlay(cursorPos);
    }
  }

  drawHandSkeleton(landmarks) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    this.handConnections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    landmarks.forEach((pt, idx) => {
      const isIndexTip = idx === 8;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, isIndexTip ? 6 : 3, 0, Math.PI * 2);
      this.ctx.fillStyle = isIndexTip ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawSector(index, isActive) {
    const note = this.notes[index];
    const startAngle = -Math.PI / 2 + index * this.sectorAngle - this.sectorAngle / 2;
    const endAngle = startAngle + this.sectorAngle;

    this.ctx.save();
    this.ctx.shadowBlur = 0;

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius, startAngle, endAngle, false);
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius, endAngle, startAngle, true);
    this.ctx.closePath();

    if (isActive) {
      // Active Note: Solid White Highlight
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();

      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = '#0F172A';
      this.ctx.stroke();
    } else {
      // LIGHT TRANSLUCENT GREY GLASS (allows background camera video to show through!)
      this.ctx.fillStyle = 'rgba(235, 240, 245, 0.38)';
      this.ctx.fill();

      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.stroke();
    }

    // High Contrast Text
    const midAngle = startAngle + this.sectorAngle / 2;
    const labelRadius = (this.innerRadius + this.outerRadius) / 2;
    const labelX = this.centerX + Math.cos(midAngle) * labelRadius;
    const labelY = this.centerY + Math.sin(midAngle) * labelRadius;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (isActive) {
      this.ctx.font = 'bold 20px "Outfit", sans-serif';
      this.ctx.fillStyle = '#000000';
    } else {
      this.ctx.font = '600 17px "Outfit", sans-serif';
      this.ctx.fillStyle = '#0F172A'; // Crisp Dark Text for easy reading over light translucent glass
    }

    this.ctx.fillText(note.name, labelX, labelY);

    this.ctx.restore();
  }

  drawOuterRing() {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius + 1, 0, Math.PI * 2);
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCenterHub(waveformData, currentFreq) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    // Translucent Central Circle Hub
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius - 2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
    this.ctx.fill();

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.stroke();

    // Waveform Ring
    if (waveformData && waveformData.length > 0 && this.activeNoteIndex >= 0) {
      this.ctx.beginPath();
      const waveRadius = this.innerRadius * 0.65;
      const sliceAngle = (Math.PI * 2) / waveformData.length;

      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const r = waveRadius + (v - 1) * 10;
        const angle = i * sliceAngle;
        const x = this.centerX + Math.cos(angle) * r;
        const y = this.centerY + Math.sin(angle) * r;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = '#0F172A';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.activeNoteIndex >= 0) {
      const activeNote = this.notes[this.activeNoteIndex];
      this.ctx.font = 'bold 22px "Outfit", sans-serif';
      this.ctx.fillStyle = '#0F172A';
      this.ctx.fillText(activeNote.name, this.centerX, this.centerY - 5);

      if (currentFreq) {
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#334155';
        this.ctx.fillText(`${Math.round(currentFreq)} Hz`, this.centerX, this.centerY + 12);
      }
    } else {
      this.ctx.font = '600 10px "Outfit", sans-serif';
      this.ctx.fillStyle = '#334155';
      this.ctx.fillText('HOVER NOTE', this.centerX, this.centerY - 4);

      this.ctx.font = '9px sans-serif';
      this.ctx.fillStyle = '#475569';
      this.ctx.fillText('A ➔ G#', this.centerX, this.centerY + 10);
    }

    this.ctx.restore();
  }

  drawCursorOverlay(cursorPos) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;
    
    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, 14, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(cursorPos.x, cursorPos.y, 3, 0, Math.PI * 2);
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

  triggerRipple(noteIndex) {
    // Ripple effect disabled
  }
}
