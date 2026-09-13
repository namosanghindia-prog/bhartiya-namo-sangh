import "server-only";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { SIGNATORY } from "@/lib/signatory";

/**
 * Invitation letter for नमो सेवा सम्मान - 2026, rendered on the server.
 *
 * The ID card and appointment letter are drawn as HTML and rasterised in an
 * admin's browser, but this one is generated the moment an anonymous visitor
 * registers, with no browser page to rasterise. So it is laid out directly in
 * react-pdf, borrowing the appointment letter's visual language: tricolor edge,
 * emblem letterhead with the saffron tagline pill, green-and-gold heading
 * banner, faint watermark emblem, signature block and a navy contact bar.
 *
 * Text stays text rather than an image, which needs a real Devanagari font —
 * react-pdf's built-in Helvetica has no Hindi glyphs at all. Noto Sans
 * Devanagari (SIL OFL) shapes conjuncts and matras correctly through fontkit and
 * carries Latin glyphs too, so it is used for the whole page.
 */

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "NotoSansDevanagari",
  fonts: [
    { src: path.join(FONT_DIR, "NotoSansDevanagari-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(FONT_DIR, "NotoSansDevanagari-Bold.ttf"), fontWeight: "bold" },
  ],
});

/* Brand colours, matching AppointmentLetter and the Tailwind saffron scale. */
const NAVY = "#0a1929";
const SAFFRON = "#FF9933";
const SAFFRON_500 = "#ffa651";
const SAFFRON_600 = "#ff8c42";
const SAFFRON_800 = "#e65c00";
const SAFFRON_50 = "#fffaf5";
const SAFFRON_200 = "#ffe4cc";
const GREEN = "#138808";
const BANNER_GREEN = "#0d4f1c";
const GOLD = "#d4af37";
const GOLD_PALE = "#f2dfa4";
const MUTED = "#5a6b7a";

const TOP_TAGLINE = "सेवा ही संगठन, संगठन ही शक्ति, शक्ति ही विजय";
const ORG_PILL = "राष्ट्र सेवा में समर्पित सामाजिक महासंघ";

export interface InvitationOrgContact {
  phones: string[];
  email: string | null;
  website: string | null;
  address: string | null;
}

export interface InvitationData {
  eventName: string;
  tagline: string;
  dateHi: string;
  dateEn: string;
  timeHi: string;
  timeEn: string;
  venue: string;
  fullName: string;
  guardianName: string;
  registrationNumber: string;
  issuedOn: string;
  qrDataUrl: string;
  logoDataUrl: string | null;
  signatureDataUrl: string | null;
  org: InvitationOrgContact;
}

const s = StyleSheet.create({
  page: {
    fontFamily: "NotoSansDevanagari",
    fontSize: 10,
    color: NAVY,
    backgroundColor: "#ffffff",
    flexDirection: "column",
  },
  tricolor: { flexDirection: "row", height: 6 },
  band: { flex: 1 },
  watermark: {
    position: "absolute",
    top: 250,
    left: 118,
    width: 360,
    height: 360,
    opacity: 0.045,
  },
  body: { flex: 1, paddingHorizontal: 40, paddingTop: 8 },
  topTagline: {
    textAlign: "center",
    fontSize: 9.5,
    fontWeight: "bold",
    color: SAFFRON_800,
    letterSpacing: 0.3,
  },

  letterhead: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  emblemRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: SAFFRON_500,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  emblem: { width: 74, height: 74 },
  wordmark: { flex: 1, alignItems: "center", paddingRight: 84 },
  orgRow: { flexDirection: "row", alignItems: "flex-end" },
  orgName: { fontSize: 30, fontWeight: "bold", color: NAVY, lineHeight: 1.25 },
  orgAbbr: { fontSize: 13, fontWeight: "bold", color: MUTED, marginLeft: 6, marginBottom: 7 },
  pill: {
    marginTop: 3,
    backgroundColor: SAFFRON_600,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rule: { flexDirection: "row", height: 2, marginTop: 6 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    fontSize: 9.5,
  },
  metaLabel: { fontWeight: "bold" },
  serial: { fontWeight: "bold", color: SAFFRON_800 },

  bannerWrap: { alignItems: "center", marginTop: 6 },
  banner: {
    backgroundColor: BANNER_GREEN,
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 34,
    paddingTop: 3,
    paddingBottom: 5,
    alignItems: "center",
  },
  bannerTitle: { fontSize: 22, fontWeight: "bold", color: "#ffffff", lineHeight: 1.3 },
  bannerSub: { fontSize: 7.5, fontWeight: "bold", color: GOLD_PALE, letterSpacing: 3 },

  eventName: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    color: SAFFRON_800,
    lineHeight: 1.3,
  },
  eventTagline: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "bold",
    color: GREEN,
    marginTop: 1,
  },

  salutation: { marginTop: 10, fontSize: 12 },
  guestName: { fontWeight: "bold", color: SAFFRON_800 },
  guardian: { fontSize: 10, color: MUTED, marginTop: 1 },
  paragraph: { marginTop: 8, fontSize: 11, lineHeight: 1.6, textAlign: "justify" },
  paragraphEn: { marginTop: 4, fontSize: 9, lineHeight: 1.5, color: MUTED, textAlign: "justify" },

  detailsRow: { flexDirection: "row", marginTop: 10 },
  details: {
    flex: 1,
    borderWidth: 1,
    borderColor: SAFFRON_200,
    backgroundColor: SAFFRON_50,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
  },
  detail: { flexDirection: "row", paddingVertical: 4 },
  detailDivider: { borderTopWidth: 1, borderTopColor: SAFFRON_200 },
  detailLabel: { width: 90, fontSize: 9, color: MUTED },
  detailValue: { flex: 1 },
  detailHi: { fontSize: 12, fontWeight: "bold" },
  detailEn: { fontSize: 8.5, color: MUTED },

  qrBox: {
    width: 138,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#d7dde4",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  qr: { width: 104, height: 104 },
  qrCaption: { fontSize: 8, fontWeight: "bold", color: MUTED, marginTop: 2 },
  regLabel: { fontSize: 7.5, color: MUTED, marginTop: 4 },
  regNumber: { fontSize: 9.5, fontWeight: "bold", color: SAFFRON_800 },

  notesTitle: { marginTop: 10, fontSize: 10.5, fontWeight: "bold", color: SAFFRON_800 },
  note: { flexDirection: "row", marginTop: 2, fontSize: 9.5, lineHeight: 1.5 },
  bullet: { width: 12, color: GREEN, fontWeight: "bold" },

  footerBlock: { marginTop: "auto", paddingTop: 6, paddingBottom: 8 },
  signRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  signature: { width: 130, height: 34, objectFit: "contain" },
  signLine: { width: 170, height: 1, backgroundColor: "#9aa5b1", marginTop: 2 },
  signName: { fontSize: 11, fontWeight: "bold", color: SAFFRON_800, marginTop: 3 },
  signRole: { fontSize: 9.5, fontWeight: "bold" },
  signOrg: { fontSize: 9, color: MUTED },
  closing: { alignItems: "flex-end" },
  closingHi: { fontSize: 12, fontWeight: "bold", color: GREEN },
  closingEn: { fontSize: 8, color: MUTED },
  brand: { marginTop: 4, alignItems: "center" },
  brandName: { fontSize: 11, fontWeight: "bold", letterSpacing: 3 },
  brandSub: { fontSize: 7, fontWeight: "bold", letterSpacing: 2.5, color: MUTED },

  contactBar: {
    backgroundColor: NAVY,
    paddingHorizontal: 22,
    paddingVertical: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  contactItem: { color: "#ffffff", fontSize: 8, marginHorizontal: 6 },
  contactLabel: { color: SAFFRON, fontWeight: "bold" },
});

function Tricolor({ style }: { style: typeof s.tricolor | typeof s.rule }) {
  return (
    <View style={style}>
      <View style={[s.band, { backgroundColor: SAFFRON }]} />
      <View style={[s.band, { backgroundColor: "#e5e7eb" }]} />
      <View style={[s.band, { backgroundColor: GREEN }]} />
    </View>
  );
}

function Detail({
  label,
  hi,
  en,
  first,
}: {
  label: string;
  hi: string;
  en?: string;
  first?: boolean;
}) {
  return (
    <View style={first ? s.detail : [s.detail, s.detailDivider]}>
      <Text style={s.detailLabel}>{label}</Text>
      <View style={s.detailValue}>
        <Text style={s.detailHi}>{hi}</Text>
        {en ? <Text style={s.detailEn}>{en}</Text> : null}
      </View>
    </View>
  );
}

const NOTES = [
  "कृपया कार्यक्रम स्थल पर प्रवेश हेतु यह आमंत्रण पत्र (प्रिंट या मोबाइल पर) साथ लाएँ। / Please bring this letter for entry.",
  "प्रवेश के समय QR कोड स्कैन कर पंजीकरण का सत्यापन किया जाएगा। / The QR code is scanned at entry.",
  "यह आमंत्रण पत्र व्यक्तिगत है एवं हस्तांतरणीय नहीं है। / This invitation is personal and non-transferable.",
  "कृपया निर्धारित समय से पूर्व कार्यक्रम स्थल पर पहुँचें। / Kindly arrive before the scheduled time.",
];

export function EventInvitationLetter({ data }: { data: InvitationData }) {
  const contacts = [
    data.org.phones.length ? { label: "फ़ोन", value: data.org.phones.join(" | ") } : null,
    data.org.email ? { label: "Email", value: data.org.email } : null,
    data.org.website ? { label: "Web", value: data.org.website } : null,
    data.org.address ? { label: "पता", value: data.org.address } : null,
  ].filter((c): c is { label: string; value: string } => c !== null);

  return (
    <Document
      title={`${data.eventName} — Invitation ${data.registrationNumber}`}
      author="Bhartiya Namo Sangh"
    >
      <Page size="A4" style={s.page}>
        <Tricolor style={s.tricolor} />

        {data.logoDataUrl ? <Image src={data.logoDataUrl} style={s.watermark} fixed /> : null}

        <View style={s.body}>
          <Text style={s.topTagline}>{TOP_TAGLINE}</Text>

          {/* Letterhead */}
          <View style={s.letterhead}>
            <View style={s.emblemRing}>
              {data.logoDataUrl ? <Image src={data.logoDataUrl} style={s.emblem} /> : null}
            </View>
            <View style={s.wordmark}>
              <View style={s.orgRow}>
                <Text style={s.orgName}>भारतीय नमो संघ</Text>
                <Text style={s.orgAbbr}>(BNMS)</Text>
              </View>
              <Text style={s.pill}>{ORG_PILL}</Text>
            </View>
          </View>

          <Tricolor style={s.rule} />

          <View style={s.metaRow}>
            <Text>
              <Text style={s.metaLabel}>दिनांक: </Text>
              {data.issuedOn}
            </Text>
            <Text>
              <Text style={s.metaLabel}>पंजीकरण संख्या: </Text>
              <Text style={s.serial}>{data.registrationNumber}</Text>
            </Text>
          </View>

          {/* Heading banner */}
          <View style={s.bannerWrap}>
            <View style={s.banner}>
              <Text style={s.bannerTitle}>आमंत्रण पत्र</Text>
              <Text style={s.bannerSub}>INVITATION LETTER</Text>
            </View>
          </View>

          <Text style={s.eventName}>{data.eventName}</Text>
          <Text style={s.eventTagline}>{data.tagline}</Text>

          {/* Addressee */}
          <Text style={s.salutation}>
            आदरणीय <Text style={s.guestName}>{data.fullName}</Text> जी,
          </Text>
          <Text style={s.guardian}>पिता / माता / पति: {data.guardianName}</Text>

          <Text style={s.paragraph}>
            भारतीय नमो संघ (BNMS) की ओर से आपको सादर आमंत्रित किया जाता है कि आप
            &quot;{data.eventName}&quot; — {data.tagline} कार्यक्रम में पधारकर
            कार्यक्रम की शोभा बढ़ाएँ। आपका पंजीकरण सफलतापूर्वक हो चुका है। आपकी
            गरिमामयी उपस्थिति हमारे लिए सम्मान का विषय होगी।
          </Text>
          <Text style={s.paragraphEn}>
            Bhartiya Namo Sangh cordially invites you to {data.eventName}. Your
            registration is confirmed, and we look forward to welcoming you.
          </Text>

          {/* Event details and QR */}
          <View style={s.detailsRow}>
            <View style={s.details}>
              <Detail first label="दिनांक / Date" hi={data.dateHi} en={data.dateEn} />
              <Detail label="समय / Time" hi={data.timeHi} en={data.timeEn} />
              <Detail label="स्थान / Venue" hi={data.venue} />
            </View>
            <View style={s.qrBox}>
              <Image src={data.qrDataUrl} style={s.qr} />
              <Text style={s.qrCaption}>स्कैन कर सत्यापित करें</Text>
              <Text style={s.regLabel}>Registration No.</Text>
              <Text style={s.regNumber}>{data.registrationNumber}</Text>
            </View>
          </View>

          {/* Notes */}
          <Text style={s.notesTitle}>आवश्यक निर्देश / Instructions</Text>
          {NOTES.map((note) => (
            <View key={note} style={s.note}>
              <Text style={s.bullet}>•</Text>
              <Text style={{ flex: 1 }}>{note}</Text>
            </View>
          ))}

          {/* Signature */}
          <View style={s.footerBlock}>
            <View style={s.signRow}>
              <View>
                <Text style={{ fontSize: 9, color: MUTED }}>सादर,</Text>
                {data.signatureDataUrl ? (
                  <Image src={data.signatureDataUrl} style={s.signature} />
                ) : (
                  <View style={{ height: 34 }} />
                )}
                <View style={s.signLine} />
                <Text style={s.signName}>{SIGNATORY.name}</Text>
                <Text style={s.signRole}>{SIGNATORY.role}</Text>
                <Text style={s.signOrg}>{SIGNATORY.org}</Text>
              </View>
              <View style={s.closing}>
                <Text style={s.closingHi}>आपकी प्रतीक्षा में</Text>
                <Text style={s.closingEn}>We look forward to your presence</Text>
              </View>
            </View>
            <View style={s.brand}>
              <Text style={s.brandName}>BHARATIYA NAMO SANGH</Text>
              <Text style={s.brandSub}>NATION FIRST | SERVICE ALWAYS</Text>
            </View>
          </View>
        </View>

        {/* Contact bar */}
        <View style={s.contactBar}>
          {contacts.map((c) => (
            <Text key={c.label} style={s.contactItem}>
              <Text style={s.contactLabel}>{c.label}: </Text>
              {c.value}
            </Text>
          ))}
        </View>
        <Tricolor style={s.tricolor} />
      </Page>
    </Document>
  );
}
