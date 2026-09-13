import "server-only";
import { SIGNATORY } from "@/lib/signatory";

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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bhartiyanamosangh.com";

/**
 * Origin for images *inside* an email.
 *
 * The apex 308-redirects to www. A browser follows that without noticing, so
 * SITE_URL is fine for links, but an image is fetched by the mail client or its
 * proxy and not all of them follow a redirect — the picture just fails to
 * appear. So images are addressed at the canonical host directly.
 */
const ASSET_URL = SITE_URL.replace(/\/+$/, "").replace(
  /^https:\/\/(?!www\.)/,
  "https://www."
);

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
              <!-- Absolute URL: an email is read outside the site, and many
                   clients will not load anything but https. The white circle
                   keeps the mark legible against the saffron on clients that do
                   load it, and the alt text carries the name on those that
                   block images by default. -->
              <img src="${ASSET_URL}/logo.png" width="72" height="72"
                   alt="भारतीय नमो संघ"
                   style="display:block;margin:0 auto 12px auto;width:72px;height:72px;border:0;outline:none;text-decoration:none;background-color:#ffffff;border-radius:50%;padding:6px;">
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
              आपको यह संदेश इसलिए प्राप्त हुआ है क्योंकि आपने
              <a href="${SITE_URL}" style="color:${BRAND.saffronDark};">bhartiyanamosangh.com</a>
              पर सदस्यता के लिए पंजीकरण किया है। कृपया इस पते पर उत्तर न दें — यह निगरानी में नहीं है।<br>
              <span style="color:${BRAND.muted};opacity:0.85;">You are receiving this because you registered at bhartiyanamosangh.com. This address is not monitored.</span>
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


/**
 * Sent the moment an account is created.
 *
 * Written in Hindi and in the president's voice: this is the organisation's
 * first word to a new member, and for most of them Hindi is the language they
 * filled the form in. The English line under the signature is there so the
 * signatory is unambiguous to anyone reading it in transliteration, not as a
 * translation of the message.
 */
export function welcomeEmail(
  member: MemberSummary,
  presidentPhoto?: string | null
): EmailContent {
  const name = fullName(member);

  return {
    subject: "भारतीय नमो संघ में आपका हार्दिक स्वागत है",
    html: shell(
      "आपका हार्दिक स्वागत है",
      "A message from the National President",
      `
      <p style="margin:0 0 16px 0;">आदरणीय ${escapeHtml(name)} जी,</p>

      <p style="margin:0 0 16px 0;">
        <strong>भारतीय नमो संघ</strong> परिवार में आपका हार्दिक स्वागत है। आपने
        राष्ट्रनिर्माण एवं समाजसेवा के इस पवित्र संकल्प में सहभागी बनने का निर्णय
        लिया, इसके लिए मैं आपका हृदय से आभार व्यक्त करता हूँ।
      </p>

      <p style="margin:0 0 16px 0;">
        हमारा संगठन इस विश्वास पर खड़ा है कि परिवर्तन किसी एक व्यक्ति से नहीं,
        बल्कि समर्पित कार्यकर्ताओं के सामूहिक प्रयास से आता है। सरकार की
        जनकल्याणकारी योजनाओं को समाज के अंतिम व्यक्ति तक पहुँचाना, युवाओं,
        महिलाओं एवं किसानों को सशक्त बनाना, और एक स्वच्छ, स्वस्थ एवं आत्मनिर्भर
        भारत के निर्माण में योगदान देना — यही हमारा ध्येय है। आज से आप भी इस
        संकल्प के सहभागी हैं।
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background-color:${BRAND.saffronPale};border-left:4px solid ${BRAND.saffron};border-radius:4px;">
        <tr>
          <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.navy};">
            <strong>आगे क्या होगा?</strong><br>
            आपका सदस्यता आवेदन प्राप्त हो चुका है और वर्तमान में समीक्षाधीन है।
            समीक्षा पूर्ण होने पर आपको ईमेल द्वारा सूचित किया जाएगा। तब तक आप अपने
            खाते में जाकर अपनी जानकारी देख एवं संशोधित कर सकते हैं।
          </td>
        </tr>
      </table>

      ${button("मेरा खाता देखें", `${SITE_URL}/dashboard`)}

      <p style="margin:0 0 22px 0;">
        संगठन के प्रत्येक कार्यक्रम एवं अभियान में आपकी सक्रिय भागीदारी की
        अपेक्षा है। आपके उज्ज्वल भविष्य के लिए हार्दिक शुभकामनाएँ।
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0;border-top:1px solid ${BRAND.border};width:100%;">
        <tr>
          ${
            presidentPhoto
              ? `<td width="88" valign="top" style="padding:18px 12px 0 0;">
                   <!-- Width fixed, height left to follow. His photograph is
                        portrait (roughly 5:6), and a fixed square box would
                        squash it in Gmail and Outlook, neither of which honours
                        object-fit. Rounded rather than circular for the same
                        reason: a circle on a non-square image needs a crop. -->
                   <img src="${presidentPhoto}" width="76"
                        alt="${SIGNATORY.name}"
                        style="display:block;width:76px;height:auto;border:1px solid ${BRAND.border};border-radius:6px;">
                 </td>`
              : ""
          }
          <td valign="top" style="padding:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${BRAND.navy};">
            <div style="color:${BRAND.muted};font-size:13px;">सादर,</div>
            <!-- Absolute URL, like the masthead logo: relative paths never
                 resolve in a mail client. Alt text carries the signatory for
                 the many clients that block remote images by default. -->
            <img src="${ASSET_URL}/signature-president.png" width="170" height="42"
                 alt="${SIGNATORY.name} के हस्ताक्षर"
                 style="display:block;width:170px;height:auto;max-width:100%;margin:8px 0 2px 0;border:0;outline:none;text-decoration:none;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:bold;color:${BRAND.navy};margin-top:6px;">
              ${SIGNATORY.name}
            </div>
            <div style="color:${BRAND.saffronDark};font-size:13px;margin-top:2px;">
              ${SIGNATORY.role}, ${SIGNATORY.org}
            </div>
            <div style="color:${BRAND.muted};font-size:12px;margin-top:4px;">
              ${SIGNATORY.nameEn} — ${SIGNATORY.roleEn}
            </div>
          </td>
        </tr>
      </table>`
    ),
    text: `आदरणीय ${name} जी,

भारतीय नमो संघ परिवार में आपका हार्दिक स्वागत है। आपने राष्ट्रनिर्माण एवं समाजसेवा के इस पवित्र संकल्प में सहभागी बनने का निर्णय लिया, इसके लिए मैं आपका हृदय से आभार व्यक्त करता हूँ।

हमारा संगठन इस विश्वास पर खड़ा है कि परिवर्तन किसी एक व्यक्ति से नहीं, बल्कि समर्पित कार्यकर्ताओं के सामूहिक प्रयास से आता है। सरकार की जनकल्याणकारी योजनाओं को समाज के अंतिम व्यक्ति तक पहुँचाना, युवाओं, महिलाओं एवं किसानों को सशक्त बनाना, और एक स्वच्छ, स्वस्थ एवं आत्मनिर्भर भारत के निर्माण में योगदान देना — यही हमारा ध्येय है।

आगे क्या होगा?
आपका सदस्यता आवेदन प्राप्त हो चुका है और वर्तमान में समीक्षाधीन है। समीक्षा पूर्ण होने पर आपको ईमेल द्वारा सूचित किया जाएगा।

अपना खाता देखें: ${SITE_URL}/dashboard

आपके उज्ज्वल भविष्य के लिए हार्दिक शुभकामनाएँ।

सादर,
${SIGNATORY.name}
${SIGNATORY.role}, ${SIGNATORY.org}
(${SIGNATORY.nameEn} — ${SIGNATORY.roleEn})`,
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

/**
 * Application rejected.
 *
 * The admin screen offers no reason field, so there is nothing specific to
 * quote — the message stays factual and points them at a human rather than
 * inventing a cause.
 */
export function applicationRejectedEmail(member: MemberSummary): EmailContent {
  const name = fullName(member);

  return {
    subject: "About your Bhartiya Namo Sangh membership application",
    html: shell(
      "आपके आवेदन के संबंध में",
      "About your membership application",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">
        After review, we are not able to approve your membership application at
        this time.
      </p>
      <p style="margin:0 0 14px 0;">
        If you believe this is a mistake, or you would like to know more, please
        get in touch through the contact page and our team will look at it again.
      </p>
      ${button("Contact us", `${SITE_URL}/contact`)}
      <p style="margin:0;color:${BRAND.muted};font-size:13px;">
        किसी भी प्रश्न के लिए कृपया हमसे संपर्क करें।
      </p>`
    ),
    text: `नमस्ते ${name},

After review, we are not able to approve your membership application at this time.

If you believe this is a mistake, or would like to know more, please contact us: ${SITE_URL}/contact`,
  };
}

/** Physical ID card order moving along the printing and delivery flow. */
export function idCardStatusEmail(
  member: MemberSummary,
  status: string,
  deliveryAddress: string | null
): EmailContent {
  const name = fullName(member);

  const copy: Record<string, { hi: string; en: string; body: string }> = {
    paid: {
      hi: "भुगतान प्राप्त हुआ",
      en: "Payment received for your ID card",
      body: "We have received the payment for your membership card. It now goes into the printing queue.",
    },
    printing: {
      hi: "आपका कार्ड प्रिंट हो रहा है",
      en: "Your ID card is being printed",
      body: "Your membership card is being printed. We will email you again once it is dispatched.",
    },
    shipped: {
      hi: "आपका कार्ड भेज दिया गया है",
      en: "Your ID card has been dispatched",
      body: "Your membership card is on its way to the address below.",
    },
    delivered: {
      hi: "आपका कार्ड पहुँच गया है",
      en: "Your ID card has been delivered",
      body: "Our records show your membership card has been delivered. If it has not reached you, please contact us.",
    },
    cancelled: {
      hi: "आपका ऑर्डर रद्द कर दिया गया है",
      en: "Your ID card order was cancelled",
      body: "Your membership card order has been cancelled. If that was not expected, please contact us and we will sort it out.",
    },
  };

  const c = copy[status] ?? {
    hi: "आपके ऑर्डर की स्थिति बदली है",
    en: "Your ID card order was updated",
    body: `The status of your membership card order is now "${status}".`,
  };

  const showAddress =
    Boolean(deliveryAddress) && (status === "shipped" || status === "delivered");

  return {
    subject: c.en,
    html: shell(
      c.hi,
      c.en,
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">${escapeHtml(c.body)}</p>
      ${
        showAddress
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;background-color:${BRAND.saffronPale};border:1px solid ${BRAND.border};border-radius:8px;">
               <tr>
                 <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
                   <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">Delivery address</div>
                   <div style="font-size:14px;color:${BRAND.navy};margin-top:4px;">${escapeHtml(deliveryAddress!)}</div>
                 </td>
               </tr>
             </table>`
          : ""
      }
      ${button("View my ID card", `${SITE_URL}/dashboard/id-card`)}`
    ),
    text: `नमस्ते ${name},

${c.body}${showAddress ? `\n\nDelivery address: ${deliveryAddress}` : ""}

${SITE_URL}/dashboard/id-card`,
  };
}

/** Business listing went live in the directory. */
export function businessApprovedEmail(
  member: MemberSummary,
  businessName: string,
  expiresAt: string | null
): EmailContent {
  const name = fullName(member);
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return {
    subject: `${businessName} is now listed in the business directory`,
    html: shell(
      "आपका व्यवसाय सूचीबद्ध हो गया है",
      "Your business listing is live",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">
        <strong>${escapeHtml(businessName)}</strong> has been approved and is now
        visible in the Bhartiya Namo Sangh business directory.
      </p>
      ${
        expiry
          ? `<p style="margin:0 0 14px 0;">The listing runs until <strong>${escapeHtml(expiry)}</strong>.</p>`
          : ""
      }
      ${button("View the directory", `${SITE_URL}/businesses`)}`
    ),
    text: `नमस्ते ${name},

${businessName} has been approved and is now visible in the business directory.${
      expiry ? `\n\nThe listing runs until ${expiry}.` : ""
    }

${SITE_URL}/businesses`,
  };
}

/** Business listing refused. The admin screen requires a reason, so quote it. */
export function businessRejectedEmail(
  member: MemberSummary,
  businessName: string,
  reason: string | null
): EmailContent {
  const name = fullName(member);

  return {
    subject: `About your listing for ${businessName}`,
    html: shell(
      "आपके व्यवसाय आवेदन के संबंध में",
      "About your business listing",
      `
      <p style="margin:0 0 14px 0;">नमस्ते ${escapeHtml(name)},</p>
      <p style="margin:0 0 14px 0;">
        Your listing for <strong>${escapeHtml(businessName)}</strong> could not be
        approved.
      </p>
      ${
        reason
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;background-color:${BRAND.saffronPale};border:1px solid ${BRAND.border};border-radius:8px;">
               <tr>
                 <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
                   <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">Reason given</div>
                   <div style="font-size:14px;color:${BRAND.navy};margin-top:4px;">${escapeHtml(reason)}</div>
                 </td>
               </tr>
             </table>`
          : ""
      }
      <p style="margin:0 0 14px 0;">
        You can correct the details and submit it again from your dashboard.
      </p>
      ${button("Edit my business", `${SITE_URL}/dashboard/business`)}`
    ),
    text: `नमस्ते ${name},

Your listing for ${businessName} could not be approved.${
      reason ? `\n\nReason given: ${reason}` : ""
    }

You can correct the details and submit it again: ${SITE_URL}/dashboard/business`,
  };
}

/* ---------------------------------------------------------------------------
 * Admin alerts. Plainer than the member mail on purpose: these are worklist
 * notifications, not correspondence, and they exist because the whole
 * membership flow stalls until somebody looks at the queue.
 * ------------------------------------------------------------------------- */

export function newApplicationAdminEmail(
  member: MemberSummary,
  details: { email: string; phone: string | null; city: string | null }
): EmailContent {
  const name = fullName(member);

  return {
    subject: `New membership application: ${name}`,
    html: shell(
      "नया सदस्यता आवेदन",
      "A new application is waiting for review",
      `
      <p style="margin:0 0 14px 0;">
        <strong>${escapeHtml(name)}</strong> has registered and is waiting in the
        approvals queue.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">Email</td><td style="padding:2px 0;">${escapeHtml(details.email)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">Phone</td><td style="padding:2px 0;">${escapeHtml(details.phone ?? "—")}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">District</td><td style="padding:2px 0;">${escapeHtml(details.city ?? "—")}</td></tr>
      </table>
      ${button("Open the approvals queue", `${SITE_URL}/admin/approvals`)}`
    ),
    text: `${name} has registered and is waiting in the approvals queue.

Email: ${details.email}
Phone: ${details.phone ?? "—"}
District: ${details.city ?? "—"}

${SITE_URL}/admin/approvals`,
  };
}

export function paymentSubmittedAdminEmail(
  member: MemberSummary,
  amount: number | null
): EmailContent {
  const name = fullName(member);
  const sum =
    amount && amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "the membership fee";

  return {
    subject: `Payment submitted: ${name}`,
    html: shell(
      "भुगतान की सूचना प्राप्त हुई",
      "A member says they have paid",
      `
      <p style="margin:0 0 14px 0;">
        <strong>${escapeHtml(name)}</strong> has marked ${escapeHtml(sum)} as paid
        and is waiting for it to be checked against the bank record.
      </p>
      <p style="margin:0 0 14px 0;color:${BRAND.muted};font-size:13px;">
        Their membership stays inactive until an admin confirms the payment.
      </p>
      ${button("Open membership payments", `${SITE_URL}/admin/membership-payments`)}`
    ),
    text: `${name} has marked ${sum} as paid and is waiting for confirmation.

Their membership stays inactive until an admin confirms it.

${SITE_URL}/admin/membership-payments`,
  };
}

/* ---------------------------------------------------------------------------
 * Documents an admin sends on demand from /admin/members. The PDF itself is
 * rasterised in the admin's browser from the very same MembershipCard and
 * AppointmentLetter components they are looking at, so what the member receives
 * is byte-for-byte what the admin previewed — there is no second rendering of
 * these designs to keep in step.
 * ------------------------------------------------------------------------- */

/** Accompanies the membership ID card PDF. */
export function idCardEmail(
  member: MemberSummary,
  membershipNumber: number | null
): EmailContent {
  const name = fullName(member);

  return {
    subject: "आपका सदस्यता पहचान पत्र — भारतीय नमो संघ",
    html: shell(
      "आपका सदस्यता पहचान पत्र",
      "Your membership ID card",
      `
      <p style="margin:0 0 16px 0;">आदरणीय ${escapeHtml(name)} जी,</p>
      <p style="margin:0 0 16px 0;">
        आपका <strong>भारतीय नमो संघ</strong> सदस्यता पहचान पत्र इस ईमेल के साथ
        संलग्न है। कृपया इसे सुरक्षित रखें।
      </p>
      ${
        membershipNumber
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;background-color:${BRAND.saffronPale};border:1px solid ${BRAND.border};border-radius:8px;">
               <tr>
                 <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
                   <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">सदस्यता क्रमांक / Membership number</div>
                   <div style="font-size:22px;font-weight:bold;color:${BRAND.navy};margin-top:2px;">${membershipNumber}</div>
                 </td>
               </tr>
             </table>`
          : ""
      }
      <p style="margin:0 0 16px 0;">
        कार्ड को छापने के लिए प्रिंट सेटिंग में <strong>100%</strong> चुनें —
        इससे कार्ड वास्तविक आकार में छपेगा। आप इसे अपने खाते से कभी भी दोबारा
        डाउनलोड कर सकते हैं।
      </p>
      ${button("मेरा पहचान पत्र देखें", `${SITE_URL}/dashboard/id-card`)}`
    ),
    text: `आदरणीय ${name} जी,

आपका भारतीय नमो संघ सदस्यता पहचान पत्र इस ईमेल के साथ संलग्न है।${
      membershipNumber ? `\n\nसदस्यता क्रमांक: ${membershipNumber}` : ""
    }

कार्ड छापते समय प्रिंट सेटिंग में 100% चुनें, जिससे यह वास्तविक आकार में छपे।

अपने खाते से दोबारा डाउनलोड करें: ${SITE_URL}/dashboard/id-card`,
  };
}

/** Accompanies the appointment letter PDF. */
export function appointmentLetterEmail(
  member: MemberSummary,
  designation: string | null
): EmailContent {
  const name = fullName(member);

  return {
    subject: "आपका नियुक्ति पत्र — भारतीय नमो संघ",
    html: shell(
      "आपका नियुक्ति पत्र",
      "Your appointment letter",
      `
      <p style="margin:0 0 16px 0;">आदरणीय ${escapeHtml(name)} जी,</p>
      <p style="margin:0 0 16px 0;">
        <strong>भारतीय नमो संघ</strong> में आपका नियुक्ति पत्र इस ईमेल के साथ
        संलग्न है।
      </p>
      ${
        designation
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;background-color:${BRAND.saffronPale};border:1px solid ${BRAND.border};border-radius:8px;">
               <tr>
                 <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
                   <div style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">पद / Designation</div>
                   <div style="font-size:16px;font-weight:bold;color:${BRAND.navy};margin-top:2px;">${escapeHtml(designation)}</div>
                 </td>
               </tr>
             </table>`
          : ""
      }
      <p style="margin:0 0 16px 0;">
        हमें पूर्ण विश्वास है कि आप संगठन के उद्देश्यों एवं मूल्यों के प्रति
        निष्ठा एवं समर्पण के साथ कार्य करेंगे। आपके उज्ज्वल भविष्य के लिए हार्दिक
        शुभकामनाएँ।
      </p>
      ${button("मेरा नियुक्ति पत्र देखें", `${SITE_URL}/dashboard/appointment-letter`)}`
    ),
    text: `आदरणीय ${name} जी,

भारतीय नमो संघ में आपका नियुक्ति पत्र इस ईमेल के साथ संलग्न है।${
      designation ? `\n\nपद: ${designation}` : ""
    }

हमें पूर्ण विश्वास है कि आप संगठन के उद्देश्यों एवं मूल्यों के प्रति निष्ठा एवं समर्पण के साथ कार्य करेंगे।

अपने खाते में देखें: ${SITE_URL}/dashboard/appointment-letter`,
  };
}
