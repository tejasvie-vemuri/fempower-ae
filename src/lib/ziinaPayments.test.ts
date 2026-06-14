import {
  buildPaymentIntentPayload,
  buildRefundPayload,
  computeHmacHex,
  toRegistrationStatus,
  verifyHmacSignature,
} from "../../supabase/functions/_shared/ziina-core";

describe("Ziina payment helpers", () => {
  it("builds payment intent payloads in base currency units", () => {
    expect(
      buildPaymentIntentPayload({
        amount: 15000,
        currency_code: "aed",
        message: "Fempower event",
        success_url: "https://fempowerae.com/events/test?checkout=success",
        cancel_url: "https://fempowerae.com/events/test?checkout=cancelled",
        failure_url: "https://fempowerae.com/events/test?checkout=failed",
        operation_id: "operation-1",
        test: true,
      }),
    ).toEqual({
      amount: 15000,
      currency_code: "AED",
      message: "Fempower event",
      success_url: "https://fempowerae.com/events/test?checkout=success",
      cancel_url: "https://fempowerae.com/events/test?checkout=cancelled",
      failure_url: "https://fempowerae.com/events/test?checkout=failed",
      operation_id: "operation-1",
      test: true,
      allow_tips: false,
    });
  });

  it("maps Ziina payment statuses to registration statuses", () => {
    expect(toRegistrationStatus("completed")).toBe("confirmed");
    expect(toRegistrationStatus("pending")).toBe("pending");
    expect(toRegistrationStatus("requires_user_action")).toBe("pending");
    expect(toRegistrationStatus("failed")).toBe("cancelled");
    expect(toRegistrationStatus("canceled")).toBe("cancelled");
    expect(toRegistrationStatus("unknown")).toBeNull();
  });

  it("verifies webhook HMAC signatures", async () => {
    const body = JSON.stringify({ event: "payment_intent.status.updated" });
    const signature = await computeHmacHex(body, "secret");

    await expect(verifyHmacSignature(body, "secret", signature)).resolves.toBe(true);
    await expect(verifyHmacSignature(body, "secret", "bad")).resolves.toBe(false);
  });

  it("builds refund payloads", () => {
    expect(
      buildRefundPayload({
        id: "refund-1",
        payment_intent_id: "pi_123",
        amount: 5000,
        currency_code: "aed",
        test: true,
      }),
    ).toEqual({
      id: "refund-1",
      payment_intent_id: "pi_123",
      amount: 5000,
      currency_code: "AED",
      test: true,
    });
  });
});
