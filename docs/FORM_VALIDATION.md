# Form Validation System

A comprehensive form validation system for the MAAD Makes application that provides real-time validation feedback to users.

## Features

- ✅ Real-time field validation
- ✅ Display errors under each input
- ✅ Visual error states (red borders)
- ✅ Touch-based validation (only show errors after user interacts)
- ✅ Form-level validation on submit
- ✅ Customizable validation rules
- ✅ Built-in validation types (required, email, min/max length, patterns, etc.)
- ✅ Custom validation functions
- ✅ Accessible (ARIA attributes)

## Components

### 1. `useFormValidation` Hook

Custom React hook that manages form state, validation, and error handling.

**Location:** `hooks/useFormValidation.js`

### 2. `FormError` Component

Displays validation error messages with an icon.

**Location:** `components/Form/FormError.jsx`

### 3. Updated Form Components

All form components now support error states:

- `FormInput` - Text, email, password, number inputs
- `FormSelect` - Dropdown selects
- `FormTextarea` - Multi-line text areas

## Usage Example

```jsx
import useFormValidation from "@/hooks/useFormValidation";
import FormError from "@/components/Form/FormError";
import FormInput from "@/components/Form/FormInput";
import FormSelect from "@/components/Form/FormSelect";
import FormTextarea from "@/components/Form/FormTextarea";
import FormGroup from "@/components/Form/FormGroup";
import FormLabel from "@/components/Form/FormLabel";
import Button from "@/components/Button/Button";

const MyForm = () => {
  // Define validation rules
  const validationRules = () => ({
    username: {
      required: { message: "Username is required" },
      minLength: {
        value: 3,
        message: "Username must be at least 3 characters",
      },
      maxLength: {
        value: 20,
        message: "Username must not exceed 20 characters",
      },
    },
    email: {
      required: { message: "Email is required" },
      email: { message: "Please enter a valid email address" },
    },
    age: {
      required: { message: "Age is required" },
      min: { value: 18, message: "You must be at least 18 years old" },
      max: { value: 120, message: "Please enter a valid age" },
    },
    category: {
      required: { message: "Please select a category" },
    },
    description: {
      minLength: {
        value: 10,
        message: "Description must be at least 10 characters",
      },
      maxLength: {
        value: 500,
        message: "Description must not exceed 500 characters",
      },
    },
    website: {
      pattern: {
        value: "^https?://.*",
        message: "Website must start with http:// or https://",
      },
    },
    password: {
      required: { message: "Password is required" },
      custom: (value) => {
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value))
          return "Password must contain an uppercase letter";
        if (!/[0-9]/.test(value)) return "Password must contain a number";
        return "";
      },
    },
  });

  // Initialize the validation hook
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    hasError,
    isSubmitting,
    resetForm,
  } = useFormValidation(
    {
      username: "",
      email: "",
      age: "",
      category: "",
      description: "",
      website: "",
      password: "",
    },
    validationRules,
  );

  // Define submit handler
  const onSubmit = async (data) => {
    try {
      // Your API call here
      await api.submitForm(data);
      alert("Form submitted successfully!");
      resetForm();
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Text Input */}
      <FormGroup>
        <FormLabel htmlFor="username">Username:</FormLabel>
        <FormInput
          type="text"
          id="username"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError("username")}
          placeholder="Enter username"
        />
        <FormError error={errors.username} />
      </FormGroup>

      {/* Email Input */}
      <FormGroup>
        <FormLabel htmlFor="email">Email:</FormLabel>
        <FormInput
          type="email"
          id="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError("email")}
          placeholder="email@example.com"
        />
        <FormError error={errors.email} />
      </FormGroup>

      {/* Number Input */}
      <FormGroup>
        <FormLabel htmlFor="age">Age:</FormLabel>
        <FormInput
          type="number"
          id="age"
          name="age"
          value={values.age}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError("age")}
        />
        <FormError error={errors.age} />
      </FormGroup>

      {/* Select Input */}
      <FormGroup>
        <FormLabel htmlFor="category">Category:</FormLabel>
        <FormSelect
          id="category"
          name="category"
          value={values.category}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError("category")}
        >
          <option value="">Select a category</option>
          <option value="pokemon">Pokemon</option>
          <option value="3d-printed">3D Printed</option>
          <option value="filaments">Filaments</option>
        </FormSelect>
        <FormError error={errors.category} />
      </FormGroup>

      {/* Textarea */}
      <FormGroup>
        <FormLabel htmlFor="description">Description:</FormLabel>
        <FormTextarea
          id="description"
          name="description"
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          error={hasError("description")}
          rows={5}
        />
        <FormError error={errors.description} />
      </FormGroup>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};
```

## Validation Rule Types

### `required`

Ensures the field has a value.

```javascript
fieldName: {
  required: {
    message: "This field is required";
  }
}
```

### `minLength`

Validates minimum string length.

```javascript
fieldName: {
  minLength: { value: 5, message: "Must be at least 5 characters" }
}
```

### `maxLength`

Validates maximum string length.

```javascript
fieldName: {
  maxLength: { value: 100, message: "Must not exceed 100 characters" }
}
```

### `min`

Validates minimum numeric value.

```javascript
fieldName: {
  min: { value: 0, message: "Must be at least 0" }
}
```

### `max`

Validates maximum numeric value.

```javascript
fieldName: {
  max: { value: 999, message: "Must be no more than 999" }
}
```

### `email`

Validates email format.

```javascript
fieldName: {
  email: {
    message: "Please enter a valid email address";
  }
}
```

### `pattern`

Validates against a regular expression.

```javascript
fieldName: {
  pattern: {
    value: "^[A-Za-z]+$",
    message: "Only letters are allowed"
  }
}
```

### `custom`

Custom validation function.

```javascript
fieldName: {
  custom: (value, allValues) => {
    if (value !== allValues.password) {
      return "Passwords must match";
    }
    return ""; // Return empty string if valid
  };
}
```

## Hook API

### Returned Values

- `values` - Current form values object
- `errors` - Current validation errors object
- `touched` - Fields that have been interacted with
- `isSubmitting` - Boolean indicating if form is being submitted

### Returned Functions

- `handleChange(e)` - Handle input change events
- `handleBlur(e)` - Handle input blur events (validates field)
- `handleSubmit(onSubmit)` - Returns submit handler function
- `resetForm()` - Reset form to initial state
- `setFormValues(values)` - Set all form values programmatically
- `setFieldValue(name, value)` - Set a specific field value
- `setFieldError(name, error)` - Set a specific field error
- `validateForm()` - Validate entire form, returns boolean
- `hasError(name)` - Check if field has an error (touched + error exists)

## Best Practices

1. **Always use `onBlur`**: Add `onBlur={handleBlur}` to trigger validation when user leaves a field
2. **Check `hasError`**: Use `hasError("fieldName")` for the error prop to ensure field was touched
3. **Display errors immediately**: Always add `<FormError error={errors.fieldName} />` after inputs
4. **Disable during submission**: Use `disabled={isSubmitting}` on submit buttons
5. **Reset after success**: Call `resetForm()` after successful form submission

## Styling

Error states automatically apply:

- Red borders on invalid fields
- Red focus rings
- Error icon with message below field
- Smooth transitions

## Accessibility

- Uses `aria-invalid` attribute on inputs with errors
- Error messages have `role="alert"` for screen readers
- Proper label associations with `htmlFor` and `id`

## Example: Contact Form

See the implementation in [page.jsx](../app/contact/page.jsx) for a complete working example.
