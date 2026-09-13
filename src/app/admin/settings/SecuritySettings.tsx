"use client";

import { useEffect, useState } from "react";

interface SecurityStatus {
  mpinSet: boolean;
  mpinSetAt: string | null;
  passwordChangedAt: string | null;
  lockedMinutes: number;
}

const MPIN_HELP = "6 digits. Avoid repeats like 111111 and runs like 123456.";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Strips everything but digits so a paste or a stray key cannot get in. */
function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

const STATUS_LOAD_ERROR = "Could not load your security settings.";

async function fetchStatus(): Promise<SecurityStatus> {
  const res = await fetch("/api/admin/mpin");
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || STATUS_LOAD_ERROR);
  }
  return data as SecurityStatus;
}

export default function SecuritySettings() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentMpin, setCurrentMpin] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [mpinSaving, setMpinSaving] = useState(false);
  const [mpinError, setMpinError] = useState<string | null>(null);
  const [mpinSuccess, setMpinSuccess] = useState<string | null>(null);

  const [passwordMpin, setPasswordMpin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    fetchStatus().then(
      (next) => {
        if (!active) return;
        setStatus(next);
        setLoadError(null);
      },
      (e) => {
        if (!active) return;
        setLoadError(e instanceof Error ? e.message : STATUS_LOAD_ERROR);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  /** Re-reads the status after a save, so the panel reflects what just landed. */
  async function refreshStatus() {
    try {
      setStatus(await fetchStatus());
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : STATUS_LOAD_ERROR);
    }
  }

  async function handleSaveMpin(e: React.FormEvent) {
    e.preventDefault();
    setMpinError(null);
    setMpinSuccess(null);

    if (newMpin.length !== 6) {
      setMpinError("MPIN must be exactly 6 digits.");
      return;
    }
    if (newMpin !== confirmMpin) {
      setMpinError("The two MPINs do not match.");
      return;
    }

    setMpinSaving(true);
    try {
      const res = await fetch("/api/admin/mpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentMpin: status?.mpinSet ? currentMpin : undefined,
          newMpin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMpinError(data.error || "Could not save your MPIN.");
        return;
      }
      setMpinSuccess(data.replaced ? "MPIN updated." : "MPIN set.");
      setCurrentMpin("");
      setNewMpin("");
      setConfirmMpin("");
      await refreshStatus();
    } catch {
      setMpinError("Could not save your MPIN.");
    } finally {
      setMpinSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The two passwords do not match.");
      return;
    }
    if (passwordMpin.length !== 6) {
      setPasswordError("Enter your 6-digit MPIN.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpin: passwordMpin, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Could not update your password.");
        return;
      }
      setPasswordSuccess(true);
      setPasswordMpin("");
      setNewPassword("");
      setConfirmPassword("");
      await refreshStatus();
    } catch {
      setPasswordError("Could not update your password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400";
  const mpinInputClass = `${inputClass} tracking-[0.4em] font-mono`;

  if (loadError) {
    return (
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <p className="text-sm text-navy/60">Loading security settings...</p>
      </div>
    );
  }

  const mpinSetOn = formatDate(status.mpinSetAt);
  const passwordChangedOn = formatDate(status.passwordChangedAt);

  return (
    <div className="space-y-6">
      {/* MPIN */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            {status.mpinSet ? "Change MPIN" : "Set your MPIN"}
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Your 6-digit MPIN verifies you when you change your password. Keep
            it to yourself — anyone with it and your signed-in session can set a
            new password.
          </p>
          {status.mpinSet && mpinSetOn && (
            <p className="mt-2 text-xs text-navy/40">Last set on {mpinSetOn}.</p>
          )}
        </div>

        {status.lockedMinutes > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Too many incorrect MPIN attempts. Locked for another{" "}
            {status.lockedMinutes} minute
            {status.lockedMinutes === 1 ? "" : "s"}.
          </div>
        )}

        <form onSubmit={handleSaveMpin} className="space-y-4">
          {status.mpinSet && (
            <div>
              <label
                className="block text-sm text-navy/70 mb-1"
                htmlFor="current-mpin"
              >
                Current MPIN
              </label>
              <input
                id="current-mpin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="••••••"
                value={currentMpin}
                onChange={(e) => setCurrentMpin(onlyDigits(e.target.value))}
                className={mpinInputClass}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm text-navy/70 mb-1"
                htmlFor="new-mpin"
              >
                New MPIN
              </label>
              <input
                id="new-mpin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="••••••"
                value={newMpin}
                onChange={(e) => setNewMpin(onlyDigits(e.target.value))}
                className={mpinInputClass}
              />
            </div>
            <div>
              <label
                className="block text-sm text-navy/70 mb-1"
                htmlFor="confirm-mpin"
              >
                Confirm new MPIN
              </label>
              <input
                id="confirm-mpin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="••••••"
                value={confirmMpin}
                onChange={(e) => setConfirmMpin(onlyDigits(e.target.value))}
                className={mpinInputClass}
              />
            </div>
          </div>
          <p className="text-xs text-navy/40">{MPIN_HELP}</p>

          {mpinError && <p className="text-sm text-red-600">{mpinError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={mpinSaving}
              className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
            >
              {mpinSaving
                ? "Saving..."
                : status.mpinSet
                  ? "Update MPIN"
                  : "Set MPIN"}
            </button>
            {mpinSuccess && (
              <span className="text-sm text-forest font-medium">
                {mpinSuccess}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Change password
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Your current password is not needed — your MPIN verifies the change
            instead.
          </p>
          {passwordChangedOn && (
            <p className="mt-2 text-xs text-navy/40">
              Last changed on {passwordChangedOn}.
            </p>
          )}
        </div>

        {!status.mpinSet ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            Set your 6-digit MPIN above first. It is what verifies a password
            change.
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm text-navy/70 mb-1"
                  htmlFor="new-password"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  className="block text-sm text-navy/70 mb-1"
                  htmlFor="confirm-password"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-xs text-navy/40">At least 8 characters.</p>

            <div className="sm:max-w-[15rem]">
              <label
                className="block text-sm text-navy/70 mb-1"
                htmlFor="password-mpin"
              >
                Your MPIN
              </label>
              <input
                id="password-mpin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="••••••"
                value={passwordMpin}
                onChange={(e) => setPasswordMpin(onlyDigits(e.target.value))}
                className={mpinInputClass}
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
              >
                {passwordSaving ? "Updating..." : "Update password"}
              </button>
              {passwordSuccess && (
                <span className="text-sm text-forest font-medium">
                  Password updated
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
