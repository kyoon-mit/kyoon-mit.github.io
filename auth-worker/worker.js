// Cloudflare Worker: trades a GitHub App authorization code, or a refresh
// token, for a user access token, for pages on kyoon-mit.github.io.
//
// Settings in the Cloudflare dashboard (Worker > Settings > Variables and Secrets):
//   GITHUB_CLIENT_ID      text    the GitHub App's Client ID
//   GITHUB_CLIENT_SECRET  secret  the GitHub App's client secret
//
// POST /token    {"code": "..."}           after GitHub redirects back
// POST /refresh  {"refresh_token": "..."}  when the access token expires

const ORIGIN = "https://kyoon-mit.github.io";
const REDIRECT_URI = "https://kyoon-mit.github.io/auth/callback/";
const KEEP = [
  "access_token", "expires_in", "refresh_token", "refresh_token_expires_in",
  "token_type", "error", "error_description",
];

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    const path = new URL(request.url).pathname;
    if (
      request.method !== "POST" ||
      request.headers.get("Origin") !== ORIGIN ||
      (path !== "/token" && path !== "/refresh")
    ) {
      return new Response("Not found", { status: 404, headers: cors });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "bad_request" }, 400, cors);
    }
    const params = {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
    };
    if (path === "/token") {
      if (typeof body.code !== "string") return reply({ error: "bad_request" }, 400, cors);
      params.code = body.code;
      params.redirect_uri = REDIRECT_URI;
    } else {
      if (typeof body.refresh_token !== "string") return reply({ error: "bad_request" }, 400, cors);
      params.grant_type = "refresh_token";
      params.refresh_token = body.refresh_token;
    }

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    const out = {};
    for (const k of KEEP) if (k in data) out[k] = data[k];
    return reply(out, data.error ? 400 : 200, cors);
  },
};

function reply(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
