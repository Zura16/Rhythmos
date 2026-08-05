// 24-Sector Single-Circle Chord Wheel with Dynamic Radial Octave Shift & Translucent Light Glass Styling
export class NoteWheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 24 Single-Circle Chord Sectors (Major and Minor side-by-side around the full circle)
    this.roots = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    
    this.chords = [];
    this.roots.forEach(root => {
      this.chords.push({ root, quality: 'major', label: `${root} Maj` });
      this.chords.push({ root, quality: 'minor', label: `${root} min` });
    });

    this.activeChord = null; // { root, quality, octaveOffset, index }
    
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

    // 2. Draw 24 Single-Circle Chord Sectors
    for (let i = 0; i < 24; i++) {
      const isActive = this.activeChord && this.activeChord.index === i;
      this.drawSector(i, isActive);
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
    const chord = this.chords[index];
    const startAngle = -Math.PI / 2 + index * this.sectorAngle - this.sectorAngle / 2;
    const endAngle = startAngle + this.sectorAngle;

    this.ctx.save();
    this.ctx.shadowBlur = 0;

    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.outerRadius, startAngle, endAngle, false);
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius, endAngle, startAngle, true);
    this.ctx.closePath();

    if (isActive) {
      // Active Chord Hover: Solid White Fill
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();

      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = '#0F172A';
      this.ctx.stroke();
    } else {
      // Light Translucent Glass Grey (Major = slightly brighter glass, Minor = soft slate glass)
      const isMajor = chord.quality === 'major';
      this.ctx.fillStyle = isMajor ? 'rgba(240, 245, 250, 0.42)' : 'rgba(220, 228, 238, 0.35)';
      this.ctx.fill();

      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      this.ctx.stroke();
    }

    // Sector Label Typography
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
      this.ctx.fillStyle = '#0F172A';
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
    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawCenterHub(waveformData) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;

    // Translucent Central Glass Hub
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.innerRadius - 2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(241, 245, 249, 0.82)';
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
      this.ctx.strokeStyle = '#0F172A';
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
      this.ctx.fillStyle = '#0F172A';
      this.ctx.fillText(`${root} ${q}`, this.centerX, this.centerY - 5);

      this.ctx.font = '9px monospace';
      this.ctx.fillStyle = '#334155';
      this.ctx.fillText(`CHORD${octShiftTag}`, this.centerX, this.centerY + 10);
    } else {
      this.ctx.font = '600 10px "Outfit", sans-serif';
      this.ctx.fillStyle = '#334155';
      this.ctx.fillText('HOVER CHORD', this.centerX, this.centerY - 4);

      this.ctx.font = '8px sans-serif';
      this.ctx.fillStyle = '#475569';
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
    
    // Fast Distance-Based Octave Shift: Outer half of radius shifts pitch up +1 Octave!
    const octaveOffset = (dist > this.midRadius) ? 1 : 0;

    return {
      root: chordInfo.root,
      quality: chordInfo.quality,
      octaveOffset: octaveOffset,
      index: sectorIndex
    };
  }

  triggerRipple(noteIndex) {}
}
