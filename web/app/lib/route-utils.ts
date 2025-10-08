import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type {
  BaseActionData,
  BaseLoaderData,
  MetaFunction,
} from "./route-types";

// API base URL - should be moved to environment config
const API_BASE_URL = "http://localhost:5000/api";

/**
 * Generic error handler for loaders
 */
export function handleLoaderError(
  error: unknown,
  context: string
): BaseLoaderData {
  console.error(`${context}:`, error);
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return { data: null, error: errorMessage };
}

/**
 * Generic error handler for actions
 */
export function handleActionError(
  error: unknown,
  context: string
): BaseActionData {
  console.error(`${context}:`, error);
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return { success: false, error: errorMessage };
}

/**
 * Generic fetch utility with error handling
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a standardized loader function
 */
export function createLoader<T>(
  loaderFn: (args: LoaderFunctionArgs) => Promise<T>,
  context: string
) {
  return async (args: LoaderFunctionArgs): Promise<BaseLoaderData<T>> => {
    try {
      const data = await loaderFn(args);
      return { data };
    } catch (error) {
      return handleLoaderError(error, context);
    }
  };
}

/**
 * Create a standardized action function
 */
export function createAction<T>(
  actionFn: (args: ActionFunctionArgs) => Promise<T>,
  context: string
) {
  return async (args: ActionFunctionArgs): Promise<BaseActionData<T>> => {
    try {
      const data = await actionFn(args);
      return { success: true, data };
    } catch (error) {
      return handleActionError(error, context);
    }
  };
}

/**
 * Create standardized meta function
 */
export function createMeta({ title, description, keywords }: MetaFunction) {
  return () => [
    { title },
    ...(description ? [{ name: "description", content: description }] : []),
    ...(keywords ? [{ name: "keywords", content: keywords.join(", ") }] : []),
  ];
}

/**
 * Validate required route parameters
 */
export function validateParams<T extends Record<string, string>>(
  params: Partial<T>,
  required: (keyof T)[]
): T {
  for (const key of required) {
    if (!params[key]) {
      throw new Error(`Missing required parameter: ${String(key)}`);
    }
  }
  return params as T;
}

/**
 * Parse search parameters with defaults
 */
export function parseSearchParams(
  request: Request,
  defaults: Record<string, string | number> = {}
): Record<string, string | number> {
  const url = new URL(request.url);
  const params: Record<string, string | number> = { ...defaults };

  for (const [key, value] of url.searchParams.entries()) {
    // Try to parse as number if it looks like one
    const numValue = Number(value);
    params[key] = !isNaN(numValue) && value !== "" ? numValue : value;
  }

  return params;
}

/**
 * Create form data handler for actions
 */
export async function handleFormData(
  request: Request,
  expectedFields: string[] = []
): Promise<Record<string, any>> {
  const formData = await request.formData();
  const data: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    // Handle file uploads
    if (value instanceof File) {
      data[key] = value;
    } else {
      // Try to parse JSON values
      try {
        data[key] = JSON.parse(value as string);
      } catch {
        data[key] = value;
      }
    }
  }

  // Validate expected fields
  for (const field of expectedFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return data;
}
