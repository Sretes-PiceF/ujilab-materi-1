"use client";
import { CheckCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  duration?: number;
  onClose: () => void;
}

export default function Notification({
  message,
  type,
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const bgColor =
    type === "success"
      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400"
      : "bg-gradient-to-r from-red-50 to-red-100 border-red-400";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const iconColor = type === "success" ? "text-green-600" : "text-red-600";

  return (
    <div
      className={`relative min-w-[320px] max-w-sm ${bgColor} border-2 rounded-lg p-4 shadow-lg 
      transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {type === "success" ? (
            <CheckCircle className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${textColor} mb-1`}>
            {type === "success" ? "Berhasil!" : "Error!"}
          </h3>
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${iconColor} hover:opacity-80 rounded-full p-1 transition-all`}
          type="button"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-200 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${
            type === "success" ? "bg-green-500" : "bg-red-500"
          } animate-shrink`}
          style={{ animationDuration: `${duration}ms` }}
        ></div>
      </div>
    </div>
  );
}