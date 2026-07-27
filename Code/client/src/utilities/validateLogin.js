// Auto-login rule: a login is "real" if the email is well-formed
// and the password is non-empty. No database check is performed yet.
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export const validateLogin = (email, password) => {
  if (!isValidEmail(email)) {
    return 'Enter a valid email address (e.g. name@example.com).'
  }
  if (!password || password.trim().length === 0) {
    return 'Enter your password.'
  }
  return null
}
