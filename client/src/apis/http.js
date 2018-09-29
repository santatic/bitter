import axios from 'axios'

const token = '7350c09a2b9015bf11f5e74cc1ea90bc638f24ad60cc866cbb14cb1a39fbecad'
export const HTTP = axios.create({
  baseURL: `http://localhost:1337`,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})
