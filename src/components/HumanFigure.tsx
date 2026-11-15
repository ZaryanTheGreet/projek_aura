import React from 'react';
import { PoseType } from '../types';

interface HumanFigureProps {
  pose: PoseType;
  showGhost?: boolean;
  className?: string;
  size?: number;
}

/**
 * HumanFigure: Minimalist human figure for stretch & posture guides (Issue 5).
 * Replaces Companion with human anatomy:
 * - Circle head, solid 3px ink stroke for limbs and spine.
 * - Target ghost shadow showing target pose with subtle opacity.
 * - Direction arrows/arcs showing movement direction and stretch sensation.
 */
export const HumanFigure: React.FC<HumanFigureProps> = ({
  pose,
  showGhost = true,
  size = 180,
  className = '',
}) => {
  const isSit = pose === 'sit';

  // Base limbs configuration
  const renderFigureBody = (p: PoseType, isGhost: boolean) => {
    const strokeColor = 'var(--ink)';
    const strokeWidth = 3;
    const opacity = isGhost ? 0.22 : 1;

    let headCenter = { x: 50, y: 22 };
    let headRotate = 0;
    let leftArm = { x1: 50, y1: 36, x2: 36, y2: 60 };
    let rightArm = { x1: 50, y1: 36, x2: 64, y2: 60 };
    let leftForearm = { x1: 36, y1: 60, x2: 44, y2: 68 };
    let rightForearm = { x1: 64, y1: 60, x2: 56, y2: 68 };

    // Pose joint coordinates
    if (p === 'neck_left') {
      headRotate = -24;
      headCenter = { x: 44, y: 23 };
      leftArm = { x1: 50, y1: 36, x2: 36, y2: 64 };
      rightArm = { x1: 50, y1: 36, x2: 64, y2: 64 };
      leftForearm = { x1: 36, y1: 64, x2: 44, y2: 70 };
      rightForearm = { x1: 64, y1: 64, x2: 56, y2: 70 };
    } else if (p === 'neck_right') {
      headRotate = 24;
      headCenter = { x: 56, y: 23 };
      leftArm = { x1: 50, y1: 36, x2: 36, y2: 64 };
      rightArm = { x1: 50, y1: 36, x2: 64, y2: 64 };
      leftForearm = { x1: 36, y1: 64, x2: 44, y2: 70 };
      rightForearm = { x1: 64, y1: 64, x2: 56, y2: 70 };
    } else if (p === 'arms_up') {
      headRotate = 0;
      headCenter = { x: 50, y: 21 };
      // Arms reaching high overhead
      leftArm = { x1: 50, y1: 36, x2: 32, y2: 18 };
      rightArm = { x1: 50, y1: 36, x2: 68, y2: 18 };
      leftForearm = { x1: 32, y1: 18, x2: 38, y2: 6 };
      rightForearm = { x1: 68, y1: 18, x2: 62, y2: 6 };
    } else if (p === 'hands_chest') {
      leftArm = { x1: 50, y1: 36, x2: 38, y2: 46 };
      rightArm = { x1: 50, y1: 36, x2: 62, y2: 46 };
      leftForearm = { x1: 38, y1: 46, x2: 48, y2: 46 };
      rightForearm = { x1: 62, y1: 46, x2: 52, y2: 46 };
    } else if (p === 'stand') {
      leftArm = { x1: 50, y1: 36, x2: 38, y2: 62 };
      rightArm = { x1: 50, y1: 36, x2: 62, y2: 62 };
      leftForearm = { x1: 38, y1: 62, x2: 38, y2: 74 };
      rightForearm = { x1: 62, y1: 62, x2: 62, y2: 74 };
    }

    return (
      <g opacity={opacity} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Head */}
        <circle
          cx={headCenter.x}
          cy={headCenter.y}
          r="9"
          fill="var(--surface)"
          transform={headRotate !== 0 ? `rotate(${headRotate} 50 34)` : undefined}
        />

        {/* Neck & Spine */}
        <line x1="50" y1="31" x2="50" y2="68" />

        {/* Arms */}
        <line x1={leftArm.x1} y1={leftArm.y1} x2={leftArm.x2} y2={leftArm.y2} />
        <line x1={leftArm.x2} y1={leftArm.y2} x2={leftForearm.x2} y2={leftForearm.y2} />

        <line x1={rightArm.x1} y1={rightArm.y1} x2={rightArm.x2} y2={rightArm.y2} />
        <line x1={rightArm.x2} y1={rightArm.y2} x2={rightForearm.x2} y2={rightForearm.y2} />

        {/* Legs: Sit vs Stand */}
        {isSit ? (
          <>
            {/* Chair line subtle guide */}
            {isGhost && <line x1="28" y1="74" x2="72" y2="74" stroke="var(--border)" strokeWidth="1" />}
            {/* Thighs */}
            <line x1="50" y1="68" x2="36" y2="74" />
            <line x1="36" y1="74" x2="36" y2="94" />
            <line x1="50" y1="68" x2="64" y2="74" />
            <line x1="64" y1="74" x2="64" y2="94" />
          </>
        ) : (
          <>
            {/* Standing Legs */}
            <line x1="50" y1="68" x2="40" y2="95" />
            <line x1="50" y1="68" x2="60" y2="95" />
          </>
        )}
      </g>
    );
  };

  // Direction indicators / stretch cue arcs
  const renderCues = () => {
    if (pose === 'neck_left') {
      return (
        <g stroke="var(--ink)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          {/* Curve showing tilt to left */}
          <path d="M 52 14 C 44 14, 38 18, 36 24" strokeDasharray="3 3" />
          <polygon points="33,23 37,27 39,21" fill="var(--ink)" stroke="none" />
          {/* Stretch sensation line on right neck */}
          <path d="M 58 28 C 61 32, 62 36, 61 40" stroke="var(--zone-watch)" strokeWidth="2" />
        </g>
      );
    }
    if (pose === 'neck_right') {
      return (
        <g stroke="var(--ink)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          {/* Curve showing tilt to right */}
          <path d="M 48 14 C 56 14, 62 18, 64 24" strokeDasharray="3 3" />
          <polygon points="67,23 63,27 61,21" fill="var(--ink)" stroke="none" />
          {/* Stretch sensation line on left neck */}
          <path d="M 42 28 C 39 32, 38 36, 39 40" stroke="var(--zone-watch)" strokeWidth="2" />
        </g>
      );
    }
    if (pose === 'arms_up') {
      return (
        <g stroke="var(--ink)" strokeWidth="1.8" fill="none" strokeLinecap="round">
          {/* Stretch upward arrows */}
          <line x1="50" y1="12" x2="50" y2="3" strokeDasharray="2 2" />
          <polygon points="46,6 50,1 54,6" fill="var(--ink)" stroke="none" />
        </g>
      );
    }
    return null;
  };

  return (
    <div
      className={`human-figure-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
      >
        {/* Target shadow ghost figure if posture moves from neutral */}
        {showGhost && (pose === 'neck_left' || pose === 'neck_right' || pose === 'arms_up') && (
          renderFigureBody(isSit ? 'sit' : 'stand', true)
        )}

        {/* Active posture figure */}
        {renderFigureBody(pose, false)}

        {/* Direction arrows / sensation cues */}
        {renderCues()}
      </svg>
    </div>
  );
};
