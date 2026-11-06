import { useNavigate } from 'react-router'
import { actions } from '../../store/actions'
import { useSimulator } from '../../sim/simulatorContext'
import { useAppDispatch } from '../../store/hooks'

/** Presenter control: confirm, restore the original sample data, and go to the login screen. */
export function useResetDemo() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { clearAllFaults } = useSimulator()
  return () => {
    if (!window.confirm('Reset all demo data to the original sample data? This also logs out.')) return
    // Same click → React applies both together, so no stale fault re-raises an alert.
    clearAllFaults()
    dispatch(actions.resetDemo())
    navigate('/login')
  }
}
