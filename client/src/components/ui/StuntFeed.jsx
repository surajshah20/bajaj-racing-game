/**
 * Floating Bouncy Roblox Arcade Stunt Combo Notification Feed
 */
export default function StuntFeed({ currentStunt, comboMultiplier = 1 }) {
  if (!currentStunt) return null;

  const typeGradients = {
    airtime: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    wheelie: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
    ring: 'linear-gradient(135deg, #f7b500 0%, #ff7700 100%)',
    slipstream: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    nearmiss: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    horn: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  };

  const bg = typeGradients[currentStunt.type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <div
      style={{
        position: 'absolute',
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none',
        animation: 'stuntBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      <div
        style={{
          background: bg,
          padding: '8px 24px',
          borderRadius: '30px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.4)',
          border: '2px solid rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#ffffff',
          fontWeight: '900',
          letterSpacing: '1px',
          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
        }}
      >
        <span style={{ fontSize: '18px' }}>{currentStunt.title}</span>
        {currentStunt.points && (
          <span
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#ffd700',
            }}
          >
            +{currentStunt.points}
          </span>
        )}
      </div>

      {comboMultiplier > 1 && (
        <div
          style={{
            background: 'linear-gradient(90deg, #ff007f, #7928ca)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '900',
            padding: '3px 12px',
            borderRadius: '10px',
            letterSpacing: '1.5px',
            boxShadow: '0 2px 10px rgba(255,0,127,0.5)',
          }}
        >
          COMBO x{comboMultiplier} 🔥
        </div>
      )}

      <style>{`
        @keyframes stuntBounce {
          0% { transform: scale(0.4) translateY(20px); opacity: 0; }
          70% { transform: scale(1.1) translateY(-4px); opacity: 1; }
          100% { transform: scale(1.0) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
