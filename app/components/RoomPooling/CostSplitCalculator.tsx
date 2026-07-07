'use client';

import React, { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Member {
  id: string;
  name: string;
  percentage?: number;
  nights?: number;
  amount?: number;
}

interface CostSplitCalculatorProps {
  totalAmount: number;
  members: Member[];
  onSplitChange?: (splits: { [userId: string]: number }) => void;
  readOnly?: boolean;
}

type SplitType = 'equal' | 'custom' | 'by_nights';

const CostSplitCalculator: React.FC<CostSplitCalculatorProps> = ({
  totalAmount,
  members,
  onSplitChange,
  readOnly = false,
}) => {
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customPercentages, setCustomPercentages] = useState<{ [id: string]: number }>({});
  const [nightsPerMember, setNightsPerMember] = useState<{ [id: string]: number }>({});
  const [calculatedSplits, setCalculatedSplits] = useState<{ [id: string]: number }>({});

  // Initialize default values
  useEffect(() => {
    const initialPercentages: { [id: string]: number } = {};
    const initialNights: { [id: string]: number } = {};
    
    members.forEach((member) => {
      initialPercentages[member.id] = member.percentage || 100 / members.length;
      initialNights[member.id] = member.nights || 1;
    });
    
    setCustomPercentages(initialPercentages);
    setNightsPerMember(initialNights);
  }, [members]);

  // Calculate splits whenever inputs change
  useEffect(() => {
    calculateSplits();
  }, [splitType, customPercentages, nightsPerMember, totalAmount, members]);

  const calculateSplits = () => {
    const splits: { [id: string]: number } = {};
    
    if (splitType === 'equal') {
      const perPerson = totalAmount / members.length;
      members.forEach((member) => {
        splits[member.id] = perPerson;
      });
    } else if (splitType === 'custom') {
      members.forEach((member) => {
        const percentage = customPercentages[member.id] || 0;
        splits[member.id] = totalAmount * (percentage / 100);
      });
    } else if (splitType === 'by_nights') {
      const totalNights = Object.values(nightsPerMember).reduce((a, b) => a + b, 0);
      members.forEach((member) => {
        const memberNights = nightsPerMember[member.id] || 0;
        splits[member.id] = totalNights > 0 ? totalAmount * (memberNights / totalNights) : 0;
      });
    }
    
    setCalculatedSplits(splits);
    onSplitChange?.(splits);
  };

  const handlePercentageChange = (memberId: string, value: number) => {
    setCustomPercentages((prev) => ({
      ...prev,
      [memberId]: Math.min(100, Math.max(0, value)),
    }));
  };

  const handleNightsChange = (memberId: string, value: number) => {
    setNightsPerMember((prev) => ({
      ...prev,
      [memberId]: Math.max(0, value),
    }));
  };

  const getTotalPercentage = () => {
    return Object.values(customPercentages).reduce((a, b) => a + b, 0);
  };

  const isValidSplit = () => {
    if (splitType === 'custom') {
      const total = getTotalPercentage();
      return Math.abs(total - 100) < 0.01;
    }
    return true;
  };

  const redistributeEqually = () => {
    const equalPct = 100 / members.length;
    const newPercentages: { [id: string]: number } = {};
    members.forEach((member) => {
      newPercentages[member.id] = equalPct;
    });
    setCustomPercentages(newPercentages);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <CalculatorIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Cost Split Calculator</h3>
            <p className="text-sm text-white/80">
              Total: ${totalAmount.toFixed(2)} • {members.length} members
            </p>
          </div>
        </div>
      </div>

      {/* Split type selector */}
      {!readOnly && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            {[
              { type: 'equal', label: 'Equal Split', icon: UserGroupIcon },
              { type: 'custom', label: 'Custom %', icon: CurrencyDollarIcon },
              { type: 'by_nights', label: 'By Nights', icon: CalculatorIcon },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSplitType(type as SplitType)}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  splitType === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Member splits */}
      <div className="p-4 space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
          >
            {/* Avatar & name */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                {splitType === 'custom' && (
                  <p className="text-xs text-gray-500">
                    {customPercentages[member.id]?.toFixed(1)}% of total
                  </p>
                )}
                {splitType === 'by_nights' && (
                  <p className="text-xs text-gray-500">
                    {nightsPerMember[member.id]} nights
                  </p>
                )}
              </div>
            </div>

            {/* Input (for custom/nights) */}
            {!readOnly && splitType === 'custom' && (
              <div className="w-24">
                <div className="relative">
                  <input
                    type="number"
                    value={customPercentages[member.id] || 0}
                    onChange={(e) =>
                      handlePercentageChange(member.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    %
                  </span>
                </div>
              </div>
            )}

            {!readOnly && splitType === 'by_nights' && (
              <div className="w-24">
                <input
                  type="number"
                  value={nightsPerMember[member.id] || 0}
                  onChange={(e) =>
                    handleNightsChange(member.id, parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>
            )}

            {/* Amount */}
            <div className="text-right w-28">
              <p className="text-lg font-bold text-emerald-600">
                ${(calculatedSplits[member.id] || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">per person</p>
            </div>
          </div>
        ))}
      </div>

      {/* Validation & summary */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        {splitType === 'custom' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total percentage:</span>
              <span
                className={`text-sm font-medium ${
                  isValidSplit() ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {getTotalPercentage().toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isValidSplit() ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(getTotalPercentage(), 100)}%` }}
              />
            </div>
            {!isValidSplit() && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <ExclamationCircleIcon className="w-4 h-4" />
                <span>Percentages must add up to 100%</span>
                <button
                  onClick={redistributeEqually}
                  className="ml-auto flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* Total summary */}
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            {isValidSplit() ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />
            )}
            <span className="font-medium text-gray-900">Total</span>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-500">
              Avg ${(totalAmount / members.length).toFixed(2)}/person
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostSplitCalculator;

