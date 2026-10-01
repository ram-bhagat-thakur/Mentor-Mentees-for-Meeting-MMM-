const defaultInstitutionalSuffixes = [".edu", ".ac.in"];

export function isInstitutionalEmail(email) {
  if (typeof email !== "string") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const separatorIndex = normalizedEmail.lastIndexOf("@");

  if (separatorIndex <= 0 || separatorIndex === normalizedEmail.length - 1) {
    return false;
  }

  const domain = normalizedEmail.slice(separatorIndex + 1);
  const approvedDomains = (process.env.APPROVED_CAMPUS_EMAIL_DOMAINS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase().replace(/^\.+/, ""))
    .filter(Boolean);

  return (
    defaultInstitutionalSuffixes.some((suffix) => domain.endsWith(suffix)) ||
    approvedDomains.some((approvedDomain) =>
      domain === approvedDomain || domain.endsWith(`.${approvedDomain}`),
    )
  );
}