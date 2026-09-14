"use client";

interface Props {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}

export default function MembershipDeclaration({ accepted, onChange }: Props) {
  return (
    <div className="rounded-lg border border-saffron-300 bg-saffron-50 p-4 mt-6">
      <h3 className="font-heading text-sm font-semibold text-navy mb-2">
        घोषणा / Declaration
      </h3>
      <p className="text-sm text-navy/80 leading-relaxed mb-3">
        मैं भारतीय नमो संघ की विचारधारा, उद्देश्यों एवं संविधान का पूर्ण सम्मान
        करते हुए संगठन के नियमों का पालन करने का संकल्प लेता/लेती हूँ। मुझे
        विश्वास है कि यदि मुझे संगठन में मेरी योग्यता एवं क्षमता के अनुरूप किसी
        पद पर सेवा करने का अवसर प्रदान किया जाता है, तो मैं पूर्ण निष्ठा,
        ईमानदारी एवं समर्पण के साथ अपने दायित्वों का निर्वहन करूँगा/करूँगी तथा
        संगठन के विस्तार एवं समाजहित के कार्यों में सक्रिय योगदान दूँगा/दूँगी।
      </p>
      <p className="text-xs text-navy/60 italic mb-4">
        I pledge to uphold the organization&apos;s principles and serve with full dedication and integrity.
      </p>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 rounded border-saffron-400 text-saffron-700 focus:ring-saffron-400"
        />
        <span className="text-sm text-navy/80">
          मैं उपरोक्त घोषणा से सहमत हूँ / I agree to the above declaration
        </span>
      </label>
    </div>
  );
}
