import React from 'react';
import { ZoneType, PoseType } from '../types';

export type CompanionState = ZoneType | 'neutral';
export type CompanionMode = 'normal' | 'thinking' | 'care';

interface CompanionProps {
  state?: CompanionState;
  mode?: CompanionMode;
  size?: number;
  pose?: PoseType;
  className?: string;
}

export const Companion: React.FC<CompanionProps> = ({
  state = 'neutral',
  mode = 'normal',
  size = 120,
  pose,
  className = '',
}) => {
  // Color decisions per design rules:
  // On zone fills (calm, watch, heavy): face is ALWAYS #1A1A1A in both themes.
  // On neutral state: body fill is var(--surface), stroke 2px var(--ink), face is var(--ink).
  const isNeutral = state === 'neutral';

  const fillColor = isNeutral
    ? 'var(--surface)'
    : state === 'calm'
    ? 'var(--zone-calm)'
    : state === 'watch'
    ? 'var(--zone-watch)'
    : 'var(--zone-heavy)';

  const strokeColor = isNeutral ? 'var(--ink)' : 'transparent';
  const faceColor = isNeutral ? 'var(--ink)' : '#1A1A1A';

  // Body shape parameters:
  // calm: round circle
  // watch: slightly flattened horizontal oval
  // heavy: slightly shrunken and tilted
  let bodyShape: React.ReactNode = null;
  let faceContent: React.ReactNode = null;

  if (state === 'calm') {
    bodyShape = <circle cx="50" cy="50" r="38" fill={fillColor} />;
    faceContent = (
      <g fill={faceColor} stroke={faceColor}>
        {/* Dot eyes */}
        <circle cx="41" cy="46" r="3" />
        <circle cx="59" cy="46" r="3" />
        {/* Gentle smile */}
        <path
          d="M 43 56 Q 50 62 57 56"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    );
  } else if (state === 'watch') {
    bodyShape = <ellipse cx="50" cy="52" rx="42" ry="34" fill={fillColor} />;
    faceContent = (
      <g fill={faceColor} stroke={faceColor}>
        {/* Flat line eyes */}
        <line x1="37" y1="48" x2="45" y2="48" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="55" y1="48" x2="63" y2="48" strokeWidth="2.5" strokeLinecap="round" />
        {/* Straight mouth */}
        <line x1="44" y1="58" x2="56" y2="58" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  } else if (state === 'heavy') {
    bodyShape = (
      <ellipse
        cx="50"
        cy="54"
        rx="36"
        ry="32"
        fill={fillColor}
        transform="rotate(-4 50 54)"
      />
    );
    faceContent = (
      <g fill={faceColor} stroke={faceColor} transform="rotate(-4 50 54)">
        {/* Tired slanted eyes */}
        <path d="M 38 48 Q 42 50 46 48" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 54 48 Q 58 50 62 48" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        {/* Gentle down-turned mouth */}
        <path d="M 44 60 Q 50 56 56 60" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  } else {
    // Neutral
    bodyShape = (
      <circle
        cx="50"
        cy="50"
        r="38"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
    );
    faceContent = (
      <g fill={faceColor} stroke={faceColor}>
        <circle cx="41" cy="46" r="3" />
        <circle cx="59" cy="46" r="3" />
        <path
          d="M 44 57 Q 50 60 56 57"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // Arms Pose Rig (solid 3px line with smooth caps)
  const armColor = isNeutral ? 'var(--ink)' : '#1A1A1A';
  let arms: React.ReactNode = null;

  if (pose === 'arms_up') {
    arms = (
      <g stroke={armColor} strokeWidth="3" strokeLinecap="round" fill="none">
        {/* Left arm up */}
        <path d="M 22 56 Q 14 36 18 18" />
        {/* Right arm up */}
        <path d="M 78 56 Q 86 36 82 18" />
      </g>
    );
  } else if (pose === 'neck_left') {
    arms = (
      <g stroke={armColor} strokeWidth="3" strokeLinecap="round" fill="none">
        {/* Right arm resting */}
        <path d="M 78 58 Q 84 70 78 80" />
        {/* Left arm reaching over towards left neck/head */}
        <path d="M 22 58 Q 12 40 32 30" />
      </g>
    );
  } else if (pose === 'neck_right') {
    arms = (
      <g stroke={armColor} strokeWidth="3" strokeLinecap="round" fill="none">
        {/* Left arm resting */}
        <path d="M 22 58 Q 16 70 22 80" />
        {/* Right arm reaching over towards right neck/head */}
        <path d="M 78 58 Q 88 40 68 30" />
      </g>
    );
  } else if (pose === 'hands_chest') {
    arms = (
      <g stroke={armColor} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M 20 60 Q 32 64 42 60" />
        <path d="M 80 60 Q 68 64 58 60" />
      </g>
    );
  } else if (pose === 'stand') {
    arms = (
      <g stroke={armColor} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M 20 54 L 14 82" />
        <path d="M 80 54 L 86 82" />
      </g>
    );
  } else if (pose === 'sit') {
    arms = (
      <g stroke={armColor} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M 22 56 Q 24 72 36 74" />
        <path d="M 78 56 Q 76 72 64 74" />
      </g>
    );
  }

  const isThinking = mode === 'thinking';
  const isCare = mode === 'care';

  return (
    <div
      className={`companion-wrapper ${isThinking ? 'companion-thinking-anim' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          overflow: 'visible',
          transition: isCare ? 'none' : 'fill 300ms ease, transform 300ms ease',
        }}
      >
        {arms}
        {bodyShape}
        {faceContent}
      </svg>
    </div>
  );
};
