const express = require("express");
const axios = require("axios");

const router = express.Router();

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke/api/v2";

const {
    PAYHERO_API_USERNAME,
    PAYHERO_API_PASSWORD,
    PAYHERO_CHANNEL_ID,
    PAYHERO_CALLBACK_URL // set this in .env to a real public URL (e.g. via ngrok during dev)
} = process.env;

// Fail fast at startup if config is missing
if (!PAYHERO_API_USERNAME || !PAYHERO_API_PASSWORD || !PAYHERO_CHANNEL_ID) {
    console.warn("⚠️  PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD and PAYHERO_CHANNEL_ID must be set in .env");
}

const KENYAN_PHONE_REGEX = /^254(7|1)\d{8}$/;

router.post("/stk-push", async(req, res) => {
    try {
        const { phone_number, amount, email } = req.body;

        if (!phone_number || !amount) {
            return res.status(400).json({
                success: false,
                message: "Phone number and amount are required"
            });
        }

        // Server-side validation — never trust the client
        if (!KENYAN_PHONE_REGEX.test(phone_number)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number. Expected format: 2547XXXXXXXX or 2541XXXXXXXX"
            });
        }

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount < 1) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a number of at least 1"
            });
        }

        const payload = {
            amount: numericAmount,
            phone_number,
            channel_id: PAYHERO_CHANNEL_ID,
            provider: "m-pesa",
            external_reference: `TXN-${Date.now()}`,
            callback_url: PAYHERO_CALLBACK_URL || "https://your-public-domain.com/api/payhero/payhero-callback",
            metadata: email ? { email } : undefined
        };

        const response = await axios.post(
            `${PAYHERO_BASE_URL}/payments`,
            payload, {
                auth: {
                    username: PAYHERO_API_USERNAME,
                    password: PAYHERO_API_PASSWORD
                },
                timeout: 30000
            }
        );

        return res.json({
            success: true,
            message: "STK Push sent successfully",
            data: response.data
        });

    } catch (error) {
        const payheroMessage =
            error.response &&
            error.response.data &&
            (error.response.data.message || error.response.data.errorMessage);

        console.error("STK ERROR:", payheroMessage || error.message);

        const status = error.response ? error.response.status : 500;

        return res.status(status === 401 ? 500 : status || 500).json({
            success: false,
            message: payheroMessage ||
                (status === 401 ? "PayHero authentication failed — check your API credentials" : "Payment initiation failed")
        });
    }
});

router.post("/payhero-callback", (req, res) => {
    console.log("PayHero Callback:", JSON.stringify(req.body, null, 2));
    // TODO: verify the transaction result, mark the order paid, send tickets by email/SMS
    res.sendStatus(200);
});

module.exports = router;