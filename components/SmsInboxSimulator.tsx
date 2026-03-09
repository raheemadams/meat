import React, { useState } from 'react';
import { SimulatedSms } from '../types';
import { useNavigate } from 'react-router-dom';

interface Props {
  messages: SimulatedSms[];
}

export default function SmsInboxSimulator({ messages }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-full shadow-xl transition-colors"
      >
        <i className="fa-solid fa-message text-sm"></i>
        <span className="text-sm font-semibold">SMS Inbox</span>
        <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ml-1">
          {messages.length > 9 ? '9+' : messages.length}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-message text-white text-sm"></i>
              <span className="text-white text-sm font-semibold">Simulated SMS Inbox</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
            <p className="text-xs text-slate-500">
              <i className="fa-solid fa-circle-info mr-1"></i>
              These are simulated SMS messages. Click a payment link to act as the recipient.
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {messages.map((msg, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                    {msg.recipientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{msg.recipientName}</p>
                    <p className="text-xs text-slate-400">{msg.to}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
                    ${msg.amount.toFixed(2)}
                  </span>
                </div>

                {/* SMS bubble */}
                <div className="bg-slate-100 rounded-xl rounded-tl-none px-3 py-2 ml-10 text-xs text-slate-700 leading-relaxed">
                  {msg.message}
                </div>

                {/* Payment link button */}
                <div className="ml-10 mt-2">
                  <button
                    onClick={() => {
                      // Extract token from paymentLink
                      const token = msg.paymentLink.split('/pay/')[1];
                      if (token) {
                        setOpen(false);
                        navigate(`/pay/${token}`);
                      }
                    }}
                    className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    Open Payment Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
