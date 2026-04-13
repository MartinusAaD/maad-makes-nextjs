"use client";

import { useState } from "react";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import FormFieldset from "@/components/Form/FormFieldset";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import FormInput from "@/components/Form/FormInput";
import FormTextarea from "@/components/Form/FormTextarea";
import FormError from "@/components/Form/FormError";
import Button from "@/components/Button/Button";
import Alert from "@/components/Alert/Alert";
import { getFunctions, httpsCallable } from "firebase/functions";
import FormSelect from "@/components/Form/FormSelect";
import "flag-icons/css/flag-icons.min.css";
import { trackContactFormSubmit } from "@/utils/analytics";
import useFormValidation from "@/hooks/useFormValidation";

export default function ContactPage() {
  const [alert, setAlert] = useState(null);

  const validationRules = () => ({
    name: {
      required: { message: "Please enter your name" },
      minLength: { value: 1, message: "Name must be at least 1 characters" },
    },
    email: {
      required: { message: "Please enter your email address" },
      email: { message: "Please enter a valid email address" },
    },
    subject: {
      required: { message: "Please select a subject" },
    },
    message: {
      required: { message: "Please enter your message" },
      minLength: { value: 1, message: "Message must be at least 1 characters" },
      maxLength: {
        value: 1000,
        message: "Message must not exceed 1000 characters",
      },
    },
  });

  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    hasError,
    isSubmitting,
  } = useFormValidation(
    { name: "", email: "", subject: "", orderNumber: "", message: "" },
    validationRules,
  );

  const onSubmit = async (data) => {
    try {
      const functions = getFunctions(undefined, "europe-west1");
      const sendContactEmail = httpsCallable(functions, "sendContactEmail");
      await sendContactEmail(data);
      trackContactFormSubmit();
      setAlert({
        alertMessage: `Message sent successfully! We'll get back to you soon at "${data.email}". Have a good day!`,
        type: "success",
      });
      resetForm();
    } catch (error) {
      console.error("Error sending message:", error);
      setAlert({
        alertMessage:
          "Failed to send message. Please try again or email us directly.",
        type: "error",
      });
    }
  };

  return (
    <div className="w-full flex flex-col bg-bg-light min-h-screen">
      {/* Hero strip */}
      <div className="relative overflow-hidden bg-primary-darker pt-28 pb-10 -mt-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary-lighter/20 blur-[80px] pointer-events-none" />
        <ResponsiveWidthWrapper>
          {/* Contact info row */}
          <div
            className=" flex flex-wrap justify-center gap-6 opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-lighter mb-1">
                Direct email
              </p>
              <a
                href="mailto:maad.makes@gmail.com"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-full"
              >
                maad.makes@gmail.com
              </a>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-lighter mb-2">
                Languages
              </p>
              <div className="flex gap-3 items-center mt-1">
                <span className="fi fi-no text-3xl rounded shadow-sm" />
                <span className="fi fi-gb text-3xl rounded shadow-sm" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-lighter mb-1">
                Response time
              </p>
              <p className="text-white/60 text-sm mt-1">1–2 business days</p>
            </div>
          </div>
        </ResponsiveWidthWrapper>
      </div>

      <ResponsiveWidthWrapper>
        <div className="px-4 py-12 max-w-2xl mx-auto w-full">
          <div
            className="opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]"
            style={{ animationDelay: "0.1s" }}
          >
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormFieldset legend="Contact Us">
                <FormGroup>
                  <FormLabel htmlFor="name">Name:</FormLabel>
                  <FormInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Your name"
                    error={hasError("name")}
                  />
                  <FormError error={errors.name} />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="email">Email:</FormLabel>
                  <FormInput
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="your.email@example.com"
                    error={hasError("email")}
                  />
                  <FormError error={errors.email} />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="subject">Subject:</FormLabel>
                  <FormSelect
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={hasError("subject")}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General</option>
                    <option value="orderHelp">Help with an Order</option>
                    <option value="customOrderRequest">
                      Custom Order Request
                    </option>
                    <option value="waitlist">Waitlist</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </FormSelect>
                  <FormError error={errors.subject} />
                </FormGroup>

                {formData.subject === "order" && (
                  <FormGroup>
                    <FormLabel htmlFor="orderNumber">
                      Order Number (Optional):
                    </FormLabel>
                    <FormInput
                      type="text"
                      id="orderNumber"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleChange}
                      placeholder="e.g., 123"
                    />
                  </FormGroup>
                )}

                <FormGroup>
                  <FormLabel htmlFor="message">Message:</FormLabel>
                  <FormTextarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your message here..."
                    rows={6}
                    maxLength={1000}
                    error={hasError("message")}
                  />
                  <FormError error={errors.message} />
                  <p
                    className={`text-sm text-right mt-1 ${formData.message.length > 900 ? "text-red font-bold" : formData.message.length > 800 ? "text-yellow-darker" : "text-dark/60"}`}
                  >
                    {formData.message.length} / 1000 characters
                  </p>
                </FormGroup>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </FormFieldset>
            </form>
          </div>
        </div>
      </ResponsiveWidthWrapper>

      {alert && (
        <Alert
          alertMessage={alert.alertMessage}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}
