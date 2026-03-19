import { type RouteDefinition } from '../index';

export const notice = (): RouteDefinition<'get'> => ({
    url: '/verify-email',
    method: 'get',
})
notice.url = () => '/verify-email'

export const send = (): RouteDefinition<'post'> => ({
    url: '/email/verification-notification',
    method: 'post',
})
send.url = () => '/email/verification-notification'

export default { notice, send };
