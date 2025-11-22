'use client'

import { useState, useEffect } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface EmbeddedCheckoutFormProps {
  onSuccess: () => void
  onError: (error: string) => void
  loading: boolean
  planId: string
  paymentIntentId: string | null
}

export function EmbeddedCheckoutForm({
  onSuccess,
  onError,
  loading,
  planId,
  paymentIntentId
}: EmbeddedCheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!stripe) return

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    )

    if (!clientSecret) return

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment succeeded!')
          break
        case 'processing':
          setMessage('Your payment is processing.')
          break
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.')
          break
        default:
          setMessage('Something went wrong.')
          break
      }
    })
  }, [stripe])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An error occurred.')
        onError(error.message || 'Payment failed')
      } else {
        setMessage('An unexpected error occurred.')
        onError('An unexpected error occurred.')
      }
      setIsProcessing(false)
    } else {
      // Payment succeeded - webhook will handle activation
      console.log('💳 Payment confirmed successfully')
      setMessage('Payment succeeded!')
      setIsComplete(true)
      
      // Call success callback which will refresh the page
      setTimeout(() => {
        onSuccess()
      }, 1000)
      
      setIsProcessing(false)
    }
  }

  const paymentElementOptions = {
    layout: 'tabs' as const,
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
  }

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
        <span className="ml-2 text-white/80">Loading payment form...</span>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Payment Successful!</h3>
        <p className="text-white/80">Thank you for subscribing to VocabWorld Unlimited.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Payment Method
          </label>
          <div className="payment-element-container">
            <PaymentElement 
              options={paymentElementOptions}
              className="payment-element"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Billing Address
          </label>
          <div className="address-element-container">
            <AddressElement 
              options={{
                mode: 'billing',
                allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE'],
              }}
              className="address-element"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg backdrop-blur-sm ${
          message.includes('succeeded') 
            ? 'bg-green-500/20 border border-green-500/50 text-green-100' 
            : 'bg-red-500/20 border border-red-500/50 text-red-100'
        }`}>
          {message.includes('succeeded') ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm drop-shadow">{message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base h-12 shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Complete Payment - ${planId === 'yearly' ? '$29.00' : '$4.99'}`
        )}
      </Button>

      <div className="text-center">
        <p className="text-xs text-white/60">
          Your payment is secured with 256-bit SSL encryption
        </p>
      </div>
    </form>
  )
}