


export function isValidEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


export const validateEmail = (email) => {
  return isValidEmail(email);
};


export const validatePassword = (password) => {
  const result = {
    valid: false,
    message: ''
  };
  
  if (!password) {
    result.message = '请输入密码';
    return result;
  }
  
  if (password.length < 8) {
    result.message = '密码长度至少为8个字符';
    return result;
  }
  
  result.valid = true;
  return result;
};


export const getPasswordStrengthMeta = (password) => {
  const value = password || '';

  if (!value) {
    return {
      score: 0,
      minLengthMet: false,
      alphaNumericMet: false,
      specialCharMet: false,
      level: 'weak',
      percent: 0
    };
  }

  let score = 0;
  const minLengthMet = value.length >= 8;
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const alphaNumericMet = /[A-Za-z]/.test(value) && hasDigit;
  const specialCharMet = /[!@#$%^&*(),.?":{}|<>]/.test(value);

  if (minLengthMet) score += 1;
  if (hasLowercase) score += 1;
  if (hasUppercase) score += 1;
  if (hasDigit) score += 1;
  if (specialCharMet) score += 1;

  let level = 'strong';
  if (score <= 1) level = 'weak';
  else if (score <= 3) level = 'medium';

  return {
    score,
    minLengthMet,
    alphaNumericMet,
    specialCharMet,
    level,
    percent: Math.min(100, Math.max(20, score * 20))
  };
};


export const validateRequiredWithMessage = (value, fieldName) => {
  const result = {
    valid: false,
    message: ''
  };
  
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    result.message = `${fieldName}不能为空`;
    return result;
  }
  
  result.valid = true;
  return result;
};


export const validateRequired = (value) => {
  return !!value && (typeof value !== 'string' || value.trim() !== '');
};
