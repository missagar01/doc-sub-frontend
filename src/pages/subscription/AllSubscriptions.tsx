import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard, FileText } from 'lucide-react';
import useDataStore from '../../store/dataStore';
import useHeaderStore from '../../store/headerStore';
import { formatDate } from '../../utils/dateFormatter';
import AddSubscription from './AddSubscription';

const AllSubscriptions = () => {
  const { setTitle } = useHeaderStore();
  const { subscriptions, resetSubscriptions } = useDataStore();

  useEffect(() => {
    setTitle('All Subscription');
  }, [setTitle]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // Auto-fix: If history is empty OR has old data (missing companyName), reset to dummy data
    const hasBadData = subscriptions.some(item => !item.companyName);
    if (subscriptions.length === 0 || hasBadData) {
         if (resetSubscriptions) resetSubscriptions(); 
    }
  }, [subscriptions, resetSubscriptions]);
  
  const filteredData = subscriptions.filter(item => {
    const matchesSearch = (item.subscriptionName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.subscriberName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesfreq = filterFrequency ? item.frequency === filterFrequency : true;

    return matchesSearch && matchesfreq;
  });

  return (
    <>
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl shadow-input">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">Track your recurring payments</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
             <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Search subscriptions..."
                    className="pl-10 pr-4 py-2.5 w-full shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
               <select
                   value={filterFrequency}
                   onChange={(e) => setFilterFrequency(e.target.value)}
                   className="appearance-none pl-4 pr-10 py-2.5 shadow-input border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors w-full sm:w-auto"
               >
                   <option value="">All Frequencies</option>
                   {Array.from(new Set(subscriptions.map(s => s.frequency))).filter(Boolean).sort().map(freq => (
                       <option key={freq} value={freq}>{freq}</option>
                   ))}
               </select>
               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
               </div>
            </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Add New</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>


      {/* Desktop Table */}
      <div className="hidden md:flex flex-col bg-white rounded-xl shadow-input overflow-hidden h-[calc(100vh-350px)]">
        <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider whitespace-nowrap">
                <th className="px-3 py-2">Serial No</th>
                <th className="px-3 py-2">Requested Date</th>
                <th className="px-3 py-2">Company Name</th>
                <th className="px-3 py-2">Subscriber Name</th>
                <th className="px-3 py-2">Subscription Name</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Frequency</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Start Date</th>
                <th className="px-3 py-2">End Date</th>
                <th className="px-3 py-2">Status</th>

                </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
                {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-2 font-bold text-gray-700 text-xs">{item.sn}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(item.requestedDate)}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.companyName}</td>
                    <td className="px-3 py-2 text-gray-700">{item.subscriberName}</td>
                    <td className="px-3 py-2 font-medium text-indigo-600">{item.subscriptionName}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{item.price}</td>
                    <td className="px-3 py-2 text-gray-600">{item.frequency}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-xs truncate" title={item.purpose}>{item.purpose}</td>
                    <td className="px-3 py-2 text-gray-400 text-center">{formatDate(item.startDate)}</td>
                    <td className="px-3 py-2 text-gray-400 text-center">{formatDate(item.endDate)}</td>
                    <td className="px-3 py-2">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                        {item.status || 'Pending'}
                    </span>
                    </td>

                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-input space-y-3">
             {/* Header */}
            <div className="flex justify-between items-start">
               <div className="flex gap-3 items-start">
                  <div className="h-10 w-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                     <CreditCard size={20} />
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shadow-input border-none">{item.sn}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                            item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                            {item.status || 'Pending'}
                        </span>
                     </div>
                     <h3 className="text-sm font-bold text-gray-900 leading-tight">{item.subscriptionName || item.service}</h3>
                     <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.companyName}</p>
                  </div>
               </div>
            </div>
            
            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pt-3 border-t border-dashed border-gray-100">
                <div>
                    <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Subscriber</span>
                    <span className="font-semibold text-gray-700">{item.subscriberName}</span>
                </div>
                <div>
                     <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Price / Freq</span>
                     <span className="font-bold text-gray-900">{item.price} <span className="text-gray-400 font-normal text-[10px]">/ {item.frequency}</span></span>
                </div>
                <div className="col-span-2">
                     <span className="block text-gray-400 mb-0.5 text-[10px] uppercase font-semibold">Purpose</span>
                     <span className="text-gray-700 leading-relaxed">{item.purpose}</span>
                </div>
                 {/* Added File Info */}
                 {item.file && (
                    <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-dashed border-gray-100 mt-1">
                        <span className="text-gray-400 text-[10px] uppercase font-semibold">File:</span>
                        <a href={item.fileContent || '#'} download={item.file} className="flex items-center gap-1 text-indigo-600">
                            <FileText size={14} />
                            <span className="font-medium">{item.file}</span>
                        </a>
                    </div>
                )}
            </div>

            {/* Dates Footer */}
            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-[10px] border border-gray-100">
                <div>
                     <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Req. Date</span>
                     <span className="font-mono text-gray-600 font-bold">{formatDate(item.requestedDate)}</span>
                </div>
                <div className="text-center pl-2 border-l border-gray-200">
                     <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Start</span>
                     <span className="font-mono text-indigo-600 font-bold">{formatDate(item.startDate)}</span>
                </div>
                <div className="text-right pl-2 border-l border-gray-200">
                     <span className="block text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">End</span>
                     <span className="font-mono text-amber-600 font-bold">{formatDate(item.endDate)}</span>
                </div>
            </div>
          </div>
        ))}
         {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                <Search size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">No subscriptions found</p>
            </div>
        )}
      </div>
    </div>
    <AddSubscription isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  );
};
export default AllSubscriptions;
