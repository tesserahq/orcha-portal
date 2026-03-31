import { redirect } from 'react-router'

export async function loader({ params }: { params: { source_id: string } }) {
  return redirect(`/sources/${params.source_id}/overview`)
}

export default function Index() {
  return null
}
