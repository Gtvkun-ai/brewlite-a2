import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrderResponse } from "../lib/types";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "o1" }),
}));

vi.mock("../lib/orders-api", () => ({
  fetchOrders: vi.fn(),
  fetchOrder: vi.fn(),
  isUsingFixtures: false,
}));

import { ApiError } from "../lib/api";
import { formatVnd } from "../lib/format";
import { fetchOrder } from "../lib/orders-api";
import OrderDetailPage from "../app/orders/[id]/page";

const mockedFetchOrder = vi.mocked(fetchOrder);

const sampleOrder: OrderResponse = {
  id: "o1",
  code: "BL-20261106-001",
  status: "PREPARING",
  subTotal: "100000",
  discountAmount: "0",
  totalAmount: "100000",
  createdAt: "2026-11-06T01:15:00.000Z",
  items: [
    {
      id: "i1",
      productId: "p1",
      productName: "Classic Espresso",
      quantity: 2,
      unitPrice: "50000",
      selectedSize: "LARGE",
      selectedToppings: ["TRAN_CHAU"],
      itemTotal: "100000",
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("OrderDetailPage", () => {
  it("renders the order with stepper, items and total (FR-06)", async () => {
    mockedFetchOrder.mockResolvedValueOnce(sampleOrder);
    render(<OrderDetailPage />);

    expect(
      await screen.findByText("Chi tiết đơn hàng #BL-20261106-001"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("step-PREPARING")).toHaveAttribute(
      "data-state",
      "current",
    );
    expect(screen.getByText(/Classic Espresso/)).toBeInTheDocument();
    // expect(screen.getByText(`Total: ${formatVnd('100000')}`)).toBeInTheDocument();
    const total = screen.getByText(/^Tổng thanh toán:/);
    expect(total.textContent?.replace(/\s/g, " ")).toBe(
      `Tổng thanh toán: ${formatVnd("100000").replace(/\s/g, " ")}`,
    );
    expect(mockedFetchOrder).toHaveBeenCalledWith("o1");
  });

  it("polls the API and advances only when the server returns a new status", async () => {
    vi.useFakeTimers();
    mockedFetchOrder.mockResolvedValueOnce({ ...sampleOrder, status: 'PAID' });
    mockedFetchOrder.mockResolvedValueOnce({ ...sampleOrder, status: 'PREPARING' });
    mockedFetchOrder.mockResolvedValueOnce({ ...sampleOrder, status: 'COMPLETED' });
    render(<OrderDetailPage />);
    await act(async () => {});
    expect(screen.getByTestId('step-PAID')).toHaveAttribute('data-state', 'current');
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.getByTestId('step-PREPARING')).toHaveAttribute('data-state', 'current');
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.getByTestId('step-COMPLETED')).toHaveAttribute('data-state', 'current');
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(mockedFetchOrder).toHaveBeenCalledTimes(3);
  });

  it("preserves the last order during a network interruption and recovers", async () => {
    vi.useFakeTimers();
    mockedFetchOrder.mockResolvedValueOnce(sampleOrder);
    mockedFetchOrder.mockRejectedValueOnce(new Error('network down'));
    mockedFetchOrder.mockResolvedValueOnce({ ...sampleOrder, status: 'READY' });
    render(<OrderDetailPage />);
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.getByText(/Classic Espresso/)).toBeInTheDocument();
    expect(screen.getByTestId('order-refresh-status')).toHaveTextContent('Mất kết nối tạm thời');
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.getByTestId('step-READY')).toHaveAttribute('data-state', 'current');
    expect(screen.getByTestId('order-refresh-status')).not.toHaveTextContent('Mất kết nối');
  });

  it("hides order data when polling returns an authorization error", async () => {
    vi.useFakeTimers();
    mockedFetchOrder.mockResolvedValueOnce(sampleOrder);
    mockedFetchOrder.mockRejectedValueOnce(new ApiError(401, 'expired'));
    render(<OrderDetailPage />);
    await act(async () => {});
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(screen.queryByText(/Classic Espresso/)).not.toBeInTheDocument();
    expect(screen.getByText('Vui lòng đăng nhập để xem đơn hàng.')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(mockedFetchOrder).toHaveBeenCalledTimes(2);
  });

  it("clears the polling timer when the order screen unmounts", async () => {
    vi.useFakeTimers();
    mockedFetchOrder.mockResolvedValueOnce(sampleOrder);
    const view = render(<OrderDetailPage />);
    await act(async () => {});
    view.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    expect(mockedFetchOrder).toHaveBeenCalledTimes(1);
  });

  it("shows the Loading state before the fetch resolves (NFR-03)", async () => {
    let resolve: ((v: OrderResponse) => void) | undefined;
    mockedFetchOrder.mockReturnValueOnce(
      new Promise<OrderResponse>((r) => {
        resolve = r;
      }),
    );
    render(<OrderDetailPage />);

    expect(screen.getByText("Đang tải đơn hàng…")).toBeInTheDocument();

    resolve?.(sampleOrder);
    expect(
      await screen.findByText("Chi tiết đơn hàng #BL-20261106-001"),
    ).toBeInTheDocument();
  });

  it("shows a not-found message on 404 (NFR-03)", async () => {
    mockedFetchOrder.mockRejectedValueOnce(new ApiError(404, "Not found"));
    render(<OrderDetailPage />);

    expect(await screen.findByText("Không tìm thấy đơn hàng.")).toBeInTheDocument();
  });

  it("shows a permission message on 403 and no order data (NFR-02)", async () => {
    mockedFetchOrder.mockRejectedValueOnce(new ApiError(403, "Forbidden"));
    render(<OrderDetailPage />);

    expect(
      await screen.findByText("Bạn không có quyền xem đơn hàng này."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Classic Espresso/)).not.toBeInTheDocument();
  });

  it("asks the user to sign in on 401 (NFR-02)", async () => {
    mockedFetchOrder.mockRejectedValueOnce(new ApiError(401, "Unauthorized"));
    render(<OrderDetailPage />);

    expect(
      await screen.findByText("Vui lòng đăng nhập để xem đơn hàng."),
    ).toBeInTheDocument();
  });

  it("shows the Error state with a working Retry (NFR-03)", async () => {
    mockedFetchOrder.mockRejectedValueOnce(new Error("network down"));
    render(<OrderDetailPage />);

    const retry = await screen.findByRole("button", { name: /retry/i });
    mockedFetchOrder.mockResolvedValueOnce(sampleOrder);
    fireEvent.click(retry);

    expect(
      await screen.findByText("Chi tiết đơn hàng #BL-20261106-001"),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockedFetchOrder).toHaveBeenCalledTimes(2));
  });
});
