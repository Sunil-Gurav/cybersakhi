// Simple test endpoint for Vercel deployment verification
export default function handler(req, res) {
  res.status(200).json({
    message: "🛡️ CyberSakhi API Test Endpoint",
    status: "success",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    vercel: true
  });
}