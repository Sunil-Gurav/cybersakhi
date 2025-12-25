import express from "express";
import { triggerSos, notifyFamily } from "../controllers/sosController.js";

const router = express.Router();

router.post("/trigger", triggerSos);
router.post("/notify-family", notifyFamily);

export default router;