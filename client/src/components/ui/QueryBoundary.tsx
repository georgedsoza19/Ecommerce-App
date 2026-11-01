import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { getErrorMessage } from '../../api/client'
import { Alert } from './Alert'
import { Button } from './Button'
import { LoadingBlock } from './Spinner'

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  loading?: ReactNode
  errorTitle?: string
}

/** Renders loading and error states for a query, then hands data to children. */
export function QueryBoundary<T>({ query, children, loading, errorTitle = 'Could not load this content' }: QueryBoundaryProps<T>) {
  if (query.isPending) return <>{loading ?? <LoadingBlock />}</>
  if (query.isError) {
    return (
      <Alert
        variant="error"
        title={errorTitle}
        action={
          <Button size="sm" variant="secondary" onClick={() => query.refetch()}>
            Try again
          </Button>
        }
      >
        {getErrorMessage(query.error)}
      </Alert>
    )
  }
  return <>{children(query.data)}</>
}
