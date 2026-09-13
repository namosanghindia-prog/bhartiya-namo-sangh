import "server-only";

/**
 * The transactional emails the organisation sends to members.
 *
 * Hand-written HTML with inline styles, on purpose. Mail clients strip <style>
 * blocks, ignore most modern CSS and Outlook renders through Word, so the
 * table-and-inline-style shape below is what survives. Every template returns a
 * plain-text alternative too — a message with no text part lands in spam far
 * more often.
 */

const BRAND = {
  saffron: "#ff6b35",
  saffronDark: "#e65c00",
  saffronPale: "#fff3e0",
  navy: "#0a1929",
  forest: "#2d5016",
  gold: "#d4af37",
  muted: "#5a6b7a",
  border: "#ffe4cc",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bhartiyanamosangh.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:${BRAND.saffron};border-radius:6px;">
          <a href="${href}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/** Wraps body HTML in the masthead, footer and the width mail clients respect. */
function shell(headingHi: string, headingEn: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(headingEn)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f7f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.saffron};padding:24px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#ffffff;">भारतीय नमो संघ</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;opacity:0.9;margin-top:4px;letter-spacing:0.5px;">BHARTIYA NAMO SANGH</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND.navy};">${escapeHtml(headingHi)}</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.muted};margin-top:2px;">${escapeHtml(headingEn)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.navy};">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.saffronPale};padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
              You are receiving this because you registered as a member at
              <a href="${SITE_URL}" style="color:${BRAND.saffronDark};">bhartiyanamosangh.com</a>.<br>
              Please do not reply to this address — it is not monitored.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface MemberSummary {
  firstName: string;
  lastName: string;
}

function fullName(member: MemberSummary): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

/** Sent the moment an account is created. */
export function welcomeEmail(member: MemberSummary): EmailContent {
  const name = fullName(member);

  return {
    subject: "Welcome to Bhartiya Namo Sangh — your application is in review",
    html: shell(
      "आपका स्वागत है",
      "Your membership application has been received",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">
        Thank you for registering with Bhartiya Namo Sangh. Your application has
        been received and is now with our team for review.
      </p>
      <p style="margin:0 0 14px 0;">
        You can sign in at any time to check its progress, correct your details
        or replace your photograph. We will email you again as soon as a
        decision has been made.
      </p>
      ${button("View my account", `${SITE_URL}/dashboard`)}
      <p style="margin:0;color:${BRAND.muted};font-size:13px;">
        सदस्यता की समीक्षा के बाद आपको सूचित किया जाएगा।
      </p>`
    ),
    text: `नमस्ते ${name},

Thank you for registering with Bhartiya Namo Sangh. Your application has been received and is now with our team for review.

You can sign in at any time to check its progress: ${SITE_URL}/dashboard

We will email you again as soon as a decision has been made.`,
  };
}

/** Eligibility approved — the membership fee is the remaining step. */
export function applicationApprovedEmail(
  member: MemberSummary,
  feeAmount: number | null
): EmailContent {
  const name = fullName(member);
  const fee =
    feeAmount && feeAmount > 0
      ? `₹${feeAmount.toLocaleString("en-IN")}`
      : null;

  return {
    subject: "Your Bhartiya Namo Sangh application has been approved",
    html: shell(
      "आपका आवेदन स्वीकृत हुआ",
      "Your application has been approved",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">
        Your membership application has been approved by our team.
        ${
          fee
            ? `One step remains: the membership contribution of <strong>${fee}</strong>.`
            : "One step remains: the membership contribution."
        }
      </p>
      <p style="margin:0 0 14px 0;">
        Sign in to see the payment details. Once the payment is confirmed, your
        membership number is issued and your ID card becomes available to
        download.
      </p>
      ${button("Complete my membership", `${SITE_URL}/dashboard/account-status`)}`
    ),
    text: `नमस्ते ${name},

Your membership application has been approved.${fee ? ` The membership contribution is ${fee}.` : ""}

Sign in to see the payment details: ${SITE_URL}/dashboard/account-status

Once the payment is confirmed, your membership number is issued and your ID card becomes available to download.`,
  };
}

/** Payment confirmed — membership is live and numbered. */
export function membershipActivatedEmail(
  member: MemberSummary,
  membershipNumber: number | null
): EmailContent {
  const name = fullName(member);

  return {
    subject: "Your Bhartiya Namo Sangh membership is active",
    html: shell(
      "आपकी सदस्यता सक्रिय हो गई है",
      "Your membership is now active",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">
        Your contribution has been confirmed and your membership is now active.
        Welcome to the Sangh.
      </p>
      ${
        membershipNumber
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;background-color:${BRAND.saffronPale};border:1px solid ${BRAND.border};border-radius:8px;">
               <tr>
                 <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
                   <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">Membership number</div>
                   <div style="font-size:22px;font-weight:bold;color:${BRAND.navy};margin-top:2px;">${membershipNumber}</div>
                 </td>
               </tr>
             </table>`
          : ""
      }
      <p style="margin:0 0 14px 0;">
        Your digital ID card and appointment letter are ready to download from
        your dashboard.
      </p>
      ${button("Download my ID card", `${SITE_URL}/dashboard/id-card`)}`
    ),
    text: `नमस्ते ${name},

Your contribution has been confirmed and your membership is now active.${
      membershipNumber ? `\n\nMembership number: ${membershipNumber}` : ""
    }

Your digital ID card and appointment letter are ready to download: ${SITE_URL}/dashboard/id-card`,
  };
}

/** Accompanies the receipt PDF for a donation. */
export function donationReceiptEmail(
  donorName: string,
  amount: number,
  receiptNumber: string
): EmailContent {
  return {
    subject: `Your donation receipt ${receiptNumber}`,
    html: shell(
      "आपके दान की रसीद",
      "Receipt for your donation",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(donorName)},</p>
      <p style="margin:0 0 14px 0;">
        Thank you for your contribution of
        <strong>₹${amount.toLocaleString("en-IN")}</strong> to Bhartiya Namo
        Sangh. Your official receipt is attached to this email.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;background-color:${BRAND.saffronPale};border:1px solid ${BRAND.border};border-radius:8px;">
        <tr>
          <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">Receipt number</div>
            <div style="font-size:16px;font-weight:bold;color:${BRAND.navy};margin-top:2px;">${escapeHtml(receiptNumber)}</div>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:${BRAND.muted};font-size:13px;">
        Please retain this receipt for your records.
      </p>`
    ),
    text: `नमस्ते ${donorName},

Thank you for your contribution of ₹${amount.toLocaleString("en-IN")} to Bhartiya Namo Sangh.

Receipt number: ${receiptNumber}

Your official receipt is attached to this email. Please retain it for your records.`,
  };
}
