"use client";

import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership-tiers";

interface Props {
  value: MembershipTier;
  onChange: (tier: MembershipTier) => void;
}

export default function MembershipTierPicker({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy/80 mb-2">
        <span className="block">सदस्यता प्रकार चुनें</span>
        <span className="text-xs text-navy/60">Select Membership Type</span>
      </label>
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(MEMBERSHIP_TIERS) as MembershipTier[]).map((tier) => {
          const info = MEMBERSHIP_TIERS[tier];
          const isSelected = value === tier;
          const isLifetime = tier === "lifetime";
          const isPremium = tier === "premium";
          return (
            <label
              key={tier}
              className={`relative flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                isSelected
                  ? isLifetime
                    ? "border-gold bg-gold/5"
                    : isPremium
                    ? "border-saffron-500 bg-saffron-50"
                    : "border-saffron-400 bg-saffron-50"
                  : "border-saffron-200 hover:border-saffron-300"
              }`}
            >
              <input
                type="radio"
                name="membershipType"
                value={tier}
                checked={isSelected}
                onChange={() => onChange(tier)}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                isSelected
                  ? isLifetime
                    ? "border-gold"
                    : "border-saffron-600"
                  : "border-saffron-300"
              }`}>
                {isSelected && (
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isLifetime ? "bg-gold" : "bg-saffron-600"
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    isLifetime ? "text-gold" : isPremium ? "text-saffron-700" : "text-navy"
                  }`}>
                    {info.nameHi} / {info.name}
                  </span>
                  {isLifetime && (
                    <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-medium">
                      BEST VALUE
                    </span>
                  )}
                </div>
                <div className="text-sm text-navy/70">
                  <span className="font-semibold text-navy">₹{info.price.toLocaleString("en-IN")}</span>
                  <span className="text-xs"> {info.period}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
