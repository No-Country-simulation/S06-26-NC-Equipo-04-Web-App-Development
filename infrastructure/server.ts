import express, { Express } from "express";
import { config } from "dotenv";

const app: Express  = express();
config()
const SERVER_PORT = process.env.SERVER_PORT;

// Health Server Ping
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "GovTech API is running" });
});


app.listen(SERVER_PORT, async () => {
  console.log(`🚀 Servidor GovTech corriendo en el puerto http://localhost:${SERVER_PORT}`);
});