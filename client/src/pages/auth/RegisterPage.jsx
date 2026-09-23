import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Building2, AlertCircle } from 'lucide-react'
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
    <Card className="shadow-lg border-slate-200/90">
      <CardHeader className="text-left pb-4">
        <CardTitle className="text-xl font-bold">Create NexOps Account</CardTitle>
        <CardDescription>
          Set up your organization workspace and team administrator account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {formError && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs"
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
            label="Organization / Company"
            name="organizationName"
            placeholder="Acme Technologies"
            value={formData.organizationName}
            onChange={handleChange}
            error={fieldErrors.organizationName}
            leftIcon={Building2}
            required
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
            Create Workspace
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
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
