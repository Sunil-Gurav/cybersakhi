// backend/controllers/sosController.js
import Sos from "../models/sos.js";
import User from "../models/user.js";


// ===============================================
// 1️⃣ TRIGGER SOS (MAIN FUNCTION)
// ===============================================
export const triggerSos = async(req, res) => {
    try {
        const { userId, message, coords } = req.body;

        if (!userId) {
            return res.status(400).json({ msg: "userId required" });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Save SOS in DB
        const sos = await Sos.create({
            userId,
            userName: user.name,
            userEmail: user.email,
            message,
            coords,
        });

        // ⭐ FIXED — Safe extraction of family emails
        const familyEmails = Array.isArray(user.familyMembers) ?
            user.familyMembers.map((fm) => fm.email) :
            [];

        // Payload for dashboard
        const payload = {
            sosId: sos._id,
            userId,
            userName: user.name,
            userEmail: user.email,
            coords,
            createdAt: sos.createdAt,
            familyEmails,
        };

        // Emit SOS event
        const io = req.app.get("io");
        io.emit("sos_triggered", payload);

        return res.json({ msg: "SOS triggered", payload });

    } catch (error) {
        console.error("Trigger SOS Error:", error);
        return res.status(500).json({ msg: "Server Error" });
    }
};



// ===============================================
// 2️⃣ NOTIFY FAMILY (NEW FUNCTION)
// ===============================================
export const notifyFamily = async(req, res) => {
    try {
        const { userName, coords, time } = req.body;

        if (!userName || !coords) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        const payload = { userName, coords, time };

        // Emit real-time event for family dashboard
        const io = req.app.get("io");
        io.emit("family_notification", payload);

        return res.json({ msg: "Family notified", payload });

    } catch (error) {
        console.error("notifyFamily Error:", error);
        return res.status(500).json({ msg: "Server Error" });
    }
};