import { apiRequest, getStoredToken, API_BASE_URL } from "./apiClient";

let loadPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser only"));
  }
  if ((window as any).Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * Create a Razorpay order via NestJS backend.
 * POST /api/v1/payments/create-order
 */
export async function createRazorpayOrder(
  serviceType: string,
  applicationId: string,
): Promise<RazorpayOrderResponse> {
  const res = await apiRequest<RazorpayOrderResponse>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ serviceType, applicationId }),
  });
  return res;
}

/**
 * Verify a Razorpay payment via NestJS backend.
 * POST /api/v1/payments/verify
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  applicationId: string,
): Promise<{ success: boolean; paymentId: string }> {
  const res = await apiRequest<{ success: boolean; paymentId: string }>(
    "/payments/verify",
    {
      method: "POST",
      body: JSON.stringify({ orderId, paymentId, signature, applicationId }),
    },
  );
  return res;
}

export interface RazorpayHandlerResult {
  paymentId: string;
  orderId: string;
  signature: string;
}

export function openRazorpayCheckout(
  order: RazorpayOrderResponse,
  serviceName: string,
  applicantName: string,
  email: string,
): Promise<RazorpayHandlerResult> {
  return new Promise((resolve, reject) => {
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Success MP Online",
      description: serviceName,
      image: "",
      order_id: order.orderId,
      prefill: {
        name: applicantName,
        email,
      },
      theme: { color: "#0d47a1" },
      handler: (response: any) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled by user")),
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", (resp: any) => {
      reject(new Error(resp.error?.description ?? "Payment failed"));
    });
    rzp.open();
  });
}
