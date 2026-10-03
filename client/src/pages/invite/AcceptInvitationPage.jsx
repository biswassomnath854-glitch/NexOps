import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Building2,
  FolderGit2,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react'
import { clientInvitationsApi } from '@/api/endpoints/clientInvitations'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  // Verification states
  const [isVerifying, setIsVerifying] = useState(true)
  const [verifyError, setVerifyError] = useState(null)
  const [invitationData, setInvitationData] = useState(null)

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)

  useEffect(() => {
    let isMounted = true

    const verifyToken = async () => {
      if (!token) {
        if (isMounted) {
          setIsVerifying(false)
          setVerifyError({
            title: 'Missing Invitation Token',
            message: 'No invitation token was provided in the URL. Please verify your invitation link or contact your workspace administrator.',
          })
        }
        return
      }

      setIsVerifying(true)
      setVerifyError(null)

      try {
        const res = await clientInvitationsApi.verifyInvitation(token)
        if (isMounted) {
          const inv = res.data?.invitation || res.invitation || res.data
          setInvitationData(inv)
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'This invitation is invalid or has expired.'
          const code = err.response?.data?.code || 'INVALID_INVITATION'

          let title = 'Invalid Invitation'
          if (code === 'INVITATION_EXPIRED') title = 'Invitation Expired'
          else if (code === 'INVITATION_REVOKED') title = 'Invitation Revoked'
          else if (code === 'INVITATION_ALREADY_ACCEPTED') title = 'Invitation Already Accepted'

          setVerifyError({
            title,
            message: msg,
          })
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false)
        }
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, [token])

  const validate = () => {
    const errors = {}

    if (!firstName.trim()) {
      errors.firstName = 'First name is required.'
    } else if (firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters.'
    } else if (firstName.trim().length > 50) {
      errors.firstName = 'First name must not exceed 50 characters.'
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required.'
    } else if (lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters.'
    } else if (lastName.trim().length > 50) {
      errors.lastName = 'Last name must not exceed 50 characters.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.'
    } else if (password.length > 128) {
      errors.password = 'Password must not exceed 128 characters.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await clientInvitationsApi.acceptInvitation({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      })

      setIsAccepted(true)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to accept invitation. Please try again or contact your administrator.'
      setFormError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 1. Loading State
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Verifying Client Invitation...</h2>
          <p className="text-xs text-slate-500">
            Please wait while we validate your secure invitation link.
          </p>
        </div>
      </div>
    )
  }

  // 2. Error State (Invalid / Expired / Revoked)
  if (verifyError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-rose-200/80 shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {verifyError.title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-2 leading-relaxed">
                {verifyError.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-center">
              <Link to={ROUTES.LOGIN}>
                <Button variant="primary" className="w-full text-xs font-semibold">
                  Return to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 3. Accepted Success State
  if (isAccepted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-emerald-200/80 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Invitation Accepted!
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your client account has been successfully configured and activated. You can now log in to the Client Portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Role</span>
                  <Badge variant="success" className="text-[10px] font-semibold">
                    CLIENT
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Email</span>
                  <span className="font-semibold text-slate-800">{invitationData?.email}</span>
                </div>
                {invitationData?.organizationName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Organization</span>
                    <span className="font-semibold text-slate-800">{invitationData.organizationName}</span>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full text-xs font-semibold flex items-center justify-center gap-2 py-2.5"
              >
                Proceed to Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 4. Valid Invitation Onboarding Form
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600 text-white shadow-md mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SB Pvt. Ltd.</h1>
          <p className="text-xs text-slate-500">Client Portal Onboarding</p>
        </div>

        <Card className="border border-slate-200/90 shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-900">
              Complete Your Client Account Setup
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              You have been invited to collaborate as an external client stakeholder.
            </CardDescription>

            {/* Invitation Details Summary */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  Org: <strong className="text-slate-800">{invitationData?.organizationName || 'SB Pvt. Ltd.'}</strong>
                </span>
              </div>
              {invitationData?.projectName && (
                <div className="flex items-center gap-2 text-slate-600">
                  <FolderGit2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    Project: <strong className="text-slate-800">{invitationData.projectName}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{invitationData?.email}</span>
              </div>
              {invitationData?.expiresAt && (
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Expires {formatDate(invitationData.expiresAt)}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  {fieldErrors.firstName && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={invitationData?.email || ''}
                    disabled
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Email address is bound to this invitation and cannot be modified.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="w-full text-xs font-semibold py-2.5 mt-2"
              >
                Accept Invitation & Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-slate-400">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-indigo-600 hover:underline font-semibold">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
