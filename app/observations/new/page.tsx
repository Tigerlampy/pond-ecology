import { Suspense } from 'react'
import ObservationForm from '@/components/observations/ObservationForm'

export default function NewObservationPage() {
  return (
    <Suspense>
      <ObservationForm />
    </Suspense>
  )
}
