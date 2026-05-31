const REQUEST_ERROR_MESSAGES = {
  name: "Введите имя",
  phone: "Введите белорусский номер телефона",
  email: "Введите корректный E-mail",
};

function normalizePhone(phone) {
  return phone.trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRequestFields(fields) {
  const values = {
    name: fields.name.trim(),
    phone: normalizePhone(fields.phone),
    email: fields.email.trim(),
  };
  const errors = {};

  if (values.name.length < 2) {
    errors.name = REQUEST_ERROR_MESSAGES.name;
  }

  if (!/^375(25|29|33|44)\d{7}$/.test(values.phone)) {
    errors.phone = REQUEST_ERROR_MESSAGES.phone;
  }

  if (!isEmailValid(values.email)) {
    errors.email = REQUEST_ERROR_MESSAGES.email;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      name: values.name,
      phone: values.phone ? `+${values.phone}` : "",
      email: values.email,
    },
  };
}

export { validateRequestFields };
