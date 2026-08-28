declare module "react-native-razorpay" {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name?: string;
    description?: string;
    order_id?: string;
    image?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
      color?: string;
    };
  }

  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayErrorResponse {
    code?: number;
    description?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  }

  const RazorpayCheckout: {
    open(
      options: RazorpayOptions
    ): Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}