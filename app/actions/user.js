import { fetch } from '../utils/ApiFetch'

export const fetchUserInfo = () => {
  return fetch(`${YPMEI.server.urlPrefix}/user/userInfo`)
}
