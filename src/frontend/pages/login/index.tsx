import { useState } from "react";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";

type Step = "identify" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [otp, setOtp] = useState("");
  const [otpMethod, setOtpMethod] = useState<"email" | "sms" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOTP = async () => {
    setError(""); setMessage("");
    if (!identifier.trim()) return setError("Enter your email or phone number.");
    setLoading(true);

    try {
      const value = identifier.trim();
      const isEmail = value.includes("@");
      const res = await axiosInstance.post(
        "/auth/request-otp",
        isEmail ? { email: value } : { phoneNumber: value }
      );
      setOtpMethod(res.data.otpMethod || res.data.method); // "email" or "sms"
      setMessage(
        (res.data.otpMethod || res.data.method) === "email"
          ? `OTP sent to your email: ${identifier}`
          : `OTP sent via SMS to: ${identifier}`
      );
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError(""); setMessage("");
    if (!otp.trim() || otp.length !== 6) return setError("Enter the 6-digit OTP.");
    setLoading(true);

    try {
      const value = identifier.trim();
      const isEmail = value.includes("@");
      const res = await axiosInstance.post(
        "/auth/verify-otp",
        isEmail ? { email: value, otp: otp.trim() } : { phoneNumber: value, otp: otp.trim() }
      );
      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("sessionToken", res.data.sessionToken || "");
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg, #0f0f0f)"
    }}>
      <div style={{
        width: "100%", maxWidth: "380px", padding: "40px 32px",
        background: "var(--surface, #1a1a1a)", borderRadius: "16px",
        border: "1px solid var(--border, #333)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#ff0000" }}>▶ YouTube 2.0</div>
          <p style={{ color: "var(--text-muted, #aaa)", fontSize: "14px", marginTop: "6px" }}>
            {step === "identify" ? "Sign in with OTP" : `Enter the OTP we sent`}
          </p>
        </div>

        {step === "identify" && (
          <>
            <label style={{ fontSize: "13px", color: "var(--text, #f1f1f1)", display: "block", marginBottom: "6px" }}>
              Email or Phone Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="email@example.com or 9876543210"
              onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "10px",
                border: "1px solid var(--border, #333)", background: "var(--bg, #0f0f0f)",
                color: "var(--text, #f1f1f1)", fontSize: "14px", outline: "none",
                marginBottom: "16px"
              }}
            />
            <button
              onClick={handleSendOTP}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: "10px",
                background: "#ff0000", color: "#fff", border: "none",
                fontSize: "15px", fontWeight: 600, cursor: "pointer"
              }}
            >
              {loading ? "Sending..." : "Send OTP →"}
            </button>
            <p style={{ fontSize: "12px", color: "#888", marginTop: "14px", textAlign: "center" }}>
              South India users get email OTP. Others get SMS OTP.
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <div style={{
              fontSize: "13px", color: "#4caf50", background: "rgba(76,175,80,0.1)",
              padding: "10px 14px", borderRadius: "8px", marginBottom: "20px"
            }}>
              {otpMethod === "email" ? "📧" : "📱"} {message}
            </div>

            <label style={{ fontSize: "13px", color: "var(--text, #f1f1f1)", display: "block", marginBottom: "6px" }}>
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px",
                border: "1px solid var(--border, #333)", background: "var(--bg, #0f0f0f)",
                color: "var(--text, #f1f1f1)", fontSize: "22px", fontWeight: 700,
                letterSpacing: "8px", textAlign: "center", outline: "none",
                marginBottom: "16px"
              }}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: "10px",
                background: "#ff0000", color: "#fff", border: "none",
                fontSize: "15px", fontWeight: 600, cursor: "pointer", marginBottom: "12px"
              }}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button
              onClick={() => { setStep("identify"); setOtp(""); setError(""); setMessage(""); }}
              style={{
                width: "100%", padding: "10px", borderRadius: "10px",
                background: "transparent", color: "#888", border: "1px solid var(--border, #333)",
                fontSize: "13px", cursor: "pointer"
              }}
            >
              ← Change identifier
            </button>
            <p style={{ textAlign: "center", fontSize: "12px", color: "#666", marginTop: "12px" }}>
              Didn't receive?{" "}
              <span onClick={handleSendOTP} style={{ color: "#ff0000", cursor: "pointer" }}>Resend OTP</span>
            </p>
          </>
        )}

        {error && (
          <div style={{
            marginTop: "14px", padding: "10px 14px", background: "rgba(211,47,47,0.15)",
            border: "1px solid rgba(211,47,47,0.4)", borderRadius: "8px",
            fontSize: "13px", color: "#ef5350"
          }}>
            ✗ {error}
          </div>
        )}
      </div>
    </div>
  );
}
