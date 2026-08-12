import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api/client";
import { ErrorCodeMap } from "./error-code-map";
import { normalizeApiError, getErrorAction } from "./normalize-api-error";

// Anything matching these must never appear in copy shown to users — this is
// the regression guard tied directly to the bug report (raw OpenAI JSON,
// insufficient_quota/credit_balance_exhausted, "Evaluation failed. Try again."
// as the sole explanation).
const LEAK_PATTERNS = [
  /insufficient_quota/i,
  /credit_balance_exhausted/i,
  /"error"\s*:/i,
  /statusCode/i,
  /stack trace/i,
  /Evaluation failed\.\s*Try again\./i,
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorCodeMap leak guard", () => {
  it("never contains raw provider/technical strings in any locale", () => {
    for (const [code, entry] of Object.entries(ErrorCodeMap)) {
      for (const locale of ["pt", "en"] as const) {
        const title = entry.title[locale];
        const description = entry.description[locale];
        for (const pattern of LEAK_PATTERNS) {
          expect(title, `${code}.title.${locale} matched ${pattern}`).not.toMatch(pattern);
          expect(description, `${code}.description.${locale} matched ${pattern}`).not.toMatch(pattern);
        }
      }
    }
  });
});

describe("normalizeApiError", () => {
  it("maps an ApiError's code to the matching ErrorCodeMap entry", () => {
    const err = new ApiError("safe backend fallback message", 503, "AI_SERVICE_LIMIT_REACHED", true, "req-123");
    const normalized = normalizeApiError(err, "pt");
    expect(normalized.code).toBe("AI_SERVICE_LIMIT_REACHED");
    expect(normalized.title).toBe(ErrorCodeMap.AI_SERVICE_LIMIT_REACHED.title.pt);
    expect(normalized.retryable).toBe(true);
    expect(normalized.requestId).toBe("req-123");
  });

  it("never surfaces the raw ApiError.message even if the backend regresses and sends one", () => {
    const rawLeak = '{"error":{"message":"...","type":"insufficient_quota","code":"credit_balance_exhausted"}}';
    const err = new ApiError(rawLeak, 429, "AI_SERVICE_LIMIT_REACHED");
    const normalized = normalizeApiError(err, "pt");
    expect(normalized.title).not.toContain(rawLeak);
    expect(normalized.description).not.toContain(rawLeak);
    for (const pattern of LEAK_PATTERNS) {
      expect(normalized.title).not.toMatch(pattern);
      expect(normalized.description).not.toMatch(pattern);
    }
  });

  it("falls back to UNKNOWN_ERROR for a non-ApiError", () => {
    const normalized = normalizeApiError(new Error("some local JS error"), "en");
    expect(normalized.code).toBe("UNKNOWN_ERROR");
    expect(normalized.title).toBe(ErrorCodeMap.UNKNOWN_ERROR.title.en);
  });

  it("falls back to UNKNOWN_ERROR for a thrown non-Error value", () => {
    const normalized = normalizeApiError("just a string", "en");
    expect(normalized.code).toBe("UNKNOWN_ERROR");
  });
});

describe("getErrorAction", () => {
  it("returns the upgrade CTA for a PAYMENT_REQUIRED-shaped error when onUpgrade is provided", () => {
    const normalized = normalizeApiError(new ApiError("x", 402, "PAYMENT_REQUIRED"), "pt");
    const onUpgrade = vi.fn();
    const action = getErrorAction(normalized, { onUpgrade });
    expect(action?.label).toBe("Ver planos");
    action?.onClick();
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it("returns undefined when the matching handler isn't provided", () => {
    const normalized = normalizeApiError(new ApiError("x", 402, "PAYMENT_REQUIRED"), "pt");
    expect(getErrorAction(normalized, {})).toBeUndefined();
  });

  it("returns the retry CTA for a retryable error when onRetry is provided", () => {
    const normalized = normalizeApiError(new ApiError("x", 503, "AI_SERVICE_UNAVAILABLE", true), "pt");
    const onRetry = vi.fn();
    const action = getErrorAction(normalized, { onRetry });
    expect(action?.label).toBe("Tentar novamente");
  });
});
