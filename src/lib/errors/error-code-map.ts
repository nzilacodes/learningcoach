import type { ErrorCode } from "@/lib/api/client";
import type { Locale } from "@/lib/i18n";

export type ErrorAction = "retry" | "reauth" | "upgrade" | "none";
export type ErrorSeverity = "error" | "warning" | "info";

type CopyEntry = {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  retryable: boolean;
  action: ErrorAction;
  severity: ErrorSeverity;
};

// Generic per-code, not per-screen — screen-specific reassurance ("your
// answers are saved", "your message wasn't lost") is layered on by the
// calling component (see routes/placement.tsx, routes/ai-coach.tsx), so this
// table doesn't need a code × screen combinatorial matrix. Copy follows the
// spec's own Portuguese examples verbatim where one was given.
export const ErrorCodeMap: Record<ErrorCode, CopyEntry> = {
  VALIDATION_ERROR: {
    title: { pt: "Verifique os dados", en: "Check the form" },
    description: {
      pt: "Corrija os campos indicados e tente novamente.",
      en: "Please fix the highlighted fields and try again.",
    },
    retryable: false,
    action: "none",
    severity: "warning",
  },
  AUTH_SESSION_EXPIRED: {
    title: { pt: "A sua sessão expirou", en: "Your session expired" },
    description: { pt: "Entre novamente para continuar.", en: "Please sign in again to continue." },
    retryable: false,
    action: "reauth",
    severity: "info",
  },
  PERMISSION_DENIED: {
    title: { pt: "Sem permissão", en: "Not allowed" },
    description: {
      pt: "Não tem permissão para esta ação.",
      en: "You don't have permission for this action.",
    },
    retryable: false,
    action: "none",
    severity: "warning",
  },
  NOT_FOUND: {
    title: { pt: "Não encontrado", en: "Not found" },
    description: {
      pt: "Este conteúdo já não está disponível.",
      en: "This content is no longer available.",
    },
    retryable: false,
    action: "none",
    severity: "info",
  },
  CONFLICT: {
    title: { pt: "Já foi feito", en: "Already done" },
    description: {
      pt: "Esta ação já foi concluída anteriormente.",
      en: "This action was already completed.",
    },
    retryable: false,
    action: "none",
    severity: "info",
  },
  RATE_LIMITED: {
    title: { pt: "Muitos pedidos", en: "Too many requests" },
    description: {
      pt: "Aguarde um instante e tente novamente.",
      en: "Please wait a moment and try again.",
    },
    retryable: true,
    action: "retry",
    severity: "warning",
  },
  PAYMENT_REQUIRED: {
    title: { pt: "Funcionalidade premium", en: "Premium feature" },
    description: {
      pt: "Esta funcionalidade requer um plano ativo.",
      en: "This feature requires an active plan.",
    },
    retryable: false,
    action: "upgrade",
    severity: "info",
  },
  AI_SERVICE_UNAVAILABLE: {
    title: { pt: "Serviço temporariamente indisponível", en: "Service temporarily unavailable" },
    description: {
      pt: "O serviço de avaliação está temporariamente indisponível. Tente novamente dentro de alguns minutos.",
      en: "The service is temporarily unavailable. Please try again in a few minutes.",
    },
    retryable: true,
    action: "retry",
    severity: "warning",
  },
  AI_SERVICE_TIMEOUT: {
    title: { pt: "O serviço demorou demasiado", en: "The service took too long" },
    description: {
      pt: "Não conseguimos concluir a tempo. Tente novamente.",
      en: "We couldn't finish in time. Please try again.",
    },
    retryable: true,
    action: "retry",
    severity: "warning",
  },
  AI_SERVICE_LIMIT_REACHED: {
    title: {
      pt: "Avaliação temporariamente indisponível",
      en: "Evaluation temporarily unavailable",
    },
    description: {
      pt: "O serviço de avaliação atingiu temporariamente o limite disponível. A equipa responsável já foi informada.",
      en: "The evaluation service has temporarily reached its available limit. Our team has already been notified.",
    },
    retryable: true,
    action: "retry",
    severity: "warning",
  },
  AI_EVALUATION_FAILED: {
    title: { pt: "Não foi possível concluir a avaliação", en: "Couldn't complete the evaluation" },
    description: {
      pt: "Não foi possível concluir esta avaliação agora. As suas respostas foram guardadas e não serão perdidas.",
      en: "We couldn't complete this evaluation right now. Your answers were saved and won't be lost.",
    },
    retryable: true,
    action: "retry",
    severity: "warning",
  },
  NETWORK_ERROR: {
    title: { pt: "Sem ligação à internet", en: "No internet connection" },
    description: {
      pt: "Verifique a sua conexão e tente novamente.",
      en: "Check your connection and try again.",
    },
    retryable: true,
    action: "retry",
    severity: "error",
  },
  SERVER_ERROR: {
    title: { pt: "Não foi possível concluir a operação", en: "Couldn't complete the operation" },
    description: {
      pt: "A equipa técnica foi informada.",
      en: "Our technical team has been notified.",
    },
    retryable: true,
    action: "retry",
    severity: "error",
  },
  UNKNOWN_ERROR: {
    title: { pt: "Ocorreu um problema inesperado", en: "Something unexpected happened" },
    description: {
      pt: "Tente novamente. Se persistir, contacte o suporte.",
      en: "Please try again. Contact support if it persists.",
    },
    retryable: true,
    action: "retry",
    severity: "error",
  },
};
