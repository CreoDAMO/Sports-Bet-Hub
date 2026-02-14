import { useState, useCallback } from "react";
import type { BetSlipItem } from "@shared/schema";
import { calculatePayout, calculateParlayOdds } from "./sports-data";

let globalSlipItems: BetSlipItem[] = [];
let globalListeners: Set<() => void> = new Set();

function notify() {
  globalListeners.forEach((l) => l());
}

export function useBetSlip() {
  const [, setTick] = useState(0);

  const subscribe = useCallback(() => {
    const listener = () => setTick((t) => t + 1);
    globalListeners.add(listener);
    return () => { globalListeners.delete(listener); };
  }, []);

  useState(() => {
    const unsub = subscribe();
    return unsub;
  });

  const addItem = useCallback((item: Omit<BetSlipItem, "stake">) => {
    const exists = globalSlipItems.find(
      (i) => i.gameId === item.gameId && i.betType === item.betType && i.selection === item.selection
    );
    if (exists) {
      globalSlipItems = globalSlipItems.filter((i) => i.id !== exists.id);
    } else {
      globalSlipItems = [...globalSlipItems, { ...item, stake: 0 }];
    }
    notify();
  }, []);

  const removeItem = useCallback((id: string) => {
    globalSlipItems = globalSlipItems.filter((i) => i.id !== id);
    notify();
  }, []);

  const updateStake = useCallback((id: string, stake: number) => {
    globalSlipItems = globalSlipItems.map((i) =>
      i.id === id ? { ...i, stake } : i
    );
    notify();
  }, []);

  const clearSlip = useCallback(() => {
    globalSlipItems = [];
    notify();
  }, []);

  const isSelected = useCallback((gameId: string, betType: string, selection: string) => {
    return globalSlipItems.some(
      (i) => i.gameId === gameId && i.betType === betType && i.selection === selection
    );
  }, []);

  const items = globalSlipItems;
  const totalStake = items.reduce((sum, i) => sum + (i.stake || 0), 0);
  const parlayOdds = calculateParlayOdds(items);
  const parlayPayout = items.length >= 2 && totalStake > 0
    ? calculatePayout(totalStake, parlayOdds)
    : 0;

  return {
    items,
    addItem,
    removeItem,
    updateStake,
    clearSlip,
    isSelected,
    totalStake,
    parlayOdds,
    parlayPayout,
    count: items.length,
  };
}
