import { createClient } from 'urql'

const APIURL = "https://api.lens.dev"

export const client = new createClient({
  url: APIURL
})