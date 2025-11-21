import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function TestComponentsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Component Test</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a test card to verify components work.</p>
          <Badge className="mr-2">Test Badge</Badge>
          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  )
}