// Mirrors the backend's passwordSchema (learningcoachbackEnd/src/modules/auth/schemas.ts)
// so a weak password is rejected before the round trip, not just after.
export function passwordError(pw: string, locale: "pt" | "en"): string | null {
  if (pw.length < 8)
    return locale === "pt"
      ? "A palavra-passe precisa de pelo menos 8 caracteres"
      : "Password needs at least 8 characters";
  if (!/[a-zA-Z]/.test(pw))
    return locale === "pt"
      ? "A palavra-passe precisa de pelo menos uma letra"
      : "Password needs at least one letter";
  if (!/[0-9]/.test(pw))
    return locale === "pt"
      ? "A palavra-passe precisa de pelo menos um número"
      : "Password needs at least one number";
  return null;
}
