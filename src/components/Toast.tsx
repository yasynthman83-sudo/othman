import React, { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, duration = 4000, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const isError = type === 'error' || message.includes('❌') || message.includes('Error');
  const isSuccess = !isError;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className={`bg-white border rounded-lg shadow-2xl p-4 flex items-center space-x-3 min-w-[300px] max-w-[500px] ${
        isError ? 'border-red-200' : 'border-green-200'
      }`}>
        <div className="flex-shrink-0">
          {isError ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${
            isError ? 'text-red-900' : 'text-gray-900'
          }`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;