export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 (0: very weak, 4: very strong)
  errors: string[];
  suggestions: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const result: PasswordValidationResult = {
    isValid: true,
    score: 0,
    errors: [],
    suggestions: [],
  };

  // Check minimum length
  if (password.length < 8) {
    result.errors.push('Password must be at least 8 characters long');
    result.isValid = false;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    result.errors.push('Password must contain at least one uppercase letter');
    result.isValid = false;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    result.errors.push('Password must contain at least one lowercase letter');
    result.isValid = false;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    result.errors.push('Password must contain at least one number');
    result.isValid = false;
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password must contain at least one special character');
    result.isValid = false;
  }

  // Calculate password strength score
  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z].*[A-Z]/.test(password)) score++;
  if (/\d.*\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (password.length >= 16) score++;

  result.score = Math.min(score, 4);

  // Add suggestions for improvement
  if (score < 4) {
    if (password.length < 12) {
      result.suggestions.push('Consider using a longer password (12+ characters)');
    }
    if (!/[A-Z].*[A-Z]/.test(password)) {
      result.suggestions.push('Consider adding more uppercase letters');
    }
    if (!/\d.*\d/.test(password)) {
      result.suggestions.push('Consider adding more numbers');
    }
    if (!/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.suggestions.push('Consider adding more special characters');
    }
  }

  return result;
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return 'text-red-500';
    case 1:
      return 'text-orange-500';
    case 2:
      return 'text-yellow-500';
    case 3:
      return 'text-blue-500';
    case 4:
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

export function getPasswordStrengthText(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Strong';
    case 4:
      return 'Very Strong';
    default:
      return 'Unknown';
  }
} 