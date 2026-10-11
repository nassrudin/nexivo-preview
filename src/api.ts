import { isDesignPreview } from "./config";

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
  if (isDesignPreview) {
    if ((!options.method || options.method === "GET") && path === "/session")
      return { user: null, csrf: "" } as T;
    if ((!options.method || options.method === "GET") && path === "/events") {
      const response = await fetch(
        import.meta.env.BASE_URL + "preview-events.json",
        { signal: options.signal },
      );
      if (!response.ok)
        throw new ApiError(
          "Topik preview belum dapat dimuat. Silakan coba lagi.",
          response.status,
        );
      return response.json() as Promise<T>;
    }
    throw new ApiError(
      "Fitur ini belum aktif pada preview desain. Akun, pendaftaran, dan verifikasi nyata membutuhkan backend NEXIVO.",
      503,
    );
  }
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
