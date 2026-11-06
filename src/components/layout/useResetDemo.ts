import { useNavigate } from 'react-router'
import { actions } from '../../store/actions'
import { useAppDispatch } from '../../store/hooks'

/** Presenter control: confirm, restore the original sample data, and go to the login screen. */
export function useResetDemo() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  return () => {
    if (!window.confirm('Reset all demo data to the original sample data? This also logs out.')) return
    dispatch(actions.resetDemo())
    navigate('/login')
  }
}
