const http = require("http");
const https = require("https");

const API_BASE = "http://localhost:3000/api/v1";

async function api(path, options = {}) {
  const start = Date.now();
  const url = `${API_BASE}${path}`;

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      (res) => {
        let data = [];
        res.on("data", (chunk) => data.push(chunk));
        res.on("end", () => {
          const duration = Date.now() - start;
          const buffer = Buffer.concat(data);
          resolve({
            status: res.statusCode,
            durationMs: duration,
            sizeBytes: buffer.length,
            data: buffer,
            headers: res.headers,
          });
        });
      },
    );

    req.on("error", (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function measure() {
  console.log("=== STARTING BASELINE PERFORMANCE MEASUREMENT ===");

  // 1. Admin Login
  const loginRes = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@gov.in", password: "Admin@123456" }),
  });
  const adminToken = JSON.parse(loginRes.data.toString()).accessToken;
  console.log(`Admin Login: ${loginRes.durationMs} ms (Status ${loginRes.status})`);

  const headers = { Authorization: `Bearer ${adminToken}` };

  // 2. Health Endpoint
  const health = await api("/health");
  console.log(`GET /health: ${health.durationMs} ms (${health.sizeBytes} bytes)`);

  // 3. Admin Dashboard Stats
  const stats = await api("/admin/success/stats", { headers });
  console.log(`GET /admin/success/stats: ${stats.durationMs} ms (${stats.sizeBytes} bytes)`);

  // 4. All Applications
  const apps = await api("/applications", { headers });
  console.log(`GET /applications: ${apps.durationMs} ms (${apps.sizeBytes} bytes)`);

  const appsList = JSON.parse(apps.data.toString());
  const sampleApp = appsList[0];

  // 5. Single Application Details
  let appDetailMs = 0;
  if (sampleApp) {
    const appDetail = await api(`/applications/${sampleApp.id}`, { headers });
    appDetailMs = appDetail.durationMs;
    console.log(`GET /applications/${sampleApp.id}: ${appDetail.durationMs} ms (${appDetail.sizeBytes} bytes)`);
  }

  // 6. Registered Users Directory
  const users = await api("/admin/success/users", { headers });
  console.log(`GET /admin/success/users: ${users.durationMs} ms (${users.sizeBytes} bytes)`);

  // 7. Services Catalog
  const services = await api("/services", { headers });
  console.log(`GET /services: ${services.durationMs} ms (${services.sizeBytes} bytes)`);

  // 8. Delivery Logs
  const logs = await api("/admin/delivery-logs", { headers });
  console.log(`GET /admin/delivery-logs: ${logs.durationMs} ms (${logs.sizeBytes} bytes)`);

  // 9. PDF Receipt Generation / Download
  let pdfReceiptMs = 0;
  if (sampleApp) {
    const receipt = await api(`/receipts/${sampleApp.id}`, { headers });
    pdfReceiptMs = receipt.durationMs;
    console.log(`GET /receipts/${sampleApp.id}: ${receipt.durationMs} ms (${receipt.sizeBytes} bytes)`);
  }

  // 10. Document Download URL lookup
  let docDownloadMs = 0;
  if (sampleApp && sampleApp.documents && sampleApp.documents[0]) {
    const docId = sampleApp.documents[0].id;
    const docLookup = await api(`/documents/${docId}/download`, { headers });
    docDownloadMs = docLookup.durationMs;
    console.log(`GET /documents/${docId}/download: ${docLookup.durationMs} ms (${docLookup.sizeBytes} bytes)`);
  }

  console.log("\n=== BASELINE MEASUREMENT SUMMARY ===");
  console.log(`Dashboard Stats API: ${stats.durationMs} ms`);
  console.log(`Applications API:    ${apps.durationMs} ms`);
  console.log(`Application Detail:  ${appDetailMs} ms`);
  console.log(`Users Directory API: ${users.durationMs} ms`);
  console.log(`Services API:        ${services.durationMs} ms`);
  console.log(`Delivery Logs API:   ${logs.durationMs} ms`);
  console.log(`PDF Receipt Gen:     ${pdfReceiptMs} ms`);
  console.log(`Document Lookup:     ${docDownloadMs} ms`);
  console.log("=====================================\n");
}

measure().catch((err) => console.error("Measurement error:", err));
