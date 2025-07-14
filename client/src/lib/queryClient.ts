import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options?: {
    headers?: Record<string, string>;
    responseType?: 'json' | 'blob';
  }
): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(data);
  }

  const res = await fetch(url, fetchOptions);

  await throwIfResNotOk(res);
  
  // Handle different response types
  if (options?.responseType === 'blob') {
    return res; // Return response object for blob handling
  }
  
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    // Handle unauthorized access (401 and 403)
    if ((res.status === 401 || res.status === 403) && unauthorizedBehavior === "returnNull") {
      return null;
    }

    // For 403 errors, clear invalid token
    if (res.status === 403) {
      localStorage.removeItem('token');
      window.location.reload();
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
