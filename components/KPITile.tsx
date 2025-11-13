import React from 'react';
import { KpiData, KpiChangeType } from '../types';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const iconMap: { [key in KpiChangeType]: React.ElementType } = {
  increase: ArrowUpRight,
  decrease: ArrowDownRight,
  neutral: Minus,
};

const colorMap: { [key in KpiChangeType]: string } = {
  increase: 'text-red-500', // Complaint rate increase is bad
  decrease: 'text-green-400',
  neutral: 'text-gray-400',
};

// Special handling for "good" increases
const goodIncreaseTitles = ['Delivery Rate'];

const KPITile: React.FC<KpiData> = ({ title, value, change, changeType, period }) => {
  if (!title || !value) {
    return null;
  }

  let finalColor = colorMap[changeType];
  if (goodIncreaseTitles.includes(title) && changeType === 'increase') {
    finalColor = 'text-green-400';
  }
   if (goodIncreaseTitles.includes(title) && changeType === 'decrease') {
    finalColor = 'text-red-500';
  }

  const Icon = iconMap[changeType];

  return (
    <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-300"></div>
      <p className="relative text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      <div className="relative mt-3 flex items-baseline justify-between">
        <p className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{value}</p>
        <div className={`flex items-center text-sm font-bold ${finalColor} bg-gray-700/30 px-2.5 py-1 rounded-lg`}>
          <Icon className="h-4 w-4 mr-1" />
          <span>{change}</span>
        </div>
      </div>
      <p className="relative text-xs text-gray-500 mt-2">{period}</p>
    </div>
  );
};

export default KPITile;