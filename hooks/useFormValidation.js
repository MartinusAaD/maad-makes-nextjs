import { useState, useCallback } from "react";

const useFormValidation = (
  initialValues = {},
  validationRules = () => ({}),
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateField = useCallback(
    (name, value) => {
      const rules = validationRules();
      const fieldRules = rules[name];

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
        if (value.length < fieldRules.minLength.value) {
          return (
            fieldRules.minLength.message ||
            `Must be at least ${fieldRules.minLength.value} characters`
          );
        }
      }

      if (fieldRules.maxLength && value) {
        if (value.length > fieldRules.maxLength.value) {
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
        if (!emailRegex.test(value)) {
          return (
            fieldRules.email.message || "Please enter a valid email address"
          );
        }
      }

      if (fieldRules.pattern && value) {
        const regex = new RegExp(fieldRules.pattern.value);
        if (!regex.test(value)) {
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
    const newErrors = {};

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
    (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === "checkbox" ? checked : value;

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
    (e) => {
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
    (onSubmit) => async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setHasSubmitted(true);

      const rules = validationRules();
      const allTouched = {};
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

  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
  }, []);

  const setFieldValue = useCallback(
    (name, value) => {
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

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const hasError = useCallback(
    (name) => {
      return (hasSubmitted || isSubmitting) && touched[name] && errors[name];
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
