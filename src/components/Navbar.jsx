import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  ChevronDown, 
  Video, 
  SlidersHorizontal, 
  Mic, 
  Bell, 
  Sparkles, 
  Volume2, 
  Compass, 
  Radio
} from 'lucide-react';

const INSTRUMENTS = [
  { key: 'harmonium', name: 'Harmonium', icon: '🪗', desc: 'Indian Free-Reed Bellows' },
  { key: 'piano', name: 'Grand Piano', icon: '🎹', desc: 'Steinway Acoustic Grand' },
  { key: 'guitar', name: 'Nylon Guitar', icon: '🎸', desc: 'Plucked Acoustic Guitar' },
  { key: 'strings', name: 'Symphonic Strings', icon: '🎻', desc: 'Bowed Orchestral Section' },
  { key: 'marimba', name: 'Concert Marimba', icon: '🪵', desc: 'Rosewood Bar Mallet' },
  { key: 'rhodes', name: 'Vintage Rhodes', icon: '⚡', desc: 'Classic Tine Electric Piano' },
  { key: 'organ', name: 'Church Organ', icon: '⛪', desc: 'Symphonic Pipe Ranks' }
];

export function Navbar({
  currentInstrument,
  onSelectInstrument,
  currentOctave,
  onSelectOctave,
  isCameraActive,
  onToggleCamera,
  volume,
  onVolumeChange,
  reverb,
  onReverbChange,
  onToggleSongbook,
  onTestAudio,
  audioStatusText
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const activeInstObj = INSTRUMENTS.find(i => i.key === currentInstrument) || INSTRUMENTS[0];

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  return (
    <header className="header-navbar" ref={dropdownRef}>
      <div className="header-container">
        
        {/* Brand Block */}
        <div className="nav-brand-block">
          <a href="#" className="brand-link">
            <div className="logo-badge">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div class="brand-title">
              <h1>Rhythmos</h1>
              <span>A to G# Scale</span>
            </div>
          </a>
        </div>

        {/* Dropdown Navigation Group */}
        <nav className="nav-dropdown-group">
          
          {/* Dropdown 1: Instrument Selector (Shows Active Instrument at Top!) */}
          <div className={`nav-item dropdown ${activeDropdown === 'instrument' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn flex items-center gap-2"
              onClick={() => toggleDropdown('instrument')}
            >
              <span className="text-xl">{activeInstObj.icon}</span>
              <span className="font-bold">{activeInstObj.name}</span>
              <ChevronDown className="chevron-icon w-4 h-4 ml-1" />
            </button>

            {activeDropdown === 'instrument' && (
              <div className="dropdown-content-card shadow-2xl" style={{ width: '290px' }}>
                <div className="dropdown-header">Select Acoustic Instrument</div>
                <ul className="nav-menu-grid">
                  {INSTRUMENTS.map(inst => (
                    <li key={inst.key}>
                      <button 
                        className={`nav-item-card ${currentInstrument === inst.key ? 'active' : ''}`}
                        onClick={() => {
                          onSelectInstrument(inst.key);
                          setActiveDropdown(null);
                        }}
                      >
                        <div className="card-icon">{inst.icon}</div>
                        <div className="card-text">
                          <div className="font-semibold text-sm">{inst.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{inst.desc}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Dropdown 2: Camera & Vision Control */}
          <div className={`nav-item dropdown ${activeDropdown === 'vision' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn flex items-center gap-2"
              onClick={() => toggleDropdown('vision')}
            >
              <Video className="w-4 h-4" />
              <span>Vision</span>
              <ChevronDown className="chevron-icon w-4 h-4" />
            </button>

            {activeDropdown === 'vision' && (
              <div className="dropdown-content-card" style={{ width: '250px' }}>
                <div className="dropdown-header">Hand Tracking Vision</div>
                <div className="p-2">
                  <button 
                    className={`btn-primary ${isCameraActive ? 'bg-rose-500 text-white hover:bg-rose-600' : ''}`}
                    onClick={() => {
                      onToggleCamera();
                      setActiveDropdown(null);
                    }}
                  >
                    <Video className="w-4 h-4" />
                    <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                  </button>
                  <div className="badge mt-2" style={{ width: '100%', justifyContent: 'center' }}>
                    <span className={`badge-dot ${isCameraActive ? 'active' : ''}`}></span>
                    <span>{isCameraActive ? 'Vision Active' : 'Camera Off'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown 3: Octave Pitch Selection */}
          <div className={`nav-item dropdown ${activeDropdown === 'octave' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn flex items-center gap-2"
              onClick={() => toggleDropdown('octave')}
            >
              <Radio className="w-4 h-4" />
              <span>Octave ({currentOctave})</span>
              <ChevronDown className="chevron-icon w-4 h-4" />
            </button>

            {activeDropdown === 'octave' && (
              <div className="dropdown-content-card" style={{ width: '250px' }}>
                <div className="dropdown-header">Pitch Octave Range</div>
                <div className="p-2">
                  <div className="octave-bar">
                    {[2, 3, 4, 5, 6].map(oct => (
                      <button
                        key={oct}
                        className={`oct-btn ${currentOctave === oct ? 'active' : ''}`}
                        onClick={() => {
                          onSelectOctave(oct);
                          setActiveDropdown(null);
                        }}
                      >
                        {oct}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown 4: Audio Mix & Reverb Sliders */}
          <div className={`nav-item dropdown ${activeDropdown === 'mix' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn flex items-center gap-2"
              onClick={() => toggleDropdown('mix')}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Audio Mix</span>
              <ChevronDown className="chevron-icon w-4 h-4" />
            </button>

            {activeDropdown === 'mix' && (
              <div className="dropdown-content-card" style={{ width: '270px' }}>
                <div className="dropdown-header">Master Sound Controls</div>
                <div className="p-2 flex flex-col gap-3">
                  <div className="control-group">
                    <div className="control-label">
                      <span>Master Volume</span>
                      <span>{volume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="control-group">
                    <div className="control-label">
                      <span>Concert Reverb</span>
                      <span>{reverb}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={reverb} 
                      onChange={(e) => onReverbChange(parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </nav>

        {/* Right Header Actions */}
        <div className="header-actions-group">
          {/* Songbook Toggle */}
          <button 
            className="nav-action-btn songbook-trigger flex items-center gap-2"
            onClick={onToggleSongbook}
          >
            <Mic className="w-4 h-4" />
            <span>Songbook Lyrics</span>
          </button>

          {/* Quick Audio Test */}
          <button 
            className="nav-action-btn flex items-center gap-2"
            onClick={onTestAudio}
          >
            <Bell className="w-4 h-4" />
            <span>Test Note</span>
          </button>

          {/* Audio Status Badge */}
          <div className="badge">
            <span className={`badge-dot ${audioStatusText && audioStatusText !== 'Audio Idle' ? 'active' : ''}`}></span>
            <span>{audioStatusText || 'Audio Idle'}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
