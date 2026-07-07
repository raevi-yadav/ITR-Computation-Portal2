import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type
}: NotificationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="notif-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            id="notif-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {type === 'success' ? (
                  <CheckCircle className="w-8 h-8 text-indigo-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-rose-500 shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-6 tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line leading-relaxed">
                    {message}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all focus:outline-hidden cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
