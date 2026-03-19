import { type RouteDefinition } from '../index';

export const request = (): RouteDefinition<'get'> => ({
    url: '/forgot-password',
    method: 'get',
})
request.url = () => '/forgot-password'

export const email = (): RouteDefinition<'post'> => ({
    url: '/forgot-password',
    method: 'post',
})
email.url = () => '/forgot-password'

export const reset = (args: { token: string | number }): RouteDefinition<'get'> => ({
    url: `/reset-password/${args.token}`,
    method: 'get',
})
reset.url = (args: { token: string | number }) => `/reset-password/${args.token}`

export const store = (): RouteDefinition<'post'> => ({
    url: '/reset-password',
    method: 'post',
})
store.url = () => '/reset-password'

export const confirm = (): RouteDefinition<'get'> => ({
    url: '/confirm-password',
    method: 'get',
})
confirm.url = () => '/confirm-password'

export default { request, email, reset, store, confirm };
