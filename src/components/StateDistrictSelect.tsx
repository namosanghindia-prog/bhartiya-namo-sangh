"use client";

import { useState, type ReactNode } from "react";
import { INDIA_STATES, findDistrict, findState } from "@/lib/india-locations";

/** District select value for "my district is not in the list". */
const OTHER_DISTRICT = "__other__";

export interface StateDistrict {
  state: string;
  district: string;
}

interface Props {
  value: StateDistrict;
  onChange: (next: StateDistrict) => void;
  stateLabel: ReactNode;
  districtLabel: ReactNode;
  labelClassName: string;
  fieldClassName: string;
  stateId?: string;
  districtId?: string;
  /** Field names, for forms read through FormData. */
  stateName?: string;
  districtName?: string;
  required?: boolean;
}

/**
 * State picker whose district list follows the chosen state. Renders two
 * sibling label+control blocks so the parent's grid decides the layout.
 *
 * A district missing from the list can be typed in via "Other", and a value
 * saved before this picker existed (free text like "UP") stays visible and
 * submittable instead of being silently dropped.
 */
export default function StateDistrictSelect({
  value,
  onChange,
  stateLabel,
  districtLabel,
  labelClassName,
  fieldClassName,
  stateId,
  districtId,
  stateName,
  districtName,
  required,
}: Props) {
  const state = findState(value.state);
  const listedDistrict = state ? findDistrict(state, value.district) : undefined;
  const unlistedState = value.state.trim() !== "" && !state;

  const [typingDistrict, setTypingDistrict] = useState(
    () => value.district.trim() !== "" && !listedDistrict
  );
  const showDistrictInput = typingDistrict || unlistedState;

  function pickState(next: string) {
    setTypingDistrict(false);
    onChange({ state: next, district: "" });
  }

  function pickDistrict(next: string) {
    if (next === OTHER_DISTRICT) {
      setTypingDistrict(true);
      onChange({ ...value, district: "" });
    } else {
      onChange({ ...value, district: next });
    }
  }

  const renderStateOption = (s: (typeof INDIA_STATES)[number]) => (
    <option key={s.name} value={s.name}>
      {s.name} — {s.nameHi}
    </option>
  );

  return (
    <>
      <div>
        <label htmlFor={stateId} className={labelClassName}>
          {stateLabel}
        </label>
        <select
          id={stateId}
          name={stateName}
          required={required}
          value={state?.name ?? value.state}
          onChange={(e) => pickState(e.target.value)}
          className={fieldClassName}
        >
          <option value="">राज्य चुनें / Select state</option>
          {unlistedState && <option value={value.state}>{value.state}</option>}
          <optgroup label="राज्य / States">
            {INDIA_STATES.filter((s) => s.kind === "state").map(renderStateOption)}
          </optgroup>
          <optgroup label="केंद्र शासित प्रदेश / Union Territories">
            {INDIA_STATES.filter((s) => s.kind === "ut").map(renderStateOption)}
          </optgroup>
        </select>
      </div>

      <div>
        <label htmlFor={districtId} className={labelClassName}>
          {districtLabel}
        </label>
        {showDistrictInput ? (
          <input
            id={districtId}
            required={required}
            maxLength={100}
            value={value.district}
            placeholder="जिले का नाम लिखें / Type your district"
            onChange={(e) => onChange({ ...value, district: e.target.value })}
            className={fieldClassName}
          />
        ) : (
          <select
            id={districtId}
            required={required}
            disabled={!state}
            value={listedDistrict ?? ""}
            onChange={(e) => pickDistrict(e.target.value)}
            className={`${fieldClassName} disabled:bg-gray-100`}
          >
            <option value="">
              {state ? "जिला चुनें / Select district" : "पहले राज्य चुनें / Select state first"}
            </option>
            {state?.districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            {state && <option value={OTHER_DISTRICT}>अन्य (लिखें) / Other (type it)</option>}
          </select>
        )}
        {showDistrictInput && state && (
          <button
            type="button"
            onClick={() => {
              setTypingDistrict(false);
              onChange({ ...value, district: "" });
            }}
            className="mt-1 text-xs font-medium text-saffron-700 hover:text-saffron-800"
          >
            ← सूची से चुनें / Pick from the list
          </button>
        )}
        {districtName && (
          <input type="hidden" name={districtName} value={listedDistrict ?? value.district} />
        )}
      </div>
    </>
  );
}
