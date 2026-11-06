import { useParams } from 'react-router'
import { TicketDetailView } from '../../components/tickets/TicketDetailView'

/** Full-page ticket (technicians, direct links, "open full page" from the side panel). */
export default function TicketDetailPage() {
  const { ticketId = '' } = useParams()
  return <TicketDetailView ticketId={ticketId} variant="page" />
}
