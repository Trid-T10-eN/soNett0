import "dotenv/config";
import express from "express";
import cors from "cors";

import placesRouter from "./routes/places";
import checkoutRouter from "./routes/checkout";
import { chatSSE } from "./routes/chat";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/chat", chatSSE);
app.use("/places", placesRouter);
app.use("/checkout", checkoutRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 BFF running on http://localhost:${PORT}`));
