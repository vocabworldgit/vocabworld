'use client'

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, Crown, CreditCard, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/subscription-plans'
import { EmbeddedCheckoutForm } from './embedded-checkout-form'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaywallModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onSubscriptionSuccess?: () => void
}

export function PaywallModal({ isOpen, onCloseAction, onSubscriptionSuccess }: PaywallModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<'yearly' | 'monthly' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly')
  const [showCheckout, setShowCheckout] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  // Store current state before payment
  const storeCurrentState = () => {
    try {
      const currentState = {
        nativeLanguage: localStorage.getItem('nativeLanguage'),
        nativeLanguageCode: localStorage.getItem('nativeLanguageCode'),
        targetLanguage: localStorage.getItem('targetLanguage'),
        targetLanguageCode: localStorage.getItem('targetLanguageCode'),
        currentPage: localStorage.getItem('currentPage') || '0',
        timestamp: Date.now()
      }
      
      console.log('Storing pre-payment state:', currentState)
      localStorage.setItem('prePaymentState', JSON.stringify(currentState))
    } catch (error) {
      console.error('Failed to store current state:', error)
    }
  }

  const handleUpgrade = async (planId: 'yearly' | 'monthly') => {
    if (!user?.id) {
      setError('Please sign in first to subscribe')
      return
    }

    try {
      setError(null)
      setLoading(planId)

      // Store current state before payment
      storeCurrentState()

      console.log('Creating subscription...')

      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create subscription')

      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.subscriptionId)
      setShowCheckout(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start subscription')
      setLoading(null)
    }
  }

  const handlePaymentSuccess = async () => {
    console.log('💰 Payment succeeded, refreshing user status...')
    setLoading(null)
    
    // Wait a moment for webhook to process, then refresh
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Refresh the user's subscription status
    if (onSubscriptionSuccess) {
      await onSubscriptionSuccess()
    }
    
    // Force reload to ensure fresh state
    window.location.reload()
  }

  const handlePaymentError = (error: string) => {
    setError(error)
    setLoading(null)
  }

  const handleBackToPlans = () => {
    setShowCheckout(false)
    setClientSecret(null)
    setPaymentIntentId(null)
    setLoading(null)
    setError(null)
  }

  if (!isOpen) return null

  const yearlyPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === 'yearly')!

  const stripeOptions: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#10b981',
        colorBackground: 'rgba(255, 255, 255, 0.1)',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
        '.Label': {
          color: '#ffffff',
          fontSize: '14px',
        },
        '.Tab': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
        },
        '.Tab--selected': {
          backgroundColor: '#10b981',
          color: '#ffffff',
        },
      },
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 mx-4 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onCloseAction} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        {showCheckout && clientSecret ? (
          <Elements stripe={stripePromise} options={stripeOptions}>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Complete Your Payment</h2>
              <p className="text-white/90 text-sm drop-shadow">
                {selectedPlan === 'yearly' ? 'VocabWorld Unlimited - Yearly ($29.00)' : 'VocabWorld Unlimited - Monthly ($4.99)'}
              </p>
              {selectedPlan === 'yearly' && (
                <div className="inline-block bg-green-500/20 border border-green-400/50 rounded-full px-3 py-1 mt-2">
                  <span className="text-green-300 text-xs font-semibold">7-day free trial included</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 backdrop-blur-sm mb-4">
                <p className="text-red-100 text-sm drop-shadow">{error}</p>
              </div>
            )}

            <EmbeddedCheckoutForm 
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              loading={loading !== null}
              planId={selectedPlan}
              paymentIntentId={paymentIntentId}
            />

            <button 
              onClick={handleBackToPlans} 
              disabled={loading !== null}
              className="w-full mt-4 text-center text-white/80 hover:text-white text-sm transition-colors py-2 drop-shadow"
            >
              ← Back to plan selection
            </button>
          </Elements>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Get more vocabulary with VocabWorld Unlimited.</h2>
              <p className="text-white/90 text-sm drop-shadow">Choose your plan and start learning today</p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-red-100 text-sm drop-shadow">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                {yearlyPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-white/90 drop-shadow">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className={`border-2 rounded-xl p-4 relative cursor-pointer transition-all backdrop-blur-sm ${selectedPlan === 'yearly' ? 'border-green-400 bg-green-500/20' : 'border-white/30 bg-white/10 hover:border-white/50'}`} onClick={() => setSelectedPlan('yearly')}>
                  <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">-52% off!</div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'yearly' ? 'border-green-400 bg-green-500' : 'border-white/50'}`}>
                        {selectedPlan === 'yearly' && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white drop-shadow">Yearly • $29.00</div>
                        <div className="text-sm text-white/80 drop-shadow">7-day free trial</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white drop-shadow">$2.42</div>
                      <div className="text-sm text-white/80 drop-shadow">Per month</div>
                    </div>
                  </div>
                </div>

                <div className={`border-2 rounded-xl p-4 cursor-pointer transition-all backdrop-blur-sm ${selectedPlan === 'monthly' ? 'border-green-400 bg-green-500/20' : 'border-white/30 bg-white/10 hover:border-white/50'}`} onClick={() => setSelectedPlan('monthly')}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-green-400 bg-green-500' : 'border-white/50'}`}>
                        {selectedPlan === 'monthly' && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white drop-shadow">Monthly • $4.99</div>
                        <div className="text-sm text-white/80 drop-shadow">No free trial</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white drop-shadow">$4.99</div>
                      <div className="text-sm text-white/80 drop-shadow">Per month</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={() => handleUpgrade(selectedPlan)} disabled={loading !== null} className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 text-base h-12 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" size="lg">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {selectedPlan === 'yearly' ? 'Continue with Yearly - $29/year' : 'Continue with Monthly - $4.99/month'}
                    </>
                  )}
                </Button>
                <button onClick={onCloseAction} disabled={loading !== null} className="w-full text-center text-white/80 hover:text-white text-sm transition-colors py-2 drop-shadow">Maybe later</button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-white/80 drop-shadow">Cancel anytime. Secure payment powered by Stripe.</p>
                <p className="text-xs text-white/80 drop-shadow">By continuing, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}