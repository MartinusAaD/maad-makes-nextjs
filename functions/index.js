const { onCall, HttpsError } = require("firebase-functions/v2/https");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { defineString } = require("firebase-functions/params");

admin.initializeApp();

// Define email configuration parameters
const emailUser = defineString("EMAIL_USER");
const emailPass = defineString("EMAIL_PASS");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser.value(),
      pass: emailPass.value(),
    },
  });

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return `${Number(value).toFixed(2)} kr`;
};

const formatAddress = (customer) => {
  if (!customer) return "";
  const lines = [
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
    customer.address || "",
    `${customer.postalCode || ""} ${customer.city || ""}`.trim(),
  ].filter(Boolean);
  return lines.join("<br>");
};

const buildItemsTable = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "<p>No items</p>";
  }

  const rows = items
    .map((item) => {
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const total = qty * price;
      return `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #eee;">${item.title || "Item"}</td>
          <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:center;">${qty}</td>
          <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(price)}</td>
          <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:right;">${formatCurrency(total)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px; border-bottom:2px solid #ddd;">Item</th>
          <th align="center" style="padding-bottom:8px; border-bottom:2px solid #ddd;">Qty</th>
          <th align="right" style="padding-bottom:8px; border-bottom:2px solid #ddd;">Price</th>
          <th align="right" style="padding-bottom:8px; border-bottom:2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const getTrackingUrl = (trackingCode, provider) => {
  if (!trackingCode) return null;

  const normalizedProvider = (provider || "posten").toLowerCase();

  switch (normalizedProvider) {
    case "posten":
      return `https://sporing.posten.no/sporing/${encodeURIComponent(trackingCode)}`;
    case "postnord":
      return `https://www.postnord.no/pakkesporing/?shipmentId=${encodeURIComponent(trackingCode)}`;
    case "helthjem":
      return `https://helthjem.no/sporing/${encodeURIComponent(trackingCode)}`;
    default:
      return `https://sporing.posten.no/sporing/${encodeURIComponent(trackingCode)}`;
  }
};

const buildTrackingBlock = (order) => {
  if (!order?.trackingCode) return "";

  const provider = order.shippingProvider || "posten";
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
  const trackingUrl = getTrackingUrl(order.trackingCode, provider);

  return `
    <div style="background-color:#f0f9ff; border:1px solid #0284c7; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0 0 8px 0;"><strong>Tracking Information</strong></p>
      <p style="margin:0;"><strong>Provider:</strong> ${providerName}</p>
      <p style="margin:8px 0 0 0;">
        <strong>Tracking Number:</strong> 
        <a href="${trackingUrl}" style="color:#0284c7; text-decoration:none; font-weight:600;">
          ${order.trackingCode}
        </a>
      </p>
      <p style="margin:8px 0 0 0; font-size:14px;">
        <a href="${trackingUrl}" style="display:inline-block; background-color:#0284c7; color:white; padding:8px 16px; text-decoration:none; border-radius:4px; font-weight:600;">
          Track Your Package
        </a>
      </p>
    </div>
  `;
};

exports.sendContactEmail = onCall(
  { region: "europe-west1" },
  async (request) => {
    // Configure email transport inside the function
    const transporter = createTransporter();

    // Validate input
    const { name, email, subject, message } = request.data;

    if (!name || !email || !subject || !message) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email format");
    }

    // Email to business
    const mailOptionsToAdmin = {
      from: `"${name}" <${email}>`,
      to: "maad.makes@gmail.com",
      replyTo: email,
      subject: `Contact Form: ${subject} - ${name}`,
      html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message.replace(/\n/g, "<br>")}</p>
    `,
    };

    // Auto-reply email to customer
    const mailOptionsToCustomer = {
      from: '"MAaD Makes" <maad.makes@gmail.com>',
      to: email,
      subject: "We received your message - MAaD Makes",
      html: `
      <h2>Thank you for contacting us!</h2>
      <p>Hi ${name},</p>
      <p>We've received your message and will get back to you as soon as possible.</p>

      <hr>
      
      <h3>Your message:</h3>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message.replace(/\n/g, "<br>")}</p>
      
      
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
      
      <p>Best regards,<br>
      Martinus, MAaD Makes<br>
      <a href="mailto:maad.makes@gmail.com">maad.makes@gmail.com</a></p>
    `,
    };

    try {
      // Send both emails
      await Promise.all([
        transporter.sendMail(mailOptionsToAdmin),
        transporter.sendMail(mailOptionsToCustomer),
      ]);
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new HttpsError("internal", "Failed to send email");
    }
  },
);

exports.sendOrderConfirmationEmails = onDocumentCreated(
  { document: "orders/{orderId}", region: "europe-west1" },
  async (event) => {
    const order = event.data?.data();
    if (!order) {
      console.error("Order data missing for email trigger");
      return;
    }

    const customer = order.customer || {};
    const customerEmail = customer.email;
    const customerName =
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    const itemsTable = buildItemsTable(order.items);
    const orderNumber = order.orderNumber || event.params.orderId;

    const transporter = createTransporter();

    const adminHtml = `
      <h2>New Order Received</h2>
      <p><strong>Order #:</strong> ${orderNumber}</p>
      <p><strong>Customer:</strong> ${customerName || "N/A"}</p>
      <p><strong>Email:</strong> ${customer.email || "N/A"}</p>
      <p><strong>Phone:</strong> ${customer.phone || "N/A"}</p>
      <p><strong>Shipping Address:</strong><br>${formatAddress(customer)}</p>
      <hr>
      <h3>Items</h3>
      ${itemsTable}
      <div style="margin-top:16px;">
        <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
        <p><strong>Shipping:</strong> ${formatCurrency(order.shipping)}</p>
        ${order.savings > 0 ? `<p><strong>Savings:</strong> -${formatCurrency(order.savings)}</p>` : ""}
        <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      </div>
      ${customer.comment ? `<hr><p><strong>Customer Comment:</strong><br>${customer.comment.replace(/\n/g, "<br>")}</p>` : ""}
    `;

    const customerHtml = `
      <h2>Thanks for your order${customerName ? `, ${customerName}` : ""}!</h2>
      <p>Your order has been received and we will contact you regarding payment and estimated completion time.</p>
      <p><strong>Order #:</strong> ${orderNumber}</p>
      <hr>
      <h3>Order Summary</h3>
      ${itemsTable}
      <div style="margin-top:16px;">
        <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
        <p><strong>Shipping:</strong> ${formatCurrency(order.shipping)}</p>
        ${order.savings > 0 ? `<p><strong>Savings:</strong> -${formatCurrency(order.savings)}</p>` : ""}
        <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      </div>
      <hr>
      <h3>Shipping Information</h3>
      <p>${formatAddress(customer)}</p>
      <p>We'll send another email once your order ships.</p>
      <p style="margin-top:20px;">Best regards,<br>Martinus, MAaD Makes</p>
    `;

    const mailOptionsToAdmin = {
      from: '"MAaD Makes" <maad.makes@gmail.com>',
      to: "maad.makes@gmail.com",
      subject: `New Order #${orderNumber}`,
      html: adminHtml,
    };

    const mailOptionsToCustomer = customerEmail
      ? {
          from: '"MAaD Makes" <maad.makes@gmail.com>',
          to: customerEmail,
          subject: `Your order #${orderNumber} has been received`,
          html: customerHtml,
        }
      : null;

    try {
      const sendTasks = [transporter.sendMail(mailOptionsToAdmin)];
      if (mailOptionsToCustomer) {
        sendTasks.push(transporter.sendMail(mailOptionsToCustomer));
      } else {
        console.warn(
          `Order ${orderNumber} has no customer email. Customer email skipped.`,
        );
      }
      await Promise.all(sendTasks);
    } catch (error) {
      console.error("Error sending order confirmation emails:", error);
    }
  },
);

exports.sendOrderShippedEmail = onDocumentUpdated(
  { document: "orders/{orderId}", region: "europe-west1" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;

    const statusChangedToShipped =
      before.status !== "shipped" && after.status === "shipped";

    if (!statusChangedToShipped) return;
    if (after.shippedEmailSent) return;

    const customer = after.customer || {};
    const customerEmail = customer.email;
    if (!customerEmail) {
      console.warn(
        `Order ${event.params.orderId} shipped, but no customer email found.`,
      );
      return;
    }

    const customerName =
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    const orderNumber = after.orderNumber || event.params.orderId;
    const itemsTable = buildItemsTable(after.items);
    const trackingBlock = buildTrackingBlock(after);

    const transporter = createTransporter();

    const shippedHtml = `
      <h2>Your order${customerName ? `, ${customerName}` : ""} has shipped!</h2>
      <p><strong>Order #:</strong> ${orderNumber}</p>
      ${trackingBlock}
      <hr>
      <h3>Order Summary</h3>
      ${itemsTable}
      <div style="margin-top:16px;">
        <p><strong>Subtotal:</strong> ${formatCurrency(after.subtotal)}</p>
        <p><strong>Shipping:</strong> ${formatCurrency(after.shipping)}</p>
        ${after.savings > 0 ? `<p><strong>Savings:</strong> -${formatCurrency(after.savings)}</p>` : ""}
        <p><strong>Total:</strong> ${formatCurrency(after.total)}</p>
      </div>
      <hr>
      <h3>Shipping Information</h3>
      <p>${formatAddress(customer)}</p>
      <p style="margin-top:20px;">Thanks again for your order!<br>Martinus, MAaD Makes</p>
    `;

    try {
      await transporter.sendMail({
        from: '"MAaD Makes" <maad.makes@gmail.com>',
        to: customerEmail,
        subject: `Your order #${orderNumber} has shipped`,
        html: shippedHtml,
      });

      await admin.firestore().doc(`orders/${event.params.orderId}`).update({
        shippedEmailSent: true,
        shippedEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending shipped email:", error);
    }
  },
);
