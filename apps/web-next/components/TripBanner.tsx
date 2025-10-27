"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface TripState {
  isTripped: boolean;
  tripReason: string | null;
  tripTime: string | null;
}

export default function TripBanner() {
  const [tripState, setTripState] = useState<TripState>({
    isTripped: false,
    tripReason: null,
    tripTime: null
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const checkTripStatus = async () => {
      try {
        const response = await fetch("/api/public/guardrails/status", {
          cache: "no-store",
          next: { revalidate: 0 }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.tripState) {
            setTripState(data.tripState);
            
            // Show banner if tripped
            if (data.tripState.isTripped) {
              setIsVisible(true);
              setIsBlinking(true);
              
              // Stop blinking after 10 seconds
              setTimeout(() => setIsBlinking(false), 10000);
            } else {
              setIsVisible(false);
              setIsBlinking(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check trip status:", error);
      }
    };

    checkTripStatus();
    const interval = setInterval(checkTripStatus, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsBlinking(false);
  };

  const handleReset = async () => {
    try {
      const response = await fetch("/api/public/guardrails/reset", {
        method: "POST",
        cache: "no-store",
        next: { revalidate: 0 }
      });
      
      if (response.ok) {
        setTripState({
          isTripped: false,
          tripReason: null,
          tripTime: null
        });
        setIsVisible(false);
        setIsBlinking(false);
      }
    } catch (error) {
      console.error("Failed to reset trip state:", error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${isBlinking ? 'animate-pulse' : ''}`}>
      <div className="bg-red-900 border-b border-red-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-200 animate-pulse" />
            <div>
              <div className="text-red-200 font-bold text-lg">
                🚨 TRIP TRIGGERED - IMMEDIATE ACTION REQUIRED 🚨
              </div>
              <div className="text-red-300 text-sm">
                Reason: {tripState.tripReason || 'Unknown'}
                {tripState.tripTime && (
                  <span className="ml-4">
                    Time: {new Date(tripState.tripTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              Reset Trip
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-red-300 hover:text-red-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 