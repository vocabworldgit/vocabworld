import { SUBSCRIPTION_PLANS } from '@/lib/subscription/subscription-plans'

export default function TestSimplePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Simple Subscription Test</h1>
      
      <div className="space-y-4">
        <p>Testing if subscription plans load:</p>
        
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div key={plan.id} className="border p-4 rounded">
            <h3 className="font-bold">{plan.name}</h3>
            <p>${plan.price}/{plan.interval}</p>
            <ul>
              {plan.features.map((feature, index) => (
                <li key={index}>• {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}