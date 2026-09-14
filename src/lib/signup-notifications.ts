import "server-only";
import { sendEmail } from "@/lib/email/send";
import {
  adminNotificationAddress,
  presidentPhotoAttachment,
} from "@/lib/email/recipients";
import { newApplicationAdminEmail, welcomeEmail } from "@/lib/email/templates";

type ServiceClient = Parameters<typeof adminNotificationAddress>[0];

export interface NewApplicant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
}

/**
 * The two mails a new application sends, whichever way it came in (the email
 * form or "Continue with Google"): a welcome to the applicant, and an alert to
 * the admins, since nothing about an application moves until one of them looks
 * at the queue. Sending never throws — a mail that does not go out must not
 * fail an application that did.
 */
export async function sendNewApplicationEmails(
  supabaseAdmin: ServiceClient,
  applicant: NewApplicant
): Promise<{ welcomeEmailSent: boolean; adminAlertSent: boolean }> {
  const member = { firstName: applicant.firstName, lastName: applicant.lastName };

  // Embedded rather than linked, so the letter renders whatever the recipient's
  // client does about remote images.
  const presidentPhoto = await presidentPhotoAttachment(supabaseAdmin);
  const welcome = welcomeEmail(member, Boolean(presidentPhoto));

  const mail = await sendEmail({
    to: applicant.email,
    subject: welcome.subject,
    html: welcome.html,
    text: welcome.text,
    attachments: presidentPhoto
      ? [{ ...presidentPhoto, contentId: "bnms-president" }]
      : undefined,
  });

  const adminTo = await adminNotificationAddress(supabaseAdmin);
  let adminAlertSent = false;

  if (adminTo) {
    const alert = newApplicationAdminEmail(member, {
      email: applicant.email,
      phone: applicant.phone,
      city: applicant.city,
    });

    const adminMail = await sendEmail({
      to: adminTo,
      subject: alert.subject,
      html: alert.html,
      text: alert.text,
    });
    adminAlertSent = adminMail.sent;
  }

  return { welcomeEmailSent: mail.sent, adminAlertSent };
}
