import { Link } from 'react-router-dom'
import { buttonClasses } from '../../components/ui/button-styles'
import { EmptyState } from '../../components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <div className="container-page py-20">
      <EmptyState
        title="This page doesn't exist"
        description="The link may be broken or the page may have moved."
        action={
          <Link to="/" className={buttonClasses()}>
            Back to home
          </Link>
        }
      />
    </div>
  )
}
