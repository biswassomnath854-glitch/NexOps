import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import { Input } from '@/components/forms/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    // Client-side quick validation
    const errors = {}
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required.'
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required.'
    }
    if (!formData.email?.trim()) {
      errors.email = 'Work email is required.'
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)
    try {
      await register(formData)
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please review the inputs.')
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-slate-200/90 max-w-lg mx-auto">
      <CardHeader className="text-left pb-3">
        <CardTitle className="text-xl font-bold">Create SB Pvt. Ltd. Account</CardTitle>
        <CardDescription>
          Register your user account to collaborate on tasks, sprints, and project hubs.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {formError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              name="firstName"
              placeholder="Jane"
              value={formData.firstName}
              onChange={handleChange}
              error={fieldErrors.firstName}
              leftIcon={User}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              error={fieldErrors.lastName}
              leftIcon={User}
              required
            />
          </div>

          <Input
            label="Work Email"
            name="email"
            type="email"
            placeholder="jane@company.com"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            leftIcon={Mail}
            required
            autoComplete="email"
          />

          <Input
            label="Organization / Company (Optional)"
            name="organizationName"
            placeholder="e.g. SB Pvt. Ltd."
            value={formData.organizationName}
            onChange={handleChange}
            error={fieldErrors.organizationName}
            leftIcon={Building2}
            helperText="Enter your company name if applicable"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            leftIcon={Lock}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            className="mt-3"
          >
            Create Account
          </Button>
        </form>

        {/* Security & Role Policy Notice */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>Role & Security Policy:</strong> New registrations create standard user accounts. Administrative and managerial privileges are granted and managed exclusively by current Workspace Admins within the internal management portal.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
