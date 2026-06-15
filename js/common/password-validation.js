const PASSWORD_PATTERN =
  /^(?=.*[a-zа-я])(?=.*[A-ZА-Я])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]).{8,20}$/;

const POPULAR_PASSWORDS = new Set(
  [
    "123456",
    "12345678",
    "123456789",
    "1234567890",
    "111111",
    "000000",
    "qwerty",
    "qwerty123",
    "qwerty123!",
    "qwertyuiop",
    "password",
    "password1",
    "password1!",
    "password123",
    "password123!",
    "passw0rd",
    "admin",
    "admin123",
    "admin123!",
    "administrator",
    "user123",
    "user123!",
    "welcome",
    "welcome1",
    "welcome123",
    "welcome123!",
    "letmein",
    "letmein1!",
    "iloveyou",
    "iloveyou1!",
    "monkey",
    "dragon",
    "football",
    "master",
    "sunshine",
    "princess",
    "login",
    "abc123",
    "abc123!",
    "1q2w3e4r",
    "1q2w3e4r!",
    "qazwsx",
    "qazwsx123",
    "qazwsx123!",
    "zaq12wsx",
    "zaq12wsx!",
    "asdfgh",
    "asdfgh123",
    "asdfgh123!",
    "changeme",
    "changeme1!",
  ].map((password) => password.toLowerCase()),
);

function isPasswordValid(password) {
  const value = String(password || "");

  return (
    PASSWORD_PATTERN.test(value) &&
    !POPULAR_PASSWORDS.has(value.toLowerCase())
  );
}

export { isPasswordValid };
