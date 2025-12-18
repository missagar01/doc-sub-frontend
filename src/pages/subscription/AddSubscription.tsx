import React, { useState } from 'react';
import useDataStore, { SubscriptionItem } from '../../store/dataStore';
import { toast } from 'react-hot-toast';
import { X, Save } from 'lucide-react';

interface AddSubscriptionProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddSubscription: React.FC<AddSubscriptionProps> = ({ isOpen, onClose }) => {

  const { addSubscription, subscriptions } = useDataStore();
  const [formData, setFormData] = useState({
    companyName: '',
    subscriberName: '',
    subscriptionName: '',
    price: '',
    frequency: '',
    purpose: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate Serial Number
    const nextNum = subscriptions.length + 1;
    const sn = `SN-${String(nextNum).padStart(3, '0')}`;
    
    // Current Date
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const requestedDate = `${day}/${month}/${year}`;

    const newItem: SubscriptionItem = {
      id: Math.random().toString(36).substr(2, 9),
      sn,
      requestedDate,
      startDate: '',
      endDate: '',
      status: '', // As requested to be blank
      service: formData.subscriptionName, // backwards compatibility
      plan: formData.frequency, // mapping frequency to plan for legacy views if needed
      renewalDate: '', // legacy
      ...formData
    };
    
    addSubscription(newItem);
    toast.success('Subscription added successfully');
    onClose();
    setFormData({ companyName: '', subscriberName: '', subscriptionName: '', price: '', frequency: '', purpose: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-input my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Add Subscription</h2>
            <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8">
            <form id="add-sub-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 shadow-input border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={formData.companyName}
                      onChange={e => setFormData({...formData, companyName: e.target.value})}
                      placeholder="e.g. Netflix Inc"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subscriber Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 shadow-input border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={formData.subscriberName}
                      onChange={e => setFormData({...formData, subscriberName: e.target.value})}
                      placeholder="e.g. John Doe"
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 shadow-input border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.subscriptionName}
                  onChange={e => setFormData({...formData, subscriptionName: e.target.value})}
                  placeholder="e.g. Netflix Premium"
                />
              </div>
              
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 shadow-input border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="e.g. $19.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                  <select
                    required
                    className="w-full p-3 shadow-input border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    value={formData.frequency}
                    onChange={e => setFormData({...formData, frequency: e.target.value})}
                  >
                      <option value="" disabled>Select Frequency</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

               <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                <textarea
                  required
                  rows={3}
                  className="w-full p-3 shadow-input border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  value={formData.purpose}
                  onChange={e => setFormData({...formData, purpose: e.target.value})}
                  placeholder="Why is this subscription needed?"
                />
              </div>
            </form>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
             <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl shadow-input border-none text-gray-700 font-medium hover:bg-white hover:border-gray-300 transition-all shadow-sm"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="add-sub-form"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
                <Save size={18} />
                Save Subscription
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubscription;
