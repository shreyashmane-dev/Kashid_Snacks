const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Retrieve credentials
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || functions.config().cloudinary?.cloud_name;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || functions.config().cloudinary?.api_key;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || functions.config().cloudinary?.api_secret;

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret;

// Server-Side Rate Limiter using Firestore
async function enforceRateLimit(identifier, limit = 5, timeframeMs = 60000) {
  const now = Date.now();
  const limitRef = db.collection("rate_limits").doc(identifier);
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(limitRef);
    let attempts = [];
    if (doc.exists) {
      attempts = doc.data().attempts || [];
    }
    attempts = attempts.filter(time => now - time < timeframeMs);
    
    if (attempts.length >= limit) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Please wait a moment before trying again."
      );
    }
    
    attempts.push(now);
    transaction.set(limitRef, { attempts });
  });
}

/**
 * Cloudinary Secure Signed Upload Generator
 */
exports.generateCloudinarySignature = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }
  
  const { folder, timestamp } = data;
  if (!folder) {
    throw new functions.https.HttpsError("invalid-argument", "Missing upload folder path");
  }
  
  await enforceRateLimit(`cloudinary_${context.auth.uid}`, 10, 60000);

  const allowedFolders = ["products", "categories", "avatars", "banners"];
  if (!allowedFolders.includes(folder)) {
    throw new functions.https.HttpsError("permission-denied", "Unauthorized upload folder structure");
  }

  const paramsToSign = {
    folder: folder,
    timestamp: timestamp
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    CLOUDINARY_API_SECRET
  );

  return {
    signature: signature,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME
  };
});

/**
 * Server-Side Razorpay Order Creation
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { amount, currency = "INR" } = data;
  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid payment amount");
  }

  await enforceRateLimit(`razorpay_${context.auth.uid}`, 3, 60000);

  try {
    const instance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await instance.orders.create(options);
    return order;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to initialize payment order");
  }
});

/**
 * Server-Side Cryptographic Razorpay Signature Verification
 */
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new functions.https.HttpsError("invalid-argument", "Missing payment verification parameters");
  }

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new functions.https.HttpsError("permission-denied", "Payment verification signature mismatch");
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    await orderRef.update({
      paymentId: razorpayPaymentId,
      paymentStatus: "Completed",
      status: "Order Placed",
      timeline: admin.firestore.FieldValue.arrayUnion({
        status: "Payment Confirmed",
        time: new Date().toISOString(),
        note: "Payment successfully verified by server backend."
      })
    });

    return { status: "success" };
  } catch (error) {
    console.error("Order status update failed:", error);
    throw new functions.https.HttpsError("internal", "Failed to update order placement in database");
  }
});
