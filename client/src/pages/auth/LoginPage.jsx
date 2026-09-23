import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/forms/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

// Standard RFC 5322 compliant email regex matching backend Joi validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Preserve intended destination or default to dashboard
  const destination = location.state?.from?.pathname || ROUTES.DASHBOARD

  const validateForm = () => {
    const errors = {}

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errors.email = 'Work email is required.'
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please provide a valid corporate email address.'
    } else if (trimmedEmail.length > 255) {
      errors.email = 'Email address must not exceed 255 characters.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.'
    } else if (password.length > 128) {
      errors.password = 'Password must not exceed 128 characters.'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const clientValidationErrors = validateForm()
    if (Object.keys(clientValidationErrors).length > 0) {
      setFieldErrors(clientValidationErrors)
      return
    }

    setFieldErrors({})
    setIsLoading(true)

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      })

      // Navigate to intended destination
      navigate(destination, { replace: true })
    } catch (err) {
      if (err.code === 'ACCOUNT_NOT_ACTIVE') {
        setFormError('Your account has been deactivated or suspended. Please contact your organization administrator.')
      } else if (err.code === 'INVALID_CREDENTIALS') {
        setFormError('Invalid email or password. Please verify your credentials.')
      } else {
        setFormError(err.message || 'Authentication failed. Please try again.')
      }

      // Populate backend field validation errors if provided
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
    if (formError) setFormError('')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
    if (formError) setFormError('')
  }

  return (
    <Card className="shadow-lg border-slate-200/90 bg-white">
      <CardHeader className="text-left pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
          Sign In to NexOps
        </CardTitle>
        <CardDescription>
          Enter your authorized enterprise credentials to access your workspace.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Form Error Banner */}
        {formError && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-800 text-xs animate-in fade-in"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{formError}</div>
          </div>
        )}

        {/* Redirect notice if redirected from a protected route */}
        {location.state?.from && !formError && (
          <div className="mb-5 p-3 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-start gap-2.5 text-indigo-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
            <p>Please authenticate to access your intended workspace page.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={handleEmailChange}
            error={fieldErrors.email}
            leftIcon={Mail}
            disabled={isLoading}
            required
            autoComplete="email"
            autoFocus
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={handlePasswordChange}
              error={fieldErrors.password}
              leftIcon={Lock}
              disabled={isLoading}
              required
              autoComplete="current-password"
              rightIcon={showPassword ? EyeOff : Eye}
            />
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 focus:outline-hidden"
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            className="mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have a workspace account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Register organization
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
