import { notFound } from 'next/navigation'
import { getApprovalByToken } from '@/actions/approvals'
import { ReviewClient } from './client'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const approval = await getApprovalByToken(token)
  if (!approval) notFound()

  return <ReviewClient approval={approval} token={token} />
}
