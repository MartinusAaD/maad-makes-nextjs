import { useState, useCallback } from "react";

type FieldRule<T> = {
  required?: { message?: string };
  minLength?: { value: number; message?: string };
  maxLength?: { value: number; message?: string };
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
  email?: { message?: string };
  pattern?: { value: string; message?: string };
  custom?: (value: unknown, values: T) => string | undefined;
};

type ValidationRules<T> = () => Partial<Record<keyof T, FieldRule<T>>>;

const useFormValidation = <T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: ValidationRules<T> = () => ({}),
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateField = useCallback(
    (name: string, value: unknown): string => {
      const rules = validationRules();
      const fieldRules = rules[name as keyof T];

      if (!fieldRules) return "";

      if (fieldRules.required) {
        if (value === "" || value === null || value === undefined) {
          return fieldRules.required.message || "This field is required";
        }
        if (Array.isArray(value) && value.length === 0) {
          return fieldRules.required.message || "This field is required";
        }
      }

      if (fieldRules.minLength && value) {
        if ((value as string).length < fieldRules.minLength.value) {
          return (
            fieldRules.minLength.message ||
            `Must be at least ${fieldRules.minLength.value} characters`
          );
        }
      }

      if (fieldRules.maxLength && value) {
        if ((value as string).length > fieldRules.maxLength.value) {
          return (
            fieldRules.maxLength.message ||
            `Must be no more than ${fieldRules.maxLength.value} characters`
          );
        }
      }

      if (fieldRules.min !== undefined && value !== "") {
        const numValue = Number(value);
        if (numValue < fieldRules.min.value) {
          return (
            fieldRules.min.message || `Must be at least ${fieldRules.min.value}`
          );
        }
      }

      if (fieldRules.max !== undefined && value !== "") {
        const numValue = Number(value);
        if (numValue > fieldRules.max.value) {
          return (
            fieldRules.max.message ||
            `Must be no more than ${fieldRules.max.value}`
          );
        }
      }

      if (fieldRules.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value as string)) {
          return (
            fieldRules.email.message || "Please enter a valid email address"
          );
        }
      }

      if (fieldRules.pattern && value) {
        const regex = new RegExp(fieldRules.pattern.value);
        if (!regex.test(value as string)) {
          return fieldRules.pattern.message || "Please enter a valid format";
        }
      }

      if (fieldRules.custom && value) {
        const customError = fieldRules.custom(value, values);
        if (customError) return customError;
      }

      return "";
    },
    [validationRules, values],
  );

  const validateForm = useCallback(() => {
    const rules = validationRules();
    const newErrors: Record<string, string> = {};

    Object.keys(rules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validateField, validationRules]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      if (touched[name] && hasSubmitted) {
        const error = validateField(name, newValue);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [touched, validateField, hasSubmitted],
  );

  const handleBlur = useCallback(
    (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name } = e.target;

      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      if (hasSubmitted) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [values, validateField, hasSubmitted],
  );

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void>) =>
      async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setHasSubmitted(true);

        const rules = validationRules();
        const allTouched: Record<string, boolean> = {};
        Object.keys(rules).forEach((key) => {
          allTouched[key] = true;
        });
        setTouched(allTouched);

        const isValid = validateForm();

        if (isValid) {
          try {
            await onSubmit(values);
          } catch (error) {
            console.error("Form submission error:", error);
          }
        }

        setIsSubmitting(false);
      },
    [values, validateForm, validationRules],
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setHasSubmitted(false);
  }, [initialValues]);

  const setFormValues = useCallback((newValues: T) => {
    setValues(newValues);
  }, []);

  const setFieldValue = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (touched[name] && hasSubmitted) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [touched, validateField, hasSubmitted],
  );

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const hasError = useCallback(
    (name: string): boolean => {
      return (
        !!(hasSubmitted || isSubmitting) && !!touched[name] && !!errors[name]
      );
    },
    [touched, errors, hasSubmitted, isSubmitting],
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormValues,
    setFieldValue,
    setFieldError,
    validateForm,
    hasError,
  };
};

export default useFormValidation;
