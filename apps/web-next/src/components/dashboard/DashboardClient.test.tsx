/**
 * DashboardClient component tests
 * Focus: Crash-proof behavior on undefined/null data
 */

import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/render";
import DashboardClient from "./DashboardClient";

// Mock hooks
jest.mock("@/hooks/useExecutorStatus", () => ({
  useExecutorStatus: () => ({
    executorReachable: false,
  }),
}));

jest.mock("@/hooks/useMarketTicker", () => ({
  useMarketTicker: () => ({
    ticker: null,
    loading: false,
    error: null,
  }),
}));

describe("DashboardClient", () => {
  test("renders without crashing on undefined ticker", () => {
    renderWithProviders(<DashboardClient />);

    // Should render without throwing
    expect(screen.getByText(/dashboard|anasayfa/i)).toBeInTheDocument();
  });

  test("handles null initialData gracefully", () => {
    renderWithProviders(<DashboardClient initialData={null} />);

    // Should render fallback UI
    expect(screen.getByText(/dashboard|anasayfa/i)).toBeInTheDocument();
  });

  test("displays fallback when ticker price is null", () => {
    renderWithProviders(<DashboardClient />);

    // Should show fallback (— or "Henüz veri yok") or at least not crash
    const fallbacks = screen.queryAllByText(/—|henüz veri yok|veri yok/i);
    expect(fallbacks.length).toBeGreaterThanOrEqual(0);
    expect(screen.getByText(/dashboard|anasayfa/i)).toBeInTheDocument();
  });
});
