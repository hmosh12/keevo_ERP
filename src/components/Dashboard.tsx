import React from 'react';
import { cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', sales: 4000, expenses: 2400 },
  { name: 'Feb', sales: 3000, expenses: 1398 },
  { name: 'Mar', sales: 2000, expenses: 9800 },
  { name: 'Apr', sales: 2780, expenses: 3908 },
  { name: 'May', sales: 1890, expenses: 4800 },
  { name: 'Jun', sales: 2390, expenses: 3800 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, isRTL }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
        <Icon size={24} />
      </div>
      <div className={cn(
        "flex items-center text-sm font-medium",
        trend === 'up' ? "text-emerald-600" : "text-rose-600"
      )}>
        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span className="ml-1 rtl:mr-1 rtl:ml-0">{change}</span>
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

export default function Dashboard({ isRTL }: { isRTL: boolean }) {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isRTL ? 'إجمالي المبيعات' : 'Total Sales'} 
          value="$45,231.89" 
          change="+20.1%" 
          icon={ShoppingCart} 
          trend="up"
          isRTL={isRTL}
        />
        <StatCard 
          title={isRTL ? 'إجمالي المصاريف' : 'Total Expenses'} 
          value="$12,402.00" 
          change="+4.5%" 
          icon={TrendingDown} 
          trend="down"
          isRTL={isRTL}
        />
        <StatCard 
          title={isRTL ? 'صافي الربح' : 'Net Profit'} 
          value="$32,829.89" 
          change="+12.2%" 
          icon={TrendingUp} 
          trend="up"
          isRTL={isRTL}
        />
        <StatCard 
          title={isRTL ? 'المخزون المتوفر' : 'Stock Items'} 
          value="1,240" 
          change="-2.4%" 
          icon={Package} 
          trend="down"
          isRTL={isRTL}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">
              {isRTL ? 'نظرة عامة على المبيعات' : 'Sales Overview'}
            </h3>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg px-3 py-2 outline-none">
              <option>{isRTL ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
              <option>{isRTL ? 'آخر سنة' : 'Last Year'}</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">
              {isRTL ? 'المبيعات مقابل المصاريف' : 'Sales vs Expenses'}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {isRTL ? 'آخر العمليات' : 'Recent Transactions'}
          </h3>
          <button className="text-indigo-600 text-sm font-semibold hover:underline">
            {isRTL ? 'عرض الكل' : 'View All'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'العملية' : 'Transaction'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'التاريخ' : 'Date'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'المبلغ' : 'Amount'}</th>
                <th className="px-6 py-4 font-semibold">{isRTL ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: 1, name: isRTL ? 'فاتورة مبيعات #1024' : 'Sales Invoice #1024', date: 'Oct 24, 2023', amount: '$1,200.00', status: 'Completed', color: 'emerald' },
                { id: 2, name: isRTL ? 'شراء مخزون - مورد أ' : 'Inventory Purchase - Supplier A', date: 'Oct 23, 2023', amount: '-$450.00', status: 'Pending', color: 'amber' },
                { id: 3, name: isRTL ? 'فاتورة مبيعات #1023' : 'Sales Invoice #1023', date: 'Oct 22, 2023', amount: '$850.00', status: 'Completed', color: 'emerald' },
                { id: 4, name: isRTL ? 'مصاريف كهرباء' : 'Electricity Bill', date: 'Oct 21, 2023', amount: '-$120.00', status: 'Completed', color: 'emerald' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        row.amount.startsWith('-') ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {row.amount.startsWith('-') ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      </div>
                      <span className="font-medium text-slate-700">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{row.date}</td>
                  <td className={cn(
                    "px-6 py-4 font-bold",
                    row.amount.startsWith('-') ? "text-rose-600" : "text-emerald-600"
                  )}>{row.amount}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      row.color === 'emerald' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
