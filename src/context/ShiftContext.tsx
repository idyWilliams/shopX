import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Shift } from '../db/models/Shift';
import { getActiveShift, openShift as openShiftService, closeShift as closeShiftService } from '../services/ShiftService';

type ShiftContextType = {
  activeShift: Shift | null;
  isLoadingShift: boolean;
  openShift: (openingCashFloat: number) => Promise<void>;
  closeShift: (declaredCash: number, declaredTransfers: number, expectedCash: number, expectedTransfers: number) => Promise<void>;
};

const ShiftContext = createContext<ShiftContextType>({
  activeShift: null,
  isLoadingShift: true,
  openShift: async () => {},
  closeShift: async () => {},
});

export const ShiftProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeStoreId, currentAttendant } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState(true);

  // Load active shift when store changes
  useEffect(() => {
    const loadActiveShift = async () => {
      if (!activeStoreId) {
        setActiveShift(null);
        setIsLoadingShift(false);
        return;
      }
      
      try {
        setIsLoadingShift(true);
        const shift = await getActiveShift(activeStoreId);
        setActiveShift(shift);
      } catch (err) {
        console.error('Failed to load active shift:', err);
      } finally {
        setIsLoadingShift(false);
      }
    };
    
    loadActiveShift();
  }, [activeStoreId]);

  const openShift = async (openingCashFloat: number) => {
    if (!activeStoreId) throw new Error('No active store');
    
    const shift = await openShiftService(
      activeStoreId, 
      currentAttendant?.id ?? null, 
      openingCashFloat
    );
    setActiveShift(shift);
  };

  const closeShift = async (
    declaredCash: number, 
    declaredTransfers: number, 
    expectedCash: number, 
    expectedTransfers: number
  ) => {
    if (!activeStoreId || !activeShift) throw new Error('No active store or shift');
    
    const updatedShift = await closeShiftService(
      activeShift.id, 
      activeStoreId, 
      declaredCash, 
      declaredTransfers, 
      expectedCash, 
      expectedTransfers
    );
    setActiveShift(null);
  };

  return (
    <ShiftContext.Provider value={{ 
      activeShift, 
      isLoadingShift, 
      openShift, 
      closeShift 
    }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => useContext(ShiftContext);
