import { redirect } from 'react-router'

export async function loader({ params }: { params: { eventID: string } }) {
  return redirect(`/events/${params.eventID}/overview`)
}

export default function Index() {
  return null
}
