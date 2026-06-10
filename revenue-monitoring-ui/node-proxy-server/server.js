const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;
const authClientId = process.env.AUTH_CLIENT_ID || "frs-oath-prod";
const authClientSecret =
  process.env.AUTH_CLIENT_SECRET ||
  "SeCUzxUXA-rgxBw8wWBkL8bOlViFg_0l-EdUkRoZgQwWmO-XkG-SVw_LNNVYBcj2";
const authUrl = process.env.AUTH_URL || "http://localhost:8080/api/";
const o2cRedirectTarget =
  process.env.O2C_REDIRECT_TARGET || "http://localhost:3500";
const CONTROL_TOWER_SUPPORT_AGENT_API_URL =
  process.env.CONTROL_TOWER_SUPPORT_AGENT_API_URL || "http://localhost:8000";

app.use(express.json());
app.set("trust proxy", true);

function extractClientIp(req) {
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.trim()) {
    return xForwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return String(xForwardedFor[0]).split(",")[0].trim();
  }

  const forwarded = req.headers.forwarded;
  if (typeof forwarded === "string" && forwarded.includes("for=")) {
    const match = forwarded.match(/for="?\[?([^;\],"]+)/i);
    if (match && match[1]) return match[1].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

app.use((req, res, next) => {
  req.authenticatedUserName = req.headers["auth_user"];
  req.authenticatedUserFirstName = req.headers["givenname"];

  const clientIp = extractClientIp(req);

  const importantHeaders = {
    host: req.headers.host || null,
    clientIp,
    xForwardedFor: req.headers["x-forwarded-for"] || null,
    forwarded: req.headers.forwarded || null,
    origin: req.headers.origin || null,
    referer: req.headers.referer || null,
    userAgent: req.headers["user-agent"] || null,
    secFetchSite: req.headers["sec-fetch-site"] || null,
    secFetchMode: req.headers["sec-fetch-mode"] || null,
    secFetchDest: req.headers["sec-fetch-dest"] || null,
    contentType: req.headers["content-type"] || null,
    contentLength: req.headers["content-length"] || null,
  };

  const pathOnly = req.path || req.originalUrl?.split("?")[0] || "";
  const isClientLogRequest = pathOnly === "/client-log";
  const isStaticAssetRequest =
    req.method === "GET" &&
    !pathOnly.startsWith("/api") &&
    !pathOnly.startsWith("/client-log") &&
    pathOnly !== "/user/name";

  if (!isStaticAssetRequest && !isClientLogRequest) {
    console.log(
      JSON.stringify({
        type: "edge-request",
        timestamp: new Date().toISOString(),
        authenticatedUserName: req.authenticatedUserName || null,
        method: req.method,
        path: pathOnly,
        ...importantHeaders,
      }),
    );
  }

  next();
});

app.get("/user/name", (req, res) => {
  res.json({
    auth_user: req.authenticatedUserName,
    auth_user_name: req.authenticatedUserFirstName,
    auth_client_id: authClientId,
    auth_client_secret: authClientSecret,
    auth_url: authUrl,
    control_tower_support_agent_api_url: CONTROL_TOWER_SUPPORT_AGENT_API_URL,
  });
});

app.post("/client-log", (req, res) => {
  const body = req.body || {};
  const clientIp = extractClientIp(req);

  const securityLog = {
    type: body.type || "client-http-log",
    requestId: body.requestId || null,
    sessionId: body.sessionId || null,
    timestamp: body.timestamp || new Date().toISOString(),
    authenticatedUserName: req.authenticatedUserName || null,
    method: body.method || null,
    urlPath: body.urlPath || null,
    status: body.status ?? null,
    durationMs: body.durationMs ?? null,
    errorMessage: body.errorMessage || null,
    host: body.host || req.headers.host || null,
    clientIp,
    xForwardedFor: req.headers["x-forwarded-for"] || null,
    forwarded: req.headers.forwarded || null,
    origin: body.origin || req.headers.origin || null,
    referer: body.referrer || req.headers.referer || null,
    secFetchSite: body.secFetchSite || req.headers["sec-fetch-site"] || null,
    secFetchMode: body.secFetchMode || req.headers["sec-fetch-mode"] || null,
    secFetchDest: body.secFetchDest || req.headers["sec-fetch-dest"] || null,
    contentType: body.contentType || req.headers["content-type"] || null,
    contentLength: body.contentLength ?? req.headers["content-length"] ?? null,
    userAgent: body.userAgent || req.headers["user-agent"] || null,
  };

  console.log(JSON.stringify(securityLog));
  res.sendStatus(204);
});

// Serve Storybook at /storybook/ path (no auth required)
app.use(
  "/storybook",
  express.static(path.join(__dirname, "../ui/storybook-static")),
);
app.get("/storybook/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/storybook-static", "index.html"));
});

// Prevent Angular fallback from hijacking /o2c traffic which is served by the React app.
// In production, OpenShift Routes handle this. Locally, proxy to the React dev server.
if (o2cRedirectTarget) {
  app.use(
    "/o2c",
    createProxyMiddleware({
      target: o2cRedirectTarget,
      changeOrigin: true,
    }),
  );
} else {
  app.use((req, res, next) => {
    if (req.path === "/o2c" || req.path.startsWith("/o2c/")) {
      return res.status(404).send("/o2c is served by the O2C UI deployment");
    }
    next();
  });
}

// Proxy for CaseIQ Supervisor Agent API (avoids CORS)
const CASEIQ_SUPERVISOR_API_URL =
  process.env.CASEIQ_SUPERVISOR_API_URL ||
  "https://caseiq-supervisor-agent-dev.cloudapps.cisco.com";
const CASEIQ_SUPERVISOR_API_KEY =
  process.env.CASEIQ_SUPERVISOR_API_KEY ||
  "X0dWEsVGsPGDFqHhuncUjFhb95PX9TkP_bwf1cKhg4Q";

app.use(
  "/api/caseiq-supervisor",
  createProxyMiddleware({
    target: CASEIQ_SUPERVISOR_API_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/caseiq-supervisor": "/api/v1" },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader(
        "Authorization",
        `Bearer ${CASEIQ_SUPERVISOR_API_KEY}`,
      );
    },
  }),
);

app.use(express.static(path.join(__dirname, "../ui/dist/browser")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../ui/dist/browser", "index.html"));
});

app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
