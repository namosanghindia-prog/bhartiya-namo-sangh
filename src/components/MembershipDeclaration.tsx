"use client";

interface Props {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}

export default function MembershipDeclaration({ accepted, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-[#f6f4f0] p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-navy">
        Member Declaration · घोषणा
      </h3>
      <div className="mt-3 max-h-40 overflow-y-auto pr-2 text-sm leading-relaxed text-navy/80">
      <p className="mb-3">
        मैं भारतीय नमो संघ की विचारधारा, उद्देश्यों एवं संविधान का पूर्ण सम्मान
        करते हुए संगठन के नियमों का पालन करने का संकल्प लेता/लेती हूँ। मुझे
        विश्वास है कि यदि मुझे संगठन में मेरी योग्यता एवं क्षमता के अनुरूप किसी
        पद पर सेवा करने का अवसर प्रदान किया जाता है, तो मैं पूर्ण निष्ठा,
        ईमानदारी एवं समर्पण के साथ अपने दायित्वों का निर्वहन करूँगा/करूँगी तथा
        संगठन के विस्तार एवं समाजहित के कार्यों में सक्रिय योगदान दूँगा/दूँगी।
      </p>
      <p className="text-xs italic text-navy/60">
        I pledge to uphold the organization&apos;s principles and serve with full dedication and integrity.
      </p>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-2">
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
