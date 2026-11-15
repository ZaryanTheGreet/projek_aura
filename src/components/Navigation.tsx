import React from 'react';

export type MainTab = 'home' | 'write' | 'trend';

interface NavigationProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export const BottomNavigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="aura-bottom-nav" aria-label="Navigasi Utama">
      <button
        type="button"
        className={`aura-nav-item ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
        aria-current={currentTab === 'home' ? 'page' : undefined}
      >
        <i className="fa-solid fa-house" aria-hidden="true" />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`aura-nav-item ${currentTab === 'write' ? 'active' : ''}`}
        onClick={() => onTabChange('write')}
        aria-current={currentTab === 'write' ? 'page' : undefined}
      >
        <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
        <span>Tulis</span>
      </button>

      <button
        type="button"
        className={`aura-nav-item ${currentTab === 'trend' ? 'active' : ''}`}
        onClick={() => onTabChange('trend')}
        aria-current={currentTab === 'trend' ? 'page' : undefined}
      >
        <i className="fa-solid fa-chart-line" aria-hidden="true" />
        <span>Tren</span>
      </button>
    </nav>
  );
};
