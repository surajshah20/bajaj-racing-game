import { useState } from 'react';
import { BAJAJ_BIKES } from '../../utils/bikeConfig';
import { CHECKPOINTS } from '../../utils/trackPath';
import { engineAudio } from '../../utils/store';

export default function MainMenu({ selectedBike, setSelectedBike, onStartRace }) {
  const [activeTab, setActiveTab] = useState('garage'); // 'garage' | 'circuit' | 'rewards' | 'controls'

  const handleStart = () => {
    engineAudio.init();
    if (onStartRace) onStartRace();
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
          'radial-gradient(circle at 50% 30%, rgba(8,12,20,0.45) 0%, rgba(5,7,12,0.88) 75%, rgba(2,3,6,0.96) 100%)',
        color: '#ffffff',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        padding: 'clamp(14px, 3vh, 28px)',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* TOP BAR: Brand, Festival Title & Navigation Tabs */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Bajaj Badge Icon */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #e31c25 0%, #8a0c12 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 18px rgba(227, 28, 37, 0.45)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            🏍️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  letterSpacing: '2.5px',
                  color: '#f7b500',
                  textTransform: 'uppercase',
                }}
              >
                बडा दशैँ २०८३ • काठमाडौँ चक्रपथ
              </span>
              <span
                style={{
                  fontSize: '10px',
                  background: 'rgba(247, 181, 0, 0.2)',
                  color: '#f7b500',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '700',
                }}
              >
                OFFICIAL
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(20px, 4vw, 30px)',
                fontWeight: '900',
                fontStyle: 'italic',
                letterSpacing: '0.5px',
                color: '#ffffff',
                lineHeight: 1.1,
              }}
            >
              BAJAJ <span style={{ color: '#e31c25' }}>DASHAIN</span> RACING
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '10px' }}>
          {[
            { id: 'garage', label: 'GARAGE 🏍️' },
            { id: 'circuit', label: 'CIRCUIT 🗺️' },
            { id: 'rewards', label: 'REWARDS 🎁' },
            { id: 'controls', label: 'CONTROLS 🎮' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '1px',
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #e31c25 0%, #b8141c 100%)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#aaaaaa',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === tab.id ? '0 2px 10px rgba(227,28,37,0.4)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* CENTER CONTENT BODY */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
        {/* TAB 1: GARAGE & BIKE SELECTOR */}
        {activeTab === 'garage' && (
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Top Bike Selector Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
              }}
            >
              {BAJAJ_BIKES.map((bike) => {
                const isSelected = selectedBike.id === bike.id;
                return (
                  <div
                    key={bike.id}
                    onClick={() => setSelectedBike(bike)}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(35, 42, 54, 0.95) 0%, rgba(20, 24, 32, 0.95) 100%)'
                        : 'rgba(15, 20, 28, 0.75)',
                      backdropFilter: 'blur(10px)',
                      border: isSelected ? `2px solid ${bike.color}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
                      transform: isSelected ? 'translateY(-4px)' : 'none',
                      boxShadow: isSelected
                        ? `0 10px 30px rgba(0,0,0,0.6), 0 0 20px ${bike.color}40`
                        : '0 4px 15px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '4px',
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
                          boxShadow: `0 0 10px ${bike.color}`,
                        }}
                      />
                    </div>

                    <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                      {bike.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#f7b500', fontWeight: '600', marginBottom: '6px' }}>
                      {bike.nepali}
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#999', fontStyle: 'italic', minHeight: '30px' }}>
                      {bike.tagline}
                    </p>

                    {/* Mini stat pills */}
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#ccc' }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#777', display: 'block' }}>TOP SPEED</span>
                        <strong style={{ color: '#00e5ff' }}>{Math.round(bike.topSpeed * 2.35)} km/h</strong>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#777', display: 'block' }}>NITRO MAX</span>
                        <strong style={{ color: '#f7b500' }}>{Math.round(bike.nitroTopSpeed * 2.35)} km/h</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Bike Full Spec Panel */}
            <div
              style={{
                background: 'rgba(12, 16, 24, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#f7b500', fontWeight: '800', letterSpacing: '2px' }}>
                    SELECTED MACHINE
                  </span>
                  <span style={{ fontSize: '10px', color: selectedBike.color }}>● LIVE PREVIEW IN 3D SHOWROOM</span>
                </div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '900', color: '#ffffff' }}>
                  {selectedBike.name}
                </h2>
                <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#b0b8c4', lineHeight: 1.5 }}>
                  {selectedBike.description}
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Rider Gear livery:</span>
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
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedBike.color }} />
                    <span style={{ fontWeight: '600', color: '#fff' }}>Bajaj Racing Leathers</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Animated Performance Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                {/* Speed Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
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

                {/* Accel Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
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

                {/* Handling Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa' }}>HANDLING & AGILITY</span>
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

        {/* TAB 2: KATHMANDU RING ROAD CIRCUIT GUIDE */}
        {activeTab === 'circuit' && (
          <div
            style={{
              width: '100%',
              maxWidth: '860px',
              background: 'rgba(12, 16, 24, 0.9)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '800', letterSpacing: '2px' }}>
                  GRAND PRIX TRACK
                </span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '24px', fontWeight: '900' }}>
                  Kathmandu Ring Road (काठमाडौँ चक्रपथ)
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                  🛣️ <strong>3,300m</strong> Loop
                </span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                  🏁 <strong>12</strong> Checkpoints
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6, marginBottom: '20px' }}>
              Experience the iconic ring road surrounding Kathmandu Valley. Race through the subterranean Kalanki Underpass, carve around the sacred hill of Swayambhu, power down the Gongabu highway, and complete the circuit at Koteshwor.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '10px',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '6px',
              }}
            >
              {CHECKPOINTS.map((cp, idx) => (
                <div
                  key={cp.name}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
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
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                      {cp.nepali} • {cp.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888' }}>{cp.desc || cp.landmark}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DASHAIN REWARDS PREVIEW */}
        {activeTab === 'rewards' && (
          <div
            style={{
              width: '100%',
              maxWidth: '820px',
              background: 'rgba(12, 16, 24, 0.9)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '800', letterSpacing: '2px' }}>
                DASHAIN FESTIVAL BONANZA
              </span>
              <h2 style={{ margin: '4px 0 6px 0', fontSize: '26px', fontWeight: '900' }}>
                Race & Win Official Bajaj Vouchers
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
                Rack up points by collecting Dashain Golden Tokens, executing high-speed slalom near-misses, and setting fast lap times.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px',
              }}
            >
              {[
                {
                  tier: 'TIER 1 (10,000+ PTS)',
                  title: 'Bajaj Racing Merchandise',
                  nepali: 'प्रिमियम ज्याकेट / हेल्मेट',
                  desc: 'Exclusive Bajaj Racing riding leathers, gloves, or full-face DOT helmet.',
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
                    border: `1px solid ${reward.color}40`,
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        color: reward.color,
                        letterSpacing: '1px',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {reward.tier}
                    </span>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '800' }}>{reward.title}</h3>
                    <div style={{ fontSize: '12px', color: '#f7b500', marginBottom: '8px' }}>{reward.nepali}</div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#999', lineHeight: 1.4 }}>{reward.desc}</p>
                  </div>
                  <div
                    style={{
                      marginTop: '14px',
                      fontSize: '10px',
                      fontWeight: '800',
                      color: reward.color,
                      textAlign: 'center',
                      background: `${reward.color}15`,
                      padding: '4px',
                      borderRadius: '4px',
                    }}
                  >
                    REDEEMABLE AT BAJAJ NEPAL
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONTROLS & CAMERA GUIDE */}
        {activeTab === 'controls' && (
          <div
            style={{
              width: '100%',
              maxWidth: '740px',
              background: 'rgba(12, 16, 24, 0.9)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', color: '#f7b500', fontWeight: '800', letterSpacing: '2px' }}>
                HOW TO PLAY
              </span>
              <h2 style={{ margin: '2px 0', fontSize: '24px', fontWeight: '900' }}>Rider Controls & Camera</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              {/* Keyboard */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f7b500', fontSize: '14px' }}>⌨️ KEYBOARD</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Accelerate / Throttle</span>
                    <strong style={{ color: '#34c759' }}>W / Up Arrow</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Brake / Reverse</span>
                    <strong style={{ color: '#ff3b30' }}>S / Down Arrow / Space</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Steer Left / Right</span>
                    <strong style={{ color: '#00e5ff' }}>A / D / Left / Right</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Toggle Camera</span>
                    <strong style={{ color: '#f7b500' }}>C (Chase / Close / Far)</strong>
                  </div>
                </div>
              </div>

              {/* Mobile Touch */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f7b500', fontSize: '14px' }}>📱 TOUCH CONTROLS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Left Hand D-Pad</span>
                    <strong style={{ color: '#00e5ff' }}>◀ Steer Left • Right ▶</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Right Green Button</span>
                    <strong style={{ color: '#34c759' }}>GAS (Hold Throttle)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Right Red Button</span>
                    <strong style={{ color: '#ff3b30' }}>BRK (Hard Brake)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#aaa' }}>Top Right Pill</span>
                    <strong style={{ color: '#f7b500' }}>Tap Camera Mode</strong>
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
                <strong>PRO TIP:</strong> Skim close to traffic barriers at high speed to trigger <strong>SLALOM NEAR-MISS (+150 pts)</strong> bonuses!
              </span>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER BAR: Launch Action & Summary */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)',
              fontSize: '12px',
              color: '#ccc',
            }}
          >
            Ready: <strong style={{ color: '#fff' }}>{selectedBike.name}</strong> •{' '}
            <span style={{ color: selectedBike.color }}>{selectedBike.badge}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#777' }}>
            Tip: Press <strong>C</strong> in race to cycle camera views
          </span>
        </div>

        <button
          onClick={handleStart}
          style={{
            padding: '14px 44px',
            fontSize: '18px',
            fontWeight: '900',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #f7b500 0%, #e59800 100%)',
            color: '#0a0d12',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 6px 25px rgba(247, 181, 0, 0.45)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(247, 181, 0, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(247, 181, 0, 0.45)';
          }}
        >
          <span>START CHALLENGE</span>
          <span>🏁</span>
        </button>
      </footer>
    </div>
  );
}
