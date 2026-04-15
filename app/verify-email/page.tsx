"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import Button from "@/components/Button/Button";
import Alert from "@/components/Alert/Alert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

interface AlertState {
  type: "success" | "error";
  alertMessage: string;
}

export default function VerifyEmailPage() {
  const { currentUser, sendEmailVerification: resendVerification } = useAuth();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (currentUser?.emailVerified) {
      setIsVerified(true);
      setTimeout(() => router.push("/profile"), 2000);
    }
  }, [currentUser, router]);

  const handleCheckVerification = async () => {
    setChecking(true);
    setAlert(null);
    try {
      await currentUser!.reload();
      if (currentUser!.emailVerified) {
        setIsVerified(true);
        setAlert({
          type: "success",
          alertMessage: "Email verified! Redirecting to your profile...",
        });
        setTimeout(() => router.push("/profile"), 2000);
      } else {
        setAlert({
          type: "error",
          alertMessage:
            "Email not verified yet. Please check your inbox and click the verification link.",
        });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setAlert({
        type: "error",
        alertMessage: "Failed to check verification status. Please try again.",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setAlert(null);
    try {
      await resendVerification();
      setAlert({
        type: "success",
        alertMessage: "Verification email sent! Please check your inbox.",
      });
    } catch (error) {
      console.error("Error resending email:", error);
      setAlert({
        type: "error",
        alertMessage: "Failed to resend email. Please try again later.",
      });
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="py-8 bg-bg-light min-h-screen flex items-center justify-center">
        <ResponsiveWidthWrapper>
          <div className="bg-white p-8 md:p-12 rounded shadow-md text-center max-w-2xl mx-auto">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-6xl text-green-600 mb-4"
            />
            <h1 className="text-3xl md:text-4xl text-primary font-bold mb-4">
              Email Verified!
            </h1>
            <p className="text-lg text-gray-600">
              Redirecting to your profile...
            </p>
          </div>
        </ResponsiveWidthWrapper>
      </div>
    );
  }

  return (
    <div className="py-8 bg-bg-light min-h-screen flex items-center justify-center">
      <ResponsiveWidthWrapper>
        <div className="bg-white p-8 md:p-12 rounded shadow-md max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="text-6xl text-primary mb-4"
            />
            <h1 className="text-3xl md:text-4xl text-primary font-bold mb-4">
              Verify Your Email
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              We&apos;ve sent a verification email to:
            </p>
            <p className="text-xl font-semibold text-gray-900 mb-6">
              {currentUser?.email}
            </p>
            <p className="text-gray-600">
              Please check your inbox and click the verification link to
              activate your account. If it&apos;s not in your inbox, check the
              spam folder!
            </p>
          </div>
          {alert && (
            <div className="mb-6">
              <Alert
                alertMessage={alert.alertMessage}
                type={alert.type}
                onClose={() => setAlert(null)}
              />
            </div>
          )}
          <div className="space-y-4">
            <Button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full"
            >
              {checking ? "Checking..." : "I've Verified My Email"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn&apos;t receive the email?
              </p>
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="text-primary hover:text-primary-dark font-semibold underline disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </div>
  );
}
