import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#f97316",
    paddingBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerText: {
    marginLeft: 15,
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  orgNameHindi: {
    fontSize: 14,
    marginBottom: 4,
  },
  regDetails: {
    fontSize: 8,
    color: "#666",
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#f97316",
  },
  receiptNumber: {
    textAlign: "right",
    fontSize: 10,
    color: "#666",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    width: 140,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  value: {
    flex: 1,
    color: "#333",
  },
  amountRow: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#fff7ed",
    borderRadius: 4,
  },
  amountLabel: {
    width: 140,
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#1e3a5f",
  },
  amountValue: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#f97316",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  footerText: {
    fontSize: 9,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  thankYou: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#1e3a5f",
    marginTop: 20,
  },
  signature: {
    marginTop: 40,
    alignItems: "flex-end",
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 9,
    color: "#666",
  },
});

interface ReceiptData {
  receiptNumber: string;
  donorName: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: string;
  logoBase64?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    cheque: "Cheque",
    razorpay: "Razorpay",
  };
  return map[method] || method;
}

export function DonationReceipt({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.logoBase64 && (
            <Image src={data.logoBase64} style={styles.logo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.orgNameHindi}>भारतीय नमो संघ</Text>
            <Text style={styles.orgName}>BHARTIYA NAMO SANGH (BNMS)</Text>
            <Text style={styles.regDetails}>
              NGO ID: DL/2018/0185185 | CSR Reg: CSR00062225
            </Text>
            <Text style={styles.regDetails}>
              National Level Society/NGO/Trust Regd. No. 1086
            </Text>
            <Text style={styles.regDetails}>
              Regal Building, 2AB, Sansad Marg, New Delhi - 110001
            </Text>
          </View>
        </View>

        <Text style={styles.title}>DONATION RECEIPT</Text>

        <Text style={styles.receiptNumber}>
          Receipt No: {data.receiptNumber}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Donor Name</Text>
          <Text style={styles.value}>{data.donorName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date of Donation</Text>
          <Text style={styles.value}>{formatDate(data.date)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{data.category}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>
            {formatPaymentMethod(data.paymentMethod)}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount Received</Text>
          <Text style={styles.amountValue}>
            ₹{data.amount.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.signature}>
          <Text style={styles.signatureLine}>Authorized Signatory</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated receipt and does not require a
            physical signature.
          </Text>
          <Text style={styles.footerText}>
            For any queries, please contact us at info@bhartiyanamosnagh.org
          </Text>
          <Text style={styles.thankYou}>
            Thank you for your generous contribution!
          </Text>
        </View>
      </Page>
    </Document>
  );
}
