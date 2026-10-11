let csrf = "";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function setCsrf(value: string) {
  csrf = value;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    const details = Array.isArray(data.details)
      ? data.details
          .slice(0, 2)
          .map((issue: { message: string }) => issue.message)
          .join(" ")
      : "";
    throw new ApiError(
      [data.error || "Permintaan tidak berhasil.", details]
        .filter(Boolean)
        .join(" "),
      response.status,
    );
  }
  return data as T;
}
export const body = (value: unknown) => JSON.stringify(value);
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Ada kendala. Silakan coba lagi.";
