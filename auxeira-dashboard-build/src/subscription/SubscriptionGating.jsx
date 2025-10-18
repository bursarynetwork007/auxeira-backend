import React, { createContext, useContext, useState } from 'react';

const SubscriptionContext = createContext({ tier: 'free', isActive: true, daysRemaining: 30 });

export const SubscriptionProvider = ({ children, initialTier = 'free' }) => {
  const [tier, setTier] = useState(initialTier);
  const [isActive] = useState(true);
  return (
    <SubscriptionContext.Provider value={{ tier, setTier, isActive, daysRemaining: 30 }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  return context || { tier: 'free', isActive: true, daysRemaining: 30 };
};

export const SubscriptionStatusBanner = ({ tier = 'free', daysRemaining = 30 }) => {
  if (tier === 'scale') return null;
  return (
    <div style={{ background: '#fef3c7', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f59e0b' }}>
      <span>⚡ You're on the <strong>{tier}</strong> plan. </span>
      {tier === 'free' && <span>Upgrade to unlock all features!</span>}
    </div>
  );
};

export const FeatureLockOverlay = ({ requiredTier = 'startup', featureName = 'this feature' }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.05)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '8px' }}>
    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
      <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Premium Feature</h3>
      <p style={{ color: '#666', marginBottom: '20px' }}>Upgrade to <strong>{requiredTier}</strong> to unlock {featureName}</p>
      <button style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Upgrade Now</button>
    </div>
  </div>
);

export const SubscriptionGating = ({ children, requiredTier = 'free', userTier = 'free', feature = 'this feature' }) => {
  const tierLevels = { free: 0, startup: 1, growth: 2, scale: 3 };
  if (tierLevels[userTier] >= tierLevels[requiredTier]) return <>{children}</>;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>{children}</div>
      <FeatureLockOverlay requiredTier={requiredTier} featureName={feature} />
    </div>
  );
};

export default SubscriptionGating;
