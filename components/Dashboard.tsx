
import React from 'react';
import { DashboardData } from '../types';
import KPITile from './KPITile';
import SpamRateGauge from './SpamRateGauge';
import ComplianceChecklist from './ComplianceChecklist';
import DomainPerformanceChart from './DomainPerformanceChart';
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  data: DashboardData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  if (!data || !data.kpis) {
    return (
      <div className="text-center text-gray-400 p-8">
        No dashboard data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.kpis.map((kpi) => (
          <KPITile key={kpi.title} {...kpi} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">Gmail Spam Rate (Postmaster)</h3>
          <p className="text-sm text-gray-400 mb-4">User-reported spam. Target: &lt;0.10%</p>
          <SpamRateGauge value={data.gmailSpamRate} />
        </div>
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">Performance by Domain</h3>
          <p className="text-sm text-gray-400 mb-4">Key metrics across major mailbox providers.</p>
          {data.domainPerformance && data.domainPerformance.length > 0 ? (
            <DomainPerformanceChart data={data.domainPerformance} />
          ) : (
            <div className="text-center text-gray-500 py-8">No domain performance data available</div>
          )}
        </div>
      </div>
       <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
         <div className="relative flex items-start mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">AI Agent: Setup Guardian</h3>
              <p className="text-sm text-gray-400">Real-time audit of your sending configuration against Gmail & Yahoo requirements.</p>
            </div>
         </div>
         <div className="relative">
           {data.complianceChecklist && data.complianceChecklist.length > 0 ? (
             <ComplianceChecklist items={data.complianceChecklist} />
           ) : (
             <div className="text-center text-gray-500 py-8">No compliance data available</div>
           )}
         </div>
       </div>
    </div>
  );
};

export default Dashboard;
