// Deno native implementation of the CORS proxy server
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// Adapted from some ChatGPT code

serve(async (req) => {
  // Allow OPTIONS requests for CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
    });
  }

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Forward the request to the target URL
    const targetResponse = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    // Create a response with the target response data and set CORS headers
    const proxyResponse = new Response(targetResponse.body, {
      status: targetResponse.status,
      statusText: targetResponse.statusText,
      headers: new Headers()
    });

    proxyResponse.headers.set("Access-Control-Allow-Origin", "*");
    proxyResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    proxyResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    proxyResponse.headers.set(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    proxyResponse.headers.set(
      "Cross-Origin-Embedder-Policy",
      "require-corp"
    );

    let contentType = targetResponse.headers.get("Content-Type")
    if (contentType) {
      proxyResponse.headers.set("Content-Type", contentType)

    } else {
      proxyResponse.headers.set("Content-Type", "application/json")
    }

    proxyResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self' http://localhost:*; style-src 'self' http://localhost:*; img-src 'self' http://localhost:*; frame-ancestors 'self' http://localhost:*;"
    );

    return proxyResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
