import { useState } from 'react';
import { BAJAJ_BIKES } from '../../utils/bikeConfig';
import { CHECKPOINTS } from '../../utils/trackPath';
import { engineAudio } from '../../utils/store';

export default function MainMenu({ selectedBike, setSelectedBike, onStartRace }) {
  const [activeTab, setActiveTab] = useState('garage'); // 'garage' | 'stunts' | 'circuit' | 'rewards' | 'controls'
  const [isAudioReady, setIsAudioReady] = useState(false);

  const handleStart = () => {
    engineAudio.init();
    if (onStartRace) onStartRace();
  };

  const handleRevEngine = () => {
    engineAudio.init();
    setIsAudioReady(true);
    engineAudio.updatePitch(0.85, true, false);
    setTimeout(() => {
      engineAudio.updatePitch(0.2, false, false);
    }, 650);
  };

  const handleTestHorn = () => {
    engineAudio.init();
    setIsAudioReady(true);
    engineAudio.playHorn();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: 'auto',
        background:
          'radial-gradient(circle at 50% 35%, rgba(6, 10, 18, 0.42) 0%, rgba(4, 7, 13, 0.85) 70%, rgba(2, 3, 6, 0.96) 100%)',
        color: '#ffffff',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        padding: 'clamp(12px, 2.5vh, 26px)',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* 1. TOP HEADER BAR: Festival Brand, Audio Controls & Navigation */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Left: Brand Crest & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e31c25 0%, #8a0c12 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              boxShadow: '0 4px 22px rgba(227, 28, 37, 0.55), 0 0 12px rgba(227,28,37,0.3)',
              border: '1.5px solid rgba(255,255,255,0.25)',
            }}
          >
            🏍️
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  letterSpacing: '2px',
                  color: '#f7b500',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🎉</span> बडा दशैँ २०८३ विशेष • KATHMANDU RING ROAD
              </span>
              <span
                style={{
                  fontSize: '9px',
                  background: 'linear-gradient(90deg, #e31c25, #ff4d4d)',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  letterSpacing: '1px',
                }}
              >
                60 FPS 3D
              </span>
            </div>
            <h1
              style={{
                margin: '2px 0 0 0',
                fontSize: 'clamp(22px, 3.8vw, 32px)',
                fontWeight: '900',
                fontStyle: 'italic',
                letterSpacing: '0.8px',
                color: '#ffffff',
                lineHeight: 1.1,
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              BAJAJ <span style={{ color: '#e31c25' }}>DASHAIN</span> RACING
            </h1>
          </div>
        </div>

        {/* Right: Sound Preview & Tab Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Sound Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleRevEngine}
              title="Test Engine Audio"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#00e5ff',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🔊</span> REV
            </button>
            <button
              onClick={handleTestHorn}
              title="Test Nepali Highway Horn"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#f7b500',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>📢</span> HORN
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(10, 14, 22, 0.75)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {[
              { id: 'garage', label: 'GARAGE 🏍️' },
              { id: 'stunts', label: 'STUNTS 🦅' },
              { id: 'circuit', label: 'CIRCUIT 🗺️' },
              { id: 'rewards', label: 'REWARDS 🎁' },
              { id: 'controls', label: 'CONTROLS 🎮' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '0.8px',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  background:
                    activeTab === tab.id
                      ? 'linear-gradient(135deg, #e31c25 0%, #b8141c 100%)'
                      : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#aaaaaa',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === tab.id ? '0 2px 10px rgba(227,28,37,0.5)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 2. CENTER CONTENT BODY (Translucent Overlays revealing 3D Showroom in Background) */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 0',
        }}
      >
        {/* TAB 1: 3D GARAGE & MACHINE SELECTOR */}
        {activeTab === 'garage' && (
          <div
            style={{
              width: '100%',
              maxWidth: '980px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Top Bike Selector Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '14px',
              }}
            >
              {BAJAJ_BIKES.map((bike) => {
                const isSelected = selectedBike.id === bike.id;
                return (
                  <div
                    key={bike.id}
                    onClick={() => {
                      setSelectedBike(bike);
                      if (isAudioReady) {
                        engineAudio.updatePitch(0.6, true, false);
                        setTimeout(() => engineAudio.updatePitch(0.2, false, false), 400);
                      }
                    }}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(28, 35, 48, 0.92) 0%, rgba(15, 20, 30, 0.92) 100%)'
                        : 'rgba(12, 16, 24, 0.72)',
                      backdropFilter: 'blur(12px)',
                      border: isSelected ? `2.5px solid ${bike.color}` : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                      transform: isSelected ? 'translateY(-4px)' : 'none',
                      boxShadow: isSelected
                        ? `0 12px 35px rgba(0,0,0,0.7), 0 0 25px ${bike.color}45`
                        : '0 4px 15px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '900',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isSelected ? bike.color : 'rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          letterSpacing: '1px',
                        }}
                      >
                        {bike.badge}
                      </span>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: bike.color,
                          boxShadow: `0 0 12px ${bike.color}`,
                        }}
                      />
                    </div>

                    <h3 style={{ margin: '0 0 2px 0', fontSize: '19px', fontWeight: '900', color: '#ffffff' }}>
                      {bike.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#f7b500', fontWeight: '700', marginBottom: '6px' }}>
                      {bike.nepali}
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#aaa', fontStyle: 'italic', minHeight: '30px' }}>
                      {bike.tagline}
                    </p>

                    {/* Stat Pills */}
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                      <div
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.06)',
                          padding: '6px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <span style={{ fontSize: '9px', color: '#888', display: 'block' }}>TOP SPEED</span>
                        <strong style={{ color: '#00e5ff' }}>{Math.round(bike.topSpeed * 2.35)} km/h</strong>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: 'rgba(255,255,255,0.06)',
                          padding: '6px',
                          borderRadius: '6px',
                          textAlign: 'center',
                        }}
                      >
                        <span style={{ fontSize: '9px', color: '#888', display: 'block' }}>NITRO BURST</span>
                        <strong style={{ color: '#f7b500' }}>{Math.round(bike.nitroTopSpeed * 2.35)} km/h</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Machine Full Spec & 3D Turntable Callout */}
            <div
              style={{
                background: 'rgba(10, 14, 22, 0.82)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#f7b500', fontWeight: '900', letterSpacing: '2px' }}>
                    SELECTED MACHINE
                  </span>
                  <span style={{ fontSize: '10px', color: '#00e5ff' }}>
                    ● 360° LIVE 3D PREVIEW IN BACKGROUND
                  </span>
                </div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '900', color: '#ffffff' }}>
                  {selectedBike.name}
                </h2>
                <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {selectedBike.description}
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Rider Gear Livery:</span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: selectedBike.color,
                        boxShadow: `0 0 8px ${selectedBike.color}`,
                      }}
                    />
                    <span style={{ fontWeight: '700', color: '#fff' }}>Bajaj Racing Leathers</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Animated Performance Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa' }}>TOP SPEED</span>
                    <span style={{ color: '#00e5ff' }}>{selectedBike.stats.speed} / 100</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedBike.stats.speed}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0099ff 0%, #00e5ff 100%)',
                        boxShadow: '0 0 10px #00e5ff',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa' }}>ACCELERATION & TORQUE</span>
                    <span style={{ color: '#f7b500' }}>{selectedBike.stats.accel} / 100</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedBike.stats.accel}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #ff9500 0%, #f7b500 100%)',
                        boxShadow: '0 0 10px #f7b500',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa' }}>CORNERING & STUNT AGILITY</span>
                    <span style={{ color: '#34c759' }}>{selectedBike.stats.handling} / 100</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedBike.stats.handling}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #28a745 0%, #34c759 100%)',
                        boxShadow: '0 0 10px #34c759',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROBLOX STUNTS & SPECIAL FEATURES */}
        {activeTab === 'stunts' && (
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              background: 'rgba(10, 14, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '900', letterSpacing: '2px' }}>
                ROBLOX ARCADE SUITE
              </span>
              <h2 style={{ margin: '4px 0 6px 0', fontSize: '28px', fontWeight: '900' }}>
                Stunts, Mega-Ramps & Highway Physics
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
                Experience full vertical airtime, wheelies with sparks, dynamic traffic weaving, and slipstream drafting.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              {[
                {
                  icon: '🦅',
                  title: 'Vertical Airtime Mega-Ramps',
                  desc: '8 high-angle launch ramps catapult your bike high above traffic into mid-air with true gravity arc, suspension landing bounce, and floating Neon Golden Rings (+1,000 pts)!',
                  color: '#00e5ff',
                },
                {
                  icon: '🔥',
                  title: 'The Wheelie Mechanic',
                  desc: 'Hold Space / Shift (or 🚀 WHEEL button) to pitch the front wheel up, balance on the rear tire, scrape footpegs with asphalt sparks, and earn continuous combo multipliers!',
                  color: '#ff007f',
                },
                {
                  icon: '🚌',
                  title: 'Dynamic Highway Traffic',
                  desc: 'Weave tightly between 14 moving Kathmandu vehicles: Sajha Yatayat green city buses, white HiAce microbuses, and red city taxis cruising along the 8 lanes.',
                  color: '#34c759',
                },
                {
                  icon: '💨',
                  title: 'Slipstream Turbo Drafting',
                  desc: 'Riding within 12m directly behind traffic catches their wind tunnel vortex. Hold draft for 1.5s to trigger an explosive +22 km/h supersonic boost!',
                  color: '#f7b500',
                },
                {
                  icon: '📢',
                  title: 'Nepali Highway Musical Horn',
                  desc: 'Press H (or 📢 button) to sound the classic dual-tone musical fanfare horn. Nearby highway traffic vehicles flash their hazard lights when honked at!',
                  color: '#ff9500',
                },
                {
                  icon: '⚡',
                  title: 'Anime Speed Lines & VFX',
                  desc: 'Exceeding 75 km/h triggers dynamic radial wind streaks, camera FOV expansion (up to 82°), chassis neon underglow, and puffy tire skid smoke.',
                  color: '#b026ff',
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${feat.color}40`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '26px' }}>{feat.icon}</span>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: feat.color }}>
                      {feat.title}
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KATHMANDU RING ROAD CIRCUIT GUIDE */}
        {activeTab === 'circuit' && (
          <div
            style={{
              width: '100%',
              maxWidth: '880px',
              background: 'rgba(10, 14, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '900', letterSpacing: '2px' }}>
                  GRAND PRIX TRACK
                </span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '26px', fontWeight: '900' }}>
                  Kathmandu Ring Road (काठमाडौँ चक्रपथ)
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  🛣️ <strong>3,300m</strong> Spline
                </span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  ⛰️ <strong>-6m to +16m</strong> Elevation
                </span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  🏁 <strong>12</strong> Checkpoints
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '18px' }}>
              Experience the full 3D roller-coaster circuit surrounding Kathmandu Valley: race across the 8-lane expressway, dive into the subterranean Kalanki Underpass (-6m), scale the Swayambhu hill crest (+16m), weave through the high-rise Roblox city of Gongabu, and fly down the Airport runway straight.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '10px',
                maxHeight: '280px',
                overflowY: 'auto',
                paddingRight: '6px',
              }}
            >
              {CHECKPOINTS.map((cp, idx) => (
                <div
                  key={cp.name}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: '#e31c25',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#fff',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
                      {cp.nepali} • {cp.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#f7b500' }}>{cp.desc || cp.landmark}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DASHAIN REWARDS PREVIEW */}
        {activeTab === 'rewards' && (
          <div
            style={{
              width: '100%',
              maxWidth: '860px',
              background: 'rgba(10, 14, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '900', letterSpacing: '2px' }}>
                OFFICIAL DASHAIN FESTIVAL PRIZES
              </span>
              <h2 style={{ margin: '4px 0 6px 0', fontSize: '28px', fontWeight: '900' }}>
                Race & Win Official Bajaj Vouchers
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
                Rack up points by clearing Neon Rings, holding high-speed wheelies, and dodging highway traffic to claim redeemable vouchers at Bajaj Nepal!
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '14px',
              }}
            >
              {[
                {
                  tier: 'TIER 1 (10,000+ PTS)',
                  title: 'Bajaj Racing Merchandise',
                  nepali: 'प्रिमियम ज्याकेट / हेल्मेट',
                  desc: 'Exclusive Bajaj Racing riding leathers, gloves, or full-face DOT helmet voucher.',
                  badge: 'LEGENDARY',
                  color: '#e31c25',
                },
                {
                  tier: 'TIER 2 (7,000+ PTS)',
                  title: '20% Service Voucher',
                  nepali: '२०% सर्भिस भौचर',
                  desc: 'Official 20% discount on labor & genuine parts at any authorized Bajaj service center.',
                  badge: 'GOLD',
                  color: '#f7b500',
                },
                {
                  tier: 'TIER 3 (4,000+ PTS)',
                  title: 'Official Keyring & Goodies',
                  nepali: 'बजाज कि-रिङ',
                  desc: 'Custom engraved Bajaj metallic keychain and commemorative Dashain stickers.',
                  badge: 'SILVER',
                  color: '#00e5ff',
                },
              ].map((reward) => (
                <div
                  key={reward.tier}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${reward.color}45`,
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: '900',
                        color: reward.color,
                        letterSpacing: '1px',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      {reward.tier}
                    </span>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: '800' }}>{reward.title}</h3>
                    <div style={{ fontSize: '12px', color: '#f7b500', marginBottom: '8px' }}>{reward.nepali}</div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>{reward.desc}</p>
                  </div>
                  <div
                    style={{
                      marginTop: '16px',
                      fontSize: '10px',
                      fontWeight: '800',
                      color: reward.color,
                      textAlign: 'center',
                      background: `${reward.color}15`,
                      padding: '6px',
                      borderRadius: '6px',
                    }}
                  >
                    REDEEMABLE AT BAJAJ NEPAL
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CONTROLS & CAMERA MATRIX */}
        {activeTab === 'controls' && (
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              background: 'rgba(10, 14, 22, 0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '900', letterSpacing: '2px' }}>
                HOW TO PLAY
              </span>
              <h2 style={{ margin: '2px 0', fontSize: '26px', fontWeight: '900' }}>Rider Controls & Stunts</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              {/* Keyboard */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f7b500', fontSize: '14px', fontWeight: '800' }}>⌨️ KEYBOARD</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Accelerate / Throttle</span>
                    <strong style={{ color: '#34c759' }}>W / Up Arrow</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Brake / Decel</span>
                    <strong style={{ color: '#ff3b30' }}>S / Down Arrow</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Steer Left / Right</span>
                    <strong style={{ color: '#00e5ff' }}>A / D / Left / Right</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Pop Wheelie</span>
                    <strong style={{ color: '#ff007f' }}>Space / Shift</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Nepali Horn</span>
                    <strong style={{ color: '#f7b500' }}>H Key</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Camera View</span>
                    <strong style={{ color: '#00e5ff' }}>C (Chase / Close / Far)</strong>
                  </div>
                </div>
              </div>

              {/* Mobile Touch */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f7b500', fontSize: '14px', fontWeight: '800' }}>📱 TOUCH CONTROLS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Steering (Left Hand)</span>
                    <strong style={{ color: '#00e5ff' }}>◀ Steer Left • Right ▶</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Green Pedal</span>
                    <strong style={{ color: '#34c759' }}>GAS (Hold Throttle)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Red Pedal</span>
                    <strong style={{ color: '#ff3b30' }}>BRK (Hard Brake)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Pink Rocket Button</span>
                    <strong style={{ color: '#ff007f' }}>🚀 WHEEL (Hold Wheelie)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Yellow Megaphone</span>
                    <strong style={{ color: '#f7b500' }}>📢 HORN (Honk Traffic)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Top Right Pill</span>
                    <strong style={{ color: '#00e5ff' }}>Tap Camera Mode</strong>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(247, 181, 0, 0.1)',
                border: '1px solid rgba(247, 181, 0, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#f7b500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚡</span>
              <span>
                <strong>PRO TIP:</strong> Hit the <strong>Mega-Ramps</strong> at 100+ km/h to jump through the mid-air <strong>Neon Rings</strong> for huge combo multipliers!
              </span>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER BAR: Ready Machine Status & Giant Action Button */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              fontSize: '12px',
              color: '#ccc',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Selected: <strong style={{ color: '#fff' }}>{selectedBike.name}</strong> •{' '}
            <span style={{ color: selectedBike.color, fontWeight: '700' }}>{selectedBike.badge}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#888' }}>
            Tip: Press <strong>Space</strong> in race to pop wheelies!
          </span>
        </div>

        <button
          onClick={handleStart}
          style={{
            padding: '16px 48px',
            fontSize: '19px',
            fontWeight: '900',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #f7b500 0%, #ff8800 100%)',
            color: '#0a0d12',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(247, 181, 0, 0.55), 0 0 15px rgba(255, 136, 0, 0.4)',
            transition: 'all 0.18s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(247, 181, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(247, 181, 0, 0.55), 0 0 15px rgba(255, 136, 0, 0.4)';
          }}
        >
          <span>START CHALLENGE</span>
          <span style={{ fontSize: '22px' }}>🏁</span>
        </button>
      </footer>
    </div>
  );
}
