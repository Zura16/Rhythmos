// 24-Sector Color-Coded Chord Wheel with Light (Major) & Dark (Minor) Shades + Translucent Background
export class NoteWheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 12 Pitch Classes with Color Families
    this.pitchFamilies = {
      'A':  { light: 'rgba(255, 105, 135, 0.45)', dark: 'rgba(160, 20, 50, 0.48)' },
      'A#': { light: 'rgba(186, 104, 200, 0.45)', dark: 'rgba(106, 27, 120, 0.48)' },
      'B':  { light: 'rgba(149, 117, 205, 0.45)', dark: 'rgba(74, 20, 140, 0.48)' },
      'C':  { light: 'rgba(128, 222, 234, 0.50)', dark: 'rgba(0, 131, 143, 0.50)' },
      'C#': { light: 'rgba(77, 182, 172, 0.45)',  dark: 'rgba(0, 77, 64, 0.48)' },
      'D':  { light: 'rgba(105, 240, 174, 0.45)', dark: 'rgba(27, 94, 32, 0.48)' },
      'D#': { light: 'rgba(129, 199, 132, 0.45)', dark: 'rgba(27, 94, 32, 0.48)' },
      'E':  { light: 'rgba(244, 255, 129, 0.45)', dark: 'rgba(130, 150, 0, 0.48)' },
      'F':  { light: 'rgba(255, 229, 127, 0.45)', dark: 'rgba(180, 140, 0, 0.48)' },
      'F#': { light: 'rgba(255, 158, 128, 0.45)', dark: 'rgba(191, 54, 12, 0.48)' },
      'G':  { light: 'rgba(255, 138, 128, 0.45)', dark: 'rgba(183, 28, 28, 0.48)' },
      'G#': { light: 'rgba(240, 98, 146, 0.45)',  dark: 'rgba(136, 14, 79, 0.48)' }
    };

    this.roots = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    
    this.chords = [];
    this.roots.forEach(root => {
      this.chords.push({ root, quality: 'major', label: `${root} Maj` });
      this.chords.push({ root, quality: 'minor', label: `${root} min` });
    });

    this.activeChord = null; // { root, quality, octaveOffset, index }
    this.highlightedChordStr = null; // Sync from Songbook chord click
    
    this.centerX = 0;
    this.centerY = 0;
    this.outerRadius = 0;
    this.midRadius = 0;
    this.innerRadius = 0;
    this.sectorAngle = (Math.PI * 2) / 24; // 15 degrees per slice

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
    
    const minDim = Math.min(W, H);
    this.outerRadius = minDim * 0.28;
    this.midRadius = minDim * 0.19;
    this.innerRadius = minDim * 0.10;
  }

  draw(cursorPos, screenLandmarks = null, activeWaveformData = null) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    this.ctx.clearRect(0, 0, W, H);

    this.activeChord = this.getNoteAtPosition(cursorPos);

    // 1. Draw Clean Hand Skeleton
    if (screenLandmarks && screenLandmarks.length > 0) {
      this.drawHandSkeleton(screenLandmarks);
    }

    // 2. Draw 24 Color-Coded Chord Sectors (Major = Light, Minor = Dark)
    for (let i = 0; i < 24; i++) {
      const isActive = this.activeChord && this.activeChord.index === i;
      const isSongHighlight = this.isChordHighlighted(this.chords[i]);
      this.drawSector(i, isActive, isSongHighlight);
    }

    // 3. Draw Outer & Octave Guidance Rings
    this.drawRings();

    // 4. Draw Center Glass Hub & Audio Waveform Visualizer
    this.drawCenterHub(activeWaveformData);

    // 5. Draw Clean Finger Target Reticle
    if (cursorPos && cursorPos.x >= 0 && cursorPos.y >= 0) {
      this.drawCursorOverlay(cursorPos);
    }
  }

  isChordHighlighted(chordObj) {
    if (!this.highlightedChordStr) return false;
    const qStr = (chordObj.quality === 'major') ? 'Maj' : 'm';
    const targetNorm = this.highlightedChordStr.toLowerCase();
    const cName = chordObj.root.toLowerCase();
    
    if (chordObj.quality === 'major') {
      return targetNorm === cName || targetNorm === `${cName}maj` || targetNorm === `${cName} major`;
    } else {
      return targetNorm === `${cName}m` || targetNorm === `${cName}min` || targetNorm === `${cName} minor`;
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

  drawSector(index, isActive, isSongHighlight = false) {
    const chord = this.chords[index];
    const startAngle = -Math.PI / 2 + index * this.sectorAngle - this.sectorAngle / 2;
    const endAngle = startAngle + this.sectorAngle;

    const family = this.pitchFamilies[chord.root] || { light: 'rgba(235, 240, 245, 0.42)', dark: 'rgba(180, 190, 205, 0.42)' };
    const sectorColor = (chord.quality === 'major') ? family.light : family.dark;

    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius, startAngle, endAngle, false);
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius, endAngle, startAngle, true);
    this.ctx.closePath();

    if (isActive) {
      // Active Chord Hover: Solid White Fill with Crisp Dark Border
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowColor = '#FFFFFF';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = '#0F172A';
      this.ctx.stroke();
    } else if (isSongHighlight) {
      // Songbook Highlighted Chord: Pulsing Bright White Border
      this.ctx.fillStyle = sectorColor;
      this.ctx.fill();

      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.shadowColor = '#FFFFFF';
      this.ctx.shadowBlur = 12;
      this.ctx.stroke();
    } else {
      // Translucent Color-Coded Glass (Major = Lighter, Minor = Darker shade of same pitch color!)
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = sectorColor;
      this.ctx.fill();

      this.ctx.lineWidth = 1.2;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.stroke();
    }

    // Typography
    const midAngle = startAngle + this.sectorAngle / 2;
    const labelRadius = (this.innerRadius + this.outerRadius) / 2;
    const labelX = this.centerX + Math.cos(midAngle) * labelRadius;
    const labelY = this.centerY + Math.sin(midAngle) * labelRadius;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (isActive) {
      this.ctx.font = 'bold 13px "Outfit", sans-serif';
      this.ctx.fillStyle = '#000000';
    } else {
      this.ctx.font = (chord.quality === 'major') ? '600 11px "Outfit", sans-serif' : '500 10px "Outfit", sans-serif';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 4;
    }

    this.ctx.fillText(chord.label, labelX, labelY);

    this.ctx.restore();
  }

  drawRings() {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    // Outer Circle Edge
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius + 1, 0, Math.PI * 2);
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.stroke();

    // Dotted Mid-Radius Guide Ring for Fast Octave Shift
    this.ctx.beginPath();
    this.ctx.setLineDash([3, 4]);
    this.ctx.arc(this.centerX, this.centerY, this.midRadius, 0, Math.PI * 2);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCenterHub(waveformData) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    // Translucent Central Glass Hub
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius - 2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fill();

    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    this.ctx.stroke();

    // Waveform Ring
    if (waveformData && waveformData.length > 0 && this.activeChord) {
      this.ctx.beginPath();
      const waveRadius = this.innerRadius * 0.65;
      const sliceAngle = (Math.PI * 2) / waveformData.length;

      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const r = waveRadius + (v - 1) * 8;
        const angle = i * sliceAngle;
        const x = this.centerX + Math.cos(angle) * r;
        const y = this.centerY + Math.sin(angle) * r;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = '#00E5FF';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (this.activeChord) {
      const root = this.activeChord.root;
      const q = (this.activeChord.quality === 'major') ? 'Maj' : 'min';
      const octShiftTag = (this.activeChord.octaveOffset > 0) ? ' (+1 Oct)' : '';

      this.ctx.font = 'bold 15px "Outfit", sans-serif';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(`${root} ${q}`, this.centerX, this.centerY - 5);

      this.ctx.font = '9px monospace';
      this.ctx.fillStyle = '#00E5FF';
      this.ctx.fillText(`CHORD${octShiftTag}`, this.centerX, this.centerY + 10);
    } else {
      this.ctx.font = '600 10px "Outfit", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText('HOVER CHORD', this.centerX, this.centerY - 4);

      this.ctx.font = '8px sans-serif';
      this.ctx.fillStyle = '#94A3B8';
      this.ctx.fillText('Outer = +1 Octave', this.centerX, this.centerY + 9);
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
    if (!pos || pos.x < 0 || pos.y < 0) return null;

    const dx = pos.x - this.centerX;
    const dy = pos.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.innerRadius || dist > this.outerRadius + 12) {
      return null;
    }

    let angle = Math.atan2(dy, dx) - (-Math.PI / 2) + (this.sectorAngle / 2);

    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;

    const sectorIndex = Math.floor(angle / this.sectorAngle) % 24;
    const chordInfo = this.chords[sectorIndex];
    
    const octaveOffset = (dist > this.midRadius) ? 1 : 0;

    return {
      root: chordInfo.root,
      quality: chordInfo.quality,
      octaveOffset: octaveOffset,
      index: sectorIndex
    };
  }

  setHighlightedChord(chordStr) {
    this.highlightedChordStr = chordStr;
  }

  triggerRipple(noteIndex) {}
}
