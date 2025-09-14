// components/TriageBadge.tsx
"use client"

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, User, Clock, TrendingUp, X } from 'lucide-react';
import { TriageLevel, TriageResult } from '@/lib/triageAlgorithm';

interface TriageBadgeProps {
  currentLevel: TriageLevel;
  triageResult?: TriageResult;
  patientId: string;
  patientName: string;
  onLevelChange: (newLevel: TriageLevel, isManualOverride: boolean) => void;
  isManualOverride?: boolean;
  disabled?: boolean;
}

const TRIAGE_COLORS = {
  red: 'bg-red-600 text-white border-red-500',
  yellow: 'bg-yellow-600 text-white border-yellow-500', 
  green: 'bg-green-600 text-white border-green-500',
  black: 'bg-gray-800 text-white border-gray-600'
};

const TRIAGE_LABELS = {
  red: 'CRITICAL',
  yellow: 'URGENT', 
  green: 'STABLE',
  black: 'DECEASED'
};

export const TriageBadge: React.FC<TriageBadgeProps> = ({
  currentLevel,
  triageResult,
  patientId,
  patientName,
  onLevelChange,
  isManualOverride = false,
  disabled = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const handleLevelChange = (newLevel: TriageLevel) => {
    onLevelChange(newLevel, true);
    setShowOverride(false);
  };

  const formatShockIndex = (si: number): string => {
    if (si > 1.0) return `🔴 ${si.toFixed(2)}`;
    if (si > 0.9) return `🟠 ${si.toFixed(2)}`;
    if (si > 0.7) return `🟡 ${si.toFixed(2)}`;
    return `🟢 ${si.toFixed(2)}`;
  };

  // Add event handler to stop propagation
  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // This prevents the click from bubbling up to the parent Card
    if (!disabled) {
      setShowDetails(!showDetails);
    }
  };

  // Add event handler for all interactive elements
  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling for all interactive elements
  };

  return (
    <div className="relative" onClick={handleInteractiveClick}>
      {/* Main Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-105 ${
          TRIAGE_COLORS[currentLevel]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleBadgeClick}
      >
        <span>{TRIAGE_LABELS[currentLevel]}</span>
        {isManualOverride && (
          <span title="Manual Override">
            <User size={12} />
          </span>
        )}
        {triageResult?.shockIndex && (
          <span title={`Shock Index: ${triageResult.shockIndex.toFixed(2)}`}>
            SI: {triageResult.shockIndex.toFixed(2)}
          </span>
        )}
        <TrendingUp size={12} />
      </div>

      {/* Detailed View */}
      {showDetails && (
        <Card className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border-gray-700 text-white shadow-xl z-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Triage Assessment - {patientName}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="h-6 w-6 p-0 hover:bg-gray-700"
              >
                <X size={14} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Current Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Current Level:</span>
              <Badge className={TRIAGE_COLORS[currentLevel]}>
                {TRIAGE_LABELS[currentLevel]}
              </Badge>
            </div>

            {/* Shock Index */}
            {triageResult?.shockIndex && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Shock Index:</span>
                <span className="text-sm font-mono">
                  {formatShockIndex(triageResult.shockIndex)}
                </span>
              </div>
            )}

            {/* Triage Score */}
            {triageResult && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Triage Score:</span>
                <span className="text-sm font-semibold">{triageResult.score}/20</span>
              </div>
            )}

            {/* Override Status */}
            {isManualOverride && (
              <div className="flex items-center gap-2 text-orange-400 text-xs">
                <User size={12} />
                <span>Manual Override Active</span>
              </div>
            )}

            {/* Reasoning */}
            {triageResult?.reasoning && triageResult.reasoning.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Assessment Factors:</div>
                <div className="text-xs space-y-1 max-h-24 overflow-y-auto">
                  {triageResult.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-300">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Override Button */}
            <div className="pt-2 border-t border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOverride(!showOverride);
                }}
                className="w-full text-xs border-gray-600 hover:bg-gray-800"
              >
                <AlertTriangle size={12} className="mr-1" />
                Manual Override
              </Button>
            </div>

            {/* Override Options */}
            {showOverride && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {(['red', 'yellow', 'green'] as TriageLevel[]).map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLevelChange(level);
                    }}
                    className={`text-xs ${
                      level === currentLevel
                        ? 'opacity-50 cursor-not-allowed'
                        : TRIAGE_COLORS[level].replace('border-', 'hover:border-')
                    }`}
                    disabled={level === currentLevel}
                  >
                    {TRIAGE_LABELS[level]}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
