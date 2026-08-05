import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Video, 
  Sliders, 
  Volume2, 
  BookOpen, 
  ChevronDown, 
  Check, 
  Bell, 
  Radio,
  Sparkles,
  Layers
} from 'lucide-react';

export const INSTRUMENTS_LIST = [
  { id: 'harmonium', name: 'Harmonium', icon: '🪗', desc: 'Authentic Indian free-reed organ with air bellows' },
  { id: 'piano', name: 'Grand Piano', icon: '🎹', desc: 'Steinway acoustic string harmonics & soundboard resonance' },
  { id: 'guitar', name: 'Nylon Guitar', icon: '🎸', desc: 'Plucked nylon string physical modeling with body resonance' },
  { id: 'strings', name: 'Symphonic Strings', icon: '🎻', desc: 'Bowed violin ensemble with natural 5.2Hz vibrato' },
  { id: 'marimba', name: 'Concert Marimba', icon: '🪵', desc: 'Rosewood bar fundamental & aluminum tube resonator' },
  { id: 'rhodes', name: 'Vintage Rhodes', icon: '⚡', desc: 'Tine bell strike attack & warm electric tone' },
  { id: 'organ', name: 'Church Organ', icon: '⛪', desc: 'Multi-rank cathedral pipe organ (8\', 4\', 2\')' }
];

export function Header({
  currentInstrument,
  onSelectInstrument,
  isCameraActive,
  onToggleCamera,
  currentOctave,
  onSelectOctave,
  volume,
  onChangeVolume,
  reverb,
  onChangeReverb,
  onToggleSongbook,
  onTestAudio,
  audioStatus
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const headerRef = useRef(null);

  const activeInstObj = INSTRUMENTS_LIST.find(i => i.id === currentInstrument) || INSTRUMENTS_LIST[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName) => {
    setOpenDropdown(prev => prev === menuName ? null : menuName);
  };

  return (
    <header className="header-navbar" ref={headerRef}>
      <div className="header-container">
        
        {/* Brand Block */}
        <div className="nav-brand-block">
          <a href="#" className="brand-link">
            <div className="logo-badge">🎵</div>
            <div className="brand-title">
              <h1>Rhythmos</h1>
              <span>A to G# Scale</span>
            </div>
          </a>
        </div>

        {/* React Desktop Navigation Menu */}
        <nav className="nav-dropdown-group">
          
          {/* Dropdown 1: Instrument Selector (Shows Active Selected Instrument at Top!) */}
          <div className={`nav-item ${openDropdown === 'instrument' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn dropdown-toggle" 
              onClick={() => toggleMenu('instrument')}
              aria-expanded={openDropdown === 'instrument'}
            >
              <span className="flex items-center gap-2">
                <span>{activeInstObj.icon}</span>
                <span>{activeInstObj.name}</span>
              </span>
              <ChevronDown className="w-4 h-4 chevron-icon" />
            </button>

            {openDropdown === 'instrument' && (
              <div className="dropdown-content-card" style={{ width: '330px' }}>
                <div className="dropdown-header">Select Instrument</div>
                <ul className="nav-menu-grid">
                  {INSTRUMENTS_LIST.map((inst) => {
                    const isSelected = inst.id === currentInstrument;
                    return (
                      <li key={inst.id}>
                        <button
                          className={`nav-item-card ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            onSelectInstrument(inst.id);
                            setOpenDropdown(null);
                          }}
                        >
                          <span className="card-icon">{inst.icon}</span>
                          <div className="card-text">
                            <div className="font-semibold text-sm">{inst.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{inst.desc}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 ml-auto" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Dropdown 2: Camera & Vision Controls */}
          <div className={`nav-item ${openDropdown === 'vision' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn dropdown-toggle"
              onClick={() => toggleMenu('vision')}
            >
              <Video className="w-4 h-4 text-slate-700" />
              <span>Vision</span>
              <ChevronDown className="w-4 h-4 chevron-icon" />
            </button>

            {openDropdown === 'vision' && (
              <div className="dropdown-content-card" style={{ width: '260px' }}>
                <div className="dropdown-header">Camera Control</div>
                <div className="p-2">
                  <button 
                    className="btn-primary mb-3"
                    onClick={() => {
                      onToggleCamera();
                      setOpenDropdown(null);
                    }}
                  >
                    <Video className="w-4 h-4" />
                    <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                  </button>

                  <div className="badge w-full justify-center">
                    <span className={`badge-dot ${isCameraActive ? 'active' : ''}`}></span>
                    <span>{isCameraActive ? 'Vision Active' : 'Camera Off'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dropdown 3: Octave Pitch Range */}
          <div className={`nav-item ${openDropdown === 'octave' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn dropdown-toggle"
              onClick={() => toggleMenu('octave')}
            >
              <Layers className="w-4 h-4 text-slate-700" />
              <span>Octave ({currentOctave})</span>
              <ChevronDown className="w-4 h-4 chevron-icon" />
            </button>

            {openDropdown === 'octave' && (
              <div className="dropdown-content-card" style={{ width: '260px' }}>
                <div className="dropdown-header">Octave Pitch Range</div>
                <div className="p-2">
                  <div className="octave-bar">
                    {[2, 3, 4, 5, 6].map((oct) => (
                      <button
                        key={oct}
                        className={`oct-btn ${currentOctave === oct ? 'active' : ''}`}
                        onClick={() => {
                          onSelectOctave(oct);
                          setOpenDropdown(null);
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

          {/* Dropdown 4: Audio Mix & Master Sound Controls */}
          <div className={`nav-item ${openDropdown === 'audio' ? 'open' : ''}`}>
            <button 
              className="nav-trigger-btn dropdown-toggle"
              onClick={() => toggleMenu('audio')}
            >
              <Sliders className="w-4 h-4 text-slate-700" />
              <span>Audio Mix</span>
              <ChevronDown className="w-4 h-4 chevron-icon" />
            </button>

            {openDropdown === 'audio' && (
              <div className="dropdown-content-card" style={{ width: '280px' }}>
                <div className="dropdown-header">Master Sound Controls</div>
                <div className="p-2 flex flex-col gap-4">
                  <div className="control-group">
                    <div className="control-label">
                      <span>Master Volume</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={Math.round(volume * 100)}
                      onChange={(e) => onChangeVolume(parseInt(e.target.value, 10) / 100)}
                    />
                  </div>

                  <div className="control-group">
                    <div className="control-label">
                      <span>Concert Reverb</span>
                      <span>{Math.round(reverb * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={Math.round(reverb * 100)}
                      onChange={(e) => onChangeReverb(parseInt(e.target.value, 10) / 100)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </nav>

        {/* Right Header Actions */}
        <div className="header-actions-group">
          {/* Songbook Teleprompter Action Button */}
          <button className="nav-action-btn songbook-trigger" onClick={onToggleSongbook}>
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span>Songbook Lyrics</span>
          </button>

          {/* Quick Audio Test Button */}
          <button className="nav-action-btn" onClick={onTestAudio}>
            <Bell className="w-4 h-4 text-slate-300" />
            <span>Test Note</span>
          </button>

          {/* Live Audio Status Indicator */}
          <div className="badge" id="audioBadge">
            <span className={`badge-dot ${audioStatus.active ? 'active' : ''}`}></span>
            <span>{audioStatus.text}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
