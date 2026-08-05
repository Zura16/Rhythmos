// Real-Time Vision Hand Tracking with 1:1 Fullscreen Camera Alignment & Ergonomic Calibrated Y-Range
export class VisionTracker {
  constructor(videoElement, canvasElement, onHandMoveCallback) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onHandMove = onHandMoveCallback;

    this.hands = null;
    this.camera = null;
    this.isRunning = false;

    // Smoothed Finger Tip Screen Coordinates
    this.cursorX = -1;
    this.cursorY = -1;
    this.smoothingFactor = 0.4; // EMA lerp factor

    // Hand Landmark Connections for Skeleton Drawing
    this.handConnections = [
      [0,1],[1,2],[2,3],[3,4], // Thumb
      [0,5],[5,6],[6,7],[7,8], // Index
      [5,9],[9,10],[10,11],[11,12], // Middle
      [9,13],[13,14],[14,15],[15,16], // Ring
      [13,17],[17,18],[18,19],[19,20],[0,17] // Pinky & Palm
    ];
  }

  async init() {
    if (typeof window.Hands === 'undefined') {
      console.warn('MediaPipe Hands CDN script not loaded yet.');
      return false;
    }

    try {
      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
      });

      this.hands.onResults((results) => this.handleResults(results));

      return true;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Hands:', err);
      return false;
    }
  }

  async startCamera() {
    if (!this.hands) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      this.video.srcObject = stream;
      await this.video.play();

      if (typeof window.Camera !== 'undefined') {
        this.camera = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.isRunning) {
              await this.hands.send({ image: this.video });
            }
          },
          width: 1280,
          height: 720
        });
        await this.camera.start();
      } else {
        const processFrame = async () => {
          if (this.isRunning) {
            await this.hands.send({ image: this.video });
            requestAnimationFrame(processFrame);
          }
        };
        processFrame();
      }

      this.isRunning = true;
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      this.isRunning = false;
      return false;
    }
  }

  stopCamera() {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    this.cursorX = -1;
    this.cursorY = -1;
  }

  // Convert MediaPipe landmark (0..1) to Fullscreen Canvas Pixel Coordinates (matching object-fit: cover)
  mapLandmarkToScreen(lm) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Default camera aspect ratio 16/9
    const videoAspect = (this.video.videoWidth && this.video.videoHeight)
      ? (this.video.videoWidth / this.video.videoHeight)
      : (16 / 9);
    
    const screenAspect = W / H;

    let renderW, renderH, offsetX, offsetY;

    if (screenAspect > videoAspect) {
      // Screen is wider than video aspect -> Video scaled to match Width
      renderW = W;
      renderH = W / videoAspect;
      offsetX = 0;
      offsetY = (H - renderH) / 2;
    } else {
      // Screen is taller than video aspect -> Video scaled to match Height
      renderH = H;
      renderW = H * videoAspect;
      offsetX = (W - renderW) / 2;
      offsetY = 0;
    }

    // Mirror X (1 - lm.x)
    const normX = 1 - lm.x;
    
    // Ergonomic Vertical Calibration Range:
    // Human hands float comfortably in camera Y range [0.08, 0.82].
    // Map [0.08, 0.82] smoothly to full screen [0, 1] so user doesn't need to reach below camera view!
    const minY = 0.08;
    const maxY = 0.82;
    const calibratedY = Math.max(0, Math.min(1, (lm.y - minY) / (maxY - minY)));

    const screenX = normX * renderW + offsetX;
    const screenY = calibratedY * H;

    return { x: screenX, y: screenY };
  }

  handleResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.cursorX = -1;
      this.cursorY = -1;
      if (this.onHandMove) this.onHandMove(null, null);
      return;
    }

    const rawLandmarks = results.multiHandLandmarks[0];

    // Map all hand landmarks to full screen coordinates
    const screenLandmarks = rawLandmarks.map(lm => this.mapLandmarkToScreen(lm));

    // Landmark 8 is INDEX_FINGER_TIP
    const indexTip = screenLandmarks[8];

    // EMA smoothing for finger tip cursor
    if (this.cursorX < 0) {
      this.cursorX = indexTip.x;
      this.cursorY = indexTip.y;
    } else {
      this.cursorX = this.cursorX + (indexTip.x - this.cursorX) * this.smoothingFactor;
      this.cursorY = this.cursorY + (indexTip.y - this.cursorY) * this.smoothingFactor;
    }

    if (this.onHandMove) {
      this.onHandMove({
        x: this.cursorX,
        y: this.cursorY,
        isCamera: true
      }, screenLandmarks);
    }
  }
}
