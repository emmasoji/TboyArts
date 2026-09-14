declare module "@paystack/inline-js" {
  interface PaystackTransaction {
    reference?: string;
    status?: string;
    [key: string]: unknown;
  }

  interface PaystackInstance {
    resumeTransaction(
      accessCode: string,
      callbacks?: {
        onSuccess?: (transaction: PaystackTransaction) => void;
        onCancel?: () => void;
      },
    ): void;
  }

  class PaystackPop {
    constructor();
    resumeTransaction(
      accessCode: string,
      callbacks?: {
        onSuccess?: (transaction: PaystackTransaction) => void;
        onCancel?: () => void;
      },
    ): void;
  }

  export default PaystackPop;
}
